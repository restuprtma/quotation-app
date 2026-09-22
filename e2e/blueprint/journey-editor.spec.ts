import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — Journey Visual Editor (Task 3.04)', () => {
  test.beforeEach(async ({ page }) => {
    try {
      const session = await qaSession(page);
      await page.request.post(`${qaApi}/qa/cleanup`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
    } catch {
      // Ignore if session not yet created
    }
  });

  test.afterEach(async ({ page }) => {
    try {
      const session = await qaSession(page);
      await page.request.post(`${qaApi}/qa/cleanup`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
    } catch {
      // Ignore cleanup error in afterEach
    }
  });

  test('Journey visual editor: UI -> HTTP -> DB edit, Save Draft, and reload journey preserving IDs, order, and references', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    const recordExchange = (method: string, path: string, status: number) => {
      const sanitizedPath = path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id');
      exchanges.push(`${method} ${sanitizedPath} ${status}`);
    };

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        recordExchange(response.request().method(), url.pathname, response.status());
      }
    });

    try {
      // 1. Create blueprint via UI
      await page.goto(
        `http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`
      );
      await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, {
        timeout: 20_000,
      });
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Visual Journey QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan flow antrian publik');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      // 2. Generate all 5 stages in pipeline
      for (let i = 0; i < 5; i++) {
        const continueRes = await page.request.post(
          `${qaApi}/quotation/v1/blueprints/${id}/continue`,
          { headers }
        );
        expect(continueRes.status()).toBe(200);
      }

      // 3. Navigate to Visual Editor (/blueprint/:id/edit)
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByRole('tab', { name: 'Visual Matrix Editor' })).toBeVisible({ timeout: 20_000 });

      // 4. Capture initial DB state before edit
      const beforeVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const beforeDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const initialVersion = beforeVerify.version;
      const initialPhases = beforeDetail.data.content_json.journey.phases;
      const initialActors = beforeDetail.data.content_json.journey.actors;
      const initialActivities = beforeDetail.data.content_json.journey.activities;

      expect(initialPhases.length).toBeGreaterThan(0);
      expect(initialActors.length).toBeGreaterThan(0);
      expect(initialActivities.length).toBeGreaterThan(0);

      // Save evidence of desktop editor view before editing
      await savePhase09Evidence('journey-editor-desktop-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        initial_version: initialVersion,
        initial_phases_count: initialPhases.length,
        initial_actors_count: initialActors.length,
        initial_activities_count: initialActivities.length,
      });

      // 5. Edit Journey in Visual Grid: edit first activity
      const firstActivity = initialActivities[0];
      const activityCardBtn = page
        .getByRole('button', {
          name: new RegExp(`Edit aktivitas ${firstActivity.label}`, 'i'),
        })
        .first();
      await activityCardBtn.click();

      // Modal opens
      await expect(page.getByText('Edit Journey Activity')).toBeVisible();
      const updatedLabel = `${firstActivity.label} (Updated QA)`;
      const updatedDescription =
        'Deskripsi aktivitas yang telah diperbarui melalui Visual Matrix Editor.';

      await page.getByLabel('Label Aktivitas').fill(updatedLabel);
      await page.getByLabel('Deskripsi Aktivitas').fill(updatedDescription);
      await page.getByRole('button', { name: 'Simpan Aktivitas' }).click();
      await expect(page.getByText('Edit Journey Activity')).toBeHidden();

      // Verify dirty chip appears
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 6. Save Draft via "Simpan Draft" button
      const saveDraftResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/journey/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await saveDraftResponsePromise;

      // Verify dirty indicator disappears and success toast is shown
      await expect(page.getByText('Belum Disimpan')).toBeHidden();
      await expect(page.getByText('Draft User Journey berhasil disimpan.')).toBeVisible();

      // 7. Verify DB state after save
      const afterVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const afterDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();

      expect(afterVerify.version).toBe(initialVersion + 1);
      expect(afterVerify.runs?.journey?.status).toBe('manual_edit');

      // Downstream sections must be invalidated (pending/reset)
      if (afterVerify.runs) {
        for (const sec of ['architecture', 'state_machine', 'workflow', 'wbs']) {
          if (afterVerify.runs[sec]) {
            expect(afterVerify.runs[sec].status).toBe('pending');
          }
        }
      }

      await savePhase09Evidence('journey-editor-saved-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        before_version: initialVersion,
        after_version: afterVerify.version,
        journey_run_status: afterVerify.runs?.journey?.status,
        downstream_runs: afterVerify.runs,
      });

      // 8. Reload Page and assert data preservation
      await page.reload();
      await expect(page.getByRole('tab', { name: 'Visual Matrix Editor' })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(updatedLabel)).toBeVisible();

      // Invariant assertion: IDs, order, phase_id, actor_id, references preserved
      const reloadedJourney = afterDetail.data.content_json.journey;
      expect(reloadedJourney.phases.length).toBe(initialPhases.length);
      for (let i = 0; i < initialPhases.length; i++) {
        expect(reloadedJourney.phases[i].id).toBe(initialPhases[i].id);
        expect(reloadedJourney.phases[i].order).toBe(i + 1);
      }

      expect(reloadedJourney.actors.length).toBe(initialActors.length);
      for (let i = 0; i < initialActors.length; i++) {
        expect(reloadedJourney.actors[i].id).toBe(initialActors[i].id);
        expect(reloadedJourney.actors[i].order).toBe(i + 1);
      }

      // Check edited activity
      const editedAct = reloadedJourney.activities.find((a: any) => a.id === firstActivity.id);
      expect(editedAct).toBeDefined();
      expect(editedAct.label).toBe(updatedLabel);
      expect(editedAct.description).toBe(updatedDescription);
      expect(editedAct.phase_id).toBe(firstActivity.phase_id);
      expect(editedAct.actor_id).toBe(firstActivity.actor_id);
      expect(editedAct.references).toEqual(firstActivity.references || []);

      // Check untouched activities IDs and references remained identical
      for (let i = 1; i < initialActivities.length; i++) {
        const original = initialActivities[i];
        const preserved = reloadedJourney.activities.find((a: any) => a.id === original.id);
        expect(preserved).toBeDefined();
        expect(preserved.label).toBe(original.label);
        expect(preserved.phase_id).toBe(original.phase_id);
        expect(preserved.actor_id).toBe(original.actor_id);
        expect(preserved.references).toEqual(original.references || []);
      }
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('Journey visual editor: Two-tab concurrency produces 409 and preserves unsaved local buffer', async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    const recordExchange = (method: string, path: string, status: number) => {
      const sanitizedPath = path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id');
      exchanges.push(`${method} ${sanitizedPath} ${status}`);
    };

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        recordExchange(response.request().method(), url.pathname, response.status());
      }
    });

    try {
      // 1. Create blueprint and complete initial generation
      await page.goto(
        `http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`
      );
      await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, {
        timeout: 20_000,
      });
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Concurrency QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Tujuan Bisnis QA');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      for (let i = 0; i < 5; i++) {
        const continueRes = await page.request.post(
          `${qaApi}/quotation/v1/blueprints/${id}/continue`,
          { headers }
        );
        expect(continueRes.status()).toBe(200);
      }

      // 2. Open Tab 1 at visual editor
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByRole('tab', { name: 'Visual Matrix Editor' })).toBeVisible({ timeout: 20_000 });

      // 3. Open Tab 2 at visual editor
      const page2 = await context.newPage();
      await setPageAuth(page2, session);
      page2.on('response', (response) => {
        const url = new URL(response.url());
        if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
          recordExchange(response.request().method(), url.pathname, response.status());
        }
      });
      await page2.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page2.getByRole('tab', { name: 'Visual Matrix Editor' })).toBeVisible({ timeout: 20_000 });

      const initialDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();

      // 4. In Tab 2: Make local edit (edit first activity)
      const tab2ActivityBtn = page2.getByRole('button', { name: /edit aktivitas/i }).first();
      await tab2ActivityBtn.click();
      await expect(page2.getByText('Edit Journey Activity')).toBeVisible();
      const tab2LocalLabel = 'Aktivitas Khusus Tab 2 (Unsaved Buffer)';
      await page2.getByLabel('Label Aktivitas').fill(tab2LocalLabel);
      await page2.getByRole('button', { name: 'Simpan Aktivitas' }).click();
      await expect(page2.getByText('Edit Journey Activity')).toBeHidden();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      // 5. In Tab 1: Make edit and successfully Save Draft
      const tab1ActivityBtn = page.getByRole('button', { name: /edit aktivitas/i }).first();
      await tab1ActivityBtn.click();
      await page.getByLabel('Label Aktivitas').fill('Aktivitas Tab 1 (Committed to Server)');
      await page.getByRole('button', { name: 'Simpan Aktivitas' }).click();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      const tab1SavePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/journey/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await tab1SavePromise;
      await expect(page.getByText('Draft User Journey berhasil disimpan.')).toBeVisible();

      // Verify DB version incremented by Tab 1
      const tab1DB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(tab1DB.version).toBe(initialDB.version + 1);

      // 6. In Tab 2: Try to Save Draft with stale version -> HTTP 409
      const tab2SavePromise = page2.waitForResponse(
        (res) =>
          res.url().includes(`/sections/journey/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 409
      );
      await page2.getByRole('button', { name: 'Simpan Draft' }).click();
      await tab2SavePromise;

      // 7. Verify 409 Conflict Dialog appears and local buffer is preserved
      await expect(
        page2.getByRole('heading', { name: 'Konflik Versi Terdeteksi (409)' })
      ).toBeVisible();

      // Save evidence of 409 dialog
      await savePhase09Evidence('journey-editor-stale-409-1440', page2, [...exchanges], {
        blueprint_id: id,
        initial_version: initialDB.version,
        current_server_version: tab1DB.version,
        tab2_local_label: tab2LocalLabel,
        conflict_status: 409,
      });

      // Dismiss modal with "Pertahankan Perubahan Lokal"
      await page2.getByRole('button', { name: 'Pertahankan Perubahan Lokal' }).click();
      await expect(
        page2.getByRole('heading', { name: 'Konflik Versi Terdeteksi (409)' })
      ).toBeHidden();

      // Assert Tab 2's local buffer still contains the unsaved edit
      await expect(page2.getByText(tab2LocalLabel)).toBeVisible();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      await page2.close();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('Journey visual editor: 390px mobile read-only view prevents mutations and avoids layout overflow', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(
          `${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`
        );
      }
    });

    try {
      // 1. Create blueprint
      await page.goto(
        `http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`
      );
      await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, {
        timeout: 20_000,
      });
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Mobile QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Tujuan Bisnis QA');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      for (let i = 0; i < 5; i++) {
        const continueRes = await page.request.post(
          `${qaApi}/quotation/v1/blueprints/${id}/continue`,
          { headers }
        );
        expect(continueRes.status()).toBe(200);
      }

      // 2. Set viewport to 390px (Mobile)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);

      // 3. Verify mobile read-only guidance
      await expect(page.getByText('Tampilan Terbatas (Perangkat Mobile)')).toBeVisible({
        timeout: 20_000,
      });

      // Verify mutation buttons are not visible on mobile
      await expect(page.getByRole('button', { name: 'Simpan Draft' })).toBeHidden();
      await expect(page.getByRole('button', { name: 'Selesaikan Section' })).toBeHidden();

      // Verify no horizontal overflow on mobile body
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);

      // Save evidence for mobile 390px
      await savePhase09Evidence('journey-editor-mobile-390', page, [...exchanges], {
        blueprint_id: id,
        viewport: { width: 390, height: 844 },
        body_overflow: overflow,
        mobile_readonly_active: true,
      });
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });
});
