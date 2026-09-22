import type { Page } from '@playwright/test';
import type { BlueprintStatus } from '../../src/module/quotation/features/blueprints/types';
import type { QASession } from './fixtures';

import { test, expect } from '@playwright/test';

import { qaApi, qaSession } from './fixtures';
import { saveEvidence } from './artifacts';

async function createBlueprintViaUI(page: Page, session: QASession, title: string): Promise<string> {
  await page.goto(
    `http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`
  );
  await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, {
    timeout: 20_000,
  });
  await page.getByLabel('Judul Blueprint').fill(title);
  await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan efisiensi antrian');
  await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
  await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
  await page.getByRole('button', { name: 'Buat Blueprint' }).click();
  await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
  return page.url().split('/').pop()!;
}

test.describe('Blueprint Provider Error Recovery & Presentation (Task 8)', () => {
  test.afterEach(async ({ page }) => {
    try {
      const session = await qaSession(page);
      await page.request.post(`${qaApi}/qa/cleanup`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
    } catch {
      // Ignore cleanup failures in afterEach
    }
  });

  test('Scenario 1: Valid credential + provider_unavailable displays availability guidance and retry/manual actions, without configuration banner', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(
          `${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`
        );
      }
    });

    const id = await createBlueprintViaUI(page, session, 'Sistem Antrian Provider Unavailable QA');

    const unavailableStatus: BlueprintStatus = {
      blueprint_id: id,
      revision_id: session.revision_id,
      title: 'Sistem Antrian Provider Unavailable QA',
      generation_status: 'failed',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [
        {
          type: 'context',
          status: 'completed',
          attempts: 1,
          started_at: '2026-09-22T06:00:00Z',
          completed_at: '2026-09-22T06:00:01Z',
          updated_at: '2026-09-22T06:00:01Z',
        },
        {
          type: 'journey',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_unavailable',
          safe_error_code: 'provider_unavailable',
          started_at: '2026-09-22T06:00:02Z',
          updated_at: '2026-09-22T06:00:03Z',
        },
        { type: 'architecture', status: 'pending', attempts: 0 },
        { type: 'state_machine', status: 'pending', attempts: 0 },
        { type: 'workflow', status: 'pending', attempts: 0 },
        { type: 'wbs', status: 'pending', attempts: 0 },
        { type: 'cross_validation', status: 'pending', attempts: 0 },
      ],
      created_at: '2026-09-22T06:00:00Z',
      updated_at: '2026-09-22T06:00:03Z',
    };

    await page.route(`**/quotation/v1/blueprints/${id}/generation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: unavailableStatus, message: 'Status loaded', errors: null }),
      });
    });

    await page.route(`**/quotation/v1/blueprints/${id}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              status: unavailableStatus,
              quotation_id: session.quotation_id,
              source_quotation_revision_id: session.revision_id,
              content_json: {},
              validation_result: {},
              cross_validation_result: {},
            },
            message: 'Detail loaded',
            errors: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // 1. Assert availability error title and message are visible
    await expect(page.getByText('Layanan AI Provider Tidak Tersedia')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText('Layanan AI Provider sedang mengalami gangguan atau tidak dapat dihubungi.')
    ).toBeVisible();

    // 2. Assert configuration missing banner is NOT displayed
    await expect(page.getByText('Konfigurasi AI Provider Belum Diatur')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Buka Pengaturan' })).toBeHidden();

    // 3. Assert section retry action ("Coba Lagi") is offered in banner and section list
    await expect(
      page.getByRole('alert').filter({ hasText: 'Layanan AI Provider Tidak Tersedia' }).getByRole('button', { name: 'Coba Lagi' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coba Lagi tahap User Journey' })).toBeVisible();

    // 4. Assert manual completion action ("Lengkapi Manual") is offered in section list
    await expect(page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' })).toBeVisible();

    await saveEvidence('provider-unavailable-recovery', page, exchanges, {
      scenario: 'provider_unavailable',
      title_verified: true,
      config_banner_hidden: true,
      retry_offered: true,
      manual_offered: true,
    });
  });

  test('Scenario 2: provider_configuration error code shows configuration banner and settings action', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(
          `${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`
        );
      }
    });

    const id = await createBlueprintViaUI(page, session, 'Sistem Antrian Provider Config QA');

    const configErrorStatus: BlueprintStatus = {
      blueprint_id: id,
      revision_id: session.revision_id,
      title: 'Sistem Antrian Provider Config QA',
      generation_status: 'failed',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [
        {
          type: 'context',
          status: 'completed',
          attempts: 1,
          started_at: '2026-09-22T06:00:00Z',
          completed_at: '2026-09-22T06:00:01Z',
          updated_at: '2026-09-22T06:00:01Z',
        },
        {
          type: 'journey',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_configuration',
          safe_error_code: 'provider_configuration',
          started_at: '2026-09-22T06:00:02Z',
          updated_at: '2026-09-22T06:00:03Z',
        },
        { type: 'architecture', status: 'pending', attempts: 0 },
        { type: 'state_machine', status: 'pending', attempts: 0 },
        { type: 'workflow', status: 'pending', attempts: 0 },
        { type: 'wbs', status: 'pending', attempts: 0 },
        { type: 'cross_validation', status: 'pending', attempts: 0 },
      ],
      created_at: '2026-09-22T06:00:00Z',
      updated_at: '2026-09-22T06:00:03Z',
    };

    await page.route(`**/quotation/v1/blueprints/${id}/generation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: configErrorStatus, message: 'Status loaded', errors: null }),
      });
    });

    await page.route(`**/quotation/v1/blueprints/${id}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              status: configErrorStatus,
              quotation_id: session.quotation_id,
              source_quotation_revision_id: session.revision_id,
              content_json: {},
              validation_result: {},
              cross_validation_result: {},
            },
            message: 'Detail loaded',
            errors: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // 1. Assert configuration banner is visible
    await expect(page.getByText('Konfigurasi AI Provider Belum Diatur')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText('Kunci API atau konfigurasi AI Provider belum ditentukan.')
    ).toBeVisible();

    // 2. Assert settings action button is visible in the alert banner
    await expect(
      page.getByRole('alert').filter({ hasText: 'Konfigurasi AI Provider Belum Diatur' }).getByRole('button', { name: 'Buka Pengaturan' })
    ).toBeVisible();

    // 3. Assert availability error is NOT displayed
    await expect(page.getByText('Layanan AI Provider Tidak Tersedia')).toBeHidden();

    await saveEvidence('provider-configuration-recovery', page, exchanges, {
      scenario: 'provider_configuration',
      config_banner_visible: true,
      settings_action_visible: true,
      availability_hidden: true,
    });
  });

  test('Scenario 3: Manual Journey transition clears old Journey error and replaces banner on Architecture failure', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(
          `${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`
        );
      }
    });

    const id = await createBlueprintViaUI(page, session, 'Sistem Antrian Journey Transition QA');

    let currentStatus: BlueprintStatus = {
      blueprint_id: id,
      revision_id: session.revision_id,
      title: 'Sistem Antrian Journey Transition QA',
      generation_status: 'failed',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [
        {
          type: 'context',
          status: 'completed',
          attempts: 1,
          started_at: '2026-09-22T06:00:00Z',
          completed_at: '2026-09-22T06:00:01Z',
          updated_at: '2026-09-22T06:00:01Z',
        },
        {
          type: 'journey',
          status: 'failed',
          attempts: 3,
          error_code: 'provider_rate_limited',
          safe_error_code: 'provider_rate_limited',
          started_at: '2026-09-22T06:00:02Z',
          updated_at: '2026-09-22T06:00:03Z',
        },
        { type: 'architecture', status: 'pending', attempts: 0 },
        { type: 'state_machine', status: 'pending', attempts: 0 },
        { type: 'workflow', status: 'pending', attempts: 0 },
        { type: 'wbs', status: 'pending', attempts: 0 },
        { type: 'cross_validation', status: 'pending', attempts: 0 },
      ],
      created_at: '2026-09-22T06:00:00Z',
      updated_at: '2026-09-22T06:00:03Z',
    };

    await page.route(`**/quotation/v1/blueprints/${id}/generation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentStatus, message: 'Status', errors: null }),
      });
    });

    await page.route(`**/quotation/v1/blueprints/${id}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              status: currentStatus,
              quotation_id: session.quotation_id,
              source_quotation_revision_id: session.revision_id,
              content_json: {},
              validation_result: {},
              cross_validation_result: {},
            },
            message: 'Detail loaded',
            errors: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/quotation/v1/blueprints/${id}/sections/journey/manual`, async (route) => {
      currentStatus = {
        ...currentStatus,
        content_version: 2,
        generation_status: 'pending',
        sections: currentStatus.sections.map((s) =>
          s.type === 'journey'
            ? {
                ...s,
                status: 'validated',
                error_code: null,
                safe_error_code: null,
                updated_at: new Date().toISOString(),
              }
            : s
        ),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentStatus, message: 'Manual completed', errors: null }),
      });
    });

    await page.route(`**/quotation/v1/blueprints/${id}/continue`, async (route) => {
      currentStatus = {
        ...currentStatus,
        content_version: 3,
        generation_status: 'partial_failed',
        sections: currentStatus.sections.map((s) => {
          if (s.type === 'journey') return { ...s, status: 'validated' };
          if (s.type === 'architecture')
            return {
              ...s,
              status: 'failed',
              attempts: 1,
              error_code: 'provider_unavailable',
              safe_error_code: 'provider_unavailable',
              updated_at: new Date().toISOString(),
            };
          return s;
        }),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentStatus, message: 'Pipeline continued', errors: null }),
      });
    });

    await page.reload();

    // 1. Assert Journey error banner at 3/3 attempts
    await expect(page.getByText('Batas Penggunaan AI Terlampaui')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Percobaan: 3/3')).toBeVisible();

    // 2. Open Manual dialog and submit valid journey data
    await page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' }).click();
    await expect(page.getByText('Lengkapi Manual: User Journey')).toBeVisible();
    await page.getByRole('button', { name: 'Tambah Phase' }).click();
    await page.getByLabel('Label Phase 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Tambah Actor' }).click();
    await page.getByLabel('Label Actor 1').fill('Pemohon Layanan');
    await page.getByRole('button', { name: 'Tambah Activity' }).click();
    await page.getByLabel('Label Activity 1').fill('Ambil tiket antrean');
    await page.getByLabel('Deskripsi Activity 1').fill('Pemohon mengambil tiket antrean.');
    await page.getByRole('button', { name: 'Simpan & Validasi' }).click();

    // 3. Assert dialog closes and old Journey error banner is cleared
    await expect(page.getByText('Lengkapi Manual: User Journey')).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText('Batas Penggunaan AI Terlampaui')).toBeHidden();

    // 4. Assert "Lanjutkan Generasi" button is visible and click it
    const continueBtn = page.getByRole('button', { name: 'Lanjutkan Generasi' }).first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 5. Assert Architecture fails with provider_unavailable error banner replacing old error
    await expect(page.getByText('Layanan AI Provider Tidak Tersedia')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Batas Penggunaan AI Terlampaui')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Coba Lagi tahap Arsitektur Sistem' })).toBeVisible();

    await saveEvidence('journey-manual-transition-recovery', page, exchanges, {
      scenario: 'manual_journey_transition',
      journey_error_cleared: true,
      architecture_error_shown: true,
    });
  });

  test('Scenario 4: Stale lease triggers recovery, transitions to interrupted with single continue and single retry', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(
          `${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`
        );
      }
    });

    const id = await createBlueprintViaUI(page, session, 'Sistem Antrian Stale Recovery QA');

    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();

    let currentStatus: BlueprintStatus = {
      blueprint_id: id,
      revision_id: session.revision_id,
      title: 'Sistem Antrian Stale Recovery QA',
      generation_status: 'in_progress',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [
        {
          type: 'context',
          status: 'completed',
          attempts: 1,
          started_at: sixMinutesAgo,
          completed_at: sixMinutesAgo,
          updated_at: sixMinutesAgo,
        },
        {
          type: 'journey',
          status: 'in_progress',
          attempts: 1,
          started_at: sixMinutesAgo,
          updated_at: sixMinutesAgo,
        },
        { type: 'architecture', status: 'pending', attempts: 0 },
        { type: 'state_machine', status: 'pending', attempts: 0 },
        { type: 'workflow', status: 'pending', attempts: 0 },
        { type: 'wbs', status: 'pending', attempts: 0 },
        { type: 'cross_validation', status: 'pending', attempts: 0 },
      ],
      created_at: sixMinutesAgo,
      updated_at: sixMinutesAgo,
    };

    let continueRequestCount = 0;
    let retryRequestCount = 0;

    await page.route(`**/quotation/v1/blueprints/${id}/generation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentStatus, message: 'Status', errors: null }),
      });
    });

    await page.route(`**/quotation/v1/blueprints/${id}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              status: currentStatus,
              quotation_id: session.quotation_id,
              source_quotation_revision_id: session.revision_id,
              content_json: {},
              validation_result: {},
              cross_validation_result: {},
            },
            message: 'Detail loaded',
            errors: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/quotation/v1/blueprints/${id}/continue`, async (route) => {
      continueRequestCount++;
      // Authoritative response moves stale section to interrupted state
      currentStatus = {
        ...currentStatus,
        content_version: 2,
        generation_status: 'in_progress',
        sections: currentStatus.sections.map((s) =>
          s.type === 'journey'
            ? {
                ...s,
                status: 'interrupted',
                attempts: 1,
                error_code: 'interrupted',
                safe_error_code: 'interrupted',
                updated_at: new Date().toISOString(),
              }
            : s
        ),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentStatus, message: 'Recovered to interrupted', errors: null }),
      });
    });

    await page.route(`**/quotation/v1/blueprints/${id}/sections/journey/retry`, async (route) => {
      retryRequestCount++;
      currentStatus = {
        ...currentStatus,
        content_version: 3,
        generation_status: 'in_progress',
        sections: currentStatus.sections.map((s) =>
          s.type === 'journey'
            ? {
                ...s,
                status: 'in_progress',
                attempts: 2,
                error_code: null,
                safe_error_code: null,
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : s
        ),
        updated_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentStatus, message: 'Retrying section', errors: null }),
      });
    });

    await page.reload();

    // 1. Assert stale lease banner and "Periksa & Pulihkan" button appear
    await expect(page.getByText('Stale Lease Terdeteksi')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText('Pipeline tidak menerima pembaruan selama lebih dari 5 menit.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Periksa & Pulihkan' })).toBeVisible();

    // 2. Assert "Lanjutkan Generasi" button is suppressed during stale recovery
    await expect(page.getByRole('button', { name: 'Lanjutkan Generasi' })).toBeHidden();

    // 3. Click "Periksa & Pulihkan" and verify exactly ONE continue recovery call is triggered
    await page.getByRole('button', { name: 'Periksa & Pulihkan' }).click();

    // 4. Assert stale banner disappears and interrupted state is rendered
    await expect(page.getByText('Stale Lease Terdeteksi')).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText('Proses Generasi Terputus')).toBeVisible();
    await expect(page.getByText('Terputus', { exact: true })).toBeVisible();
    expect(continueRequestCount).toBe(1);

    // 5. In interrupted state, assert explicit section retry is revealed and "Lanjutkan Generasi" remains suppressed
    await expect(page.getByRole('button', { name: 'Coba Lagi tahap User Journey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lanjutkan Generasi' })).toBeHidden();

    // 6. Click explicit section "Coba Lagi" and verify exactly ONE retry request is triggered
    await page.getByRole('button', { name: 'Coba Lagi tahap User Journey' }).click();
    await expect(page.getByText('Sedang Diproses', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    expect(retryRequestCount).toBe(1);

    await saveEvidence('stale-lease-recovery-transition', page, exchanges, {
      scenario: 'stale_lease_recovery',
      continue_count: continueRequestCount,
      retry_count: retryRequestCount,
      interrupted_rendered: true,
    });
  });
});
