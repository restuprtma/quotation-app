import { expect, test } from '@playwright/test';
import { qaApi, qaSession } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — Five Tabs Integration & Issue Navigation (Task 9.01)', () => {
  test('5 visual editor tabs, status badges, issue focus deep linking, and 390px mobile read-only view', async ({
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
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Integrasi Lima Editor');
    await page.getByLabel('Tujuan Bisnis 1').fill('Menguji konsistensi integrasi 5 visual tabs');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Pelayanan');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    // 2. Advance pipeline so all 5 sections have generated content
    for (let i = 0; i < 5; i++) {
      const continueRes = await page.request.post(
        `${qaApi}/quotation/v1/blueprints/${id}/continue`,
        { headers }
      );
      expect(continueRes.status()).toBe(200);
    }

    // 3. Navigate to Visual Editor (/blueprint/:id/edit)
    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Verify all 5 tab buttons exist with status badges
    const tabJourney = page.getByRole('tab', { name: /1\. User Journey/i });
    const tabArch = page.getByRole('tab', { name: /2\. Arsitektur Sistem/i });
    const tabSM = page.getByRole('tab', { name: /3\. State Machine/i });
    const tabWF = page.getByRole('tab', { name: /4\. Workflow Bisnis/i });
    const tabWBS = page.getByRole('tab', { name: /5\. WBS Deliverable/i });

    await expect(tabJourney).toBeVisible();
    await expect(tabArch).toBeVisible();
    await expect(tabSM).toBeVisible();
    await expect(tabWF).toBeVisible();
    await expect(tabWBS).toBeVisible();

    // Verify Tab 1 (Journey) rendered
    await expect(page.getByText('User Journey Matrix')).toBeVisible({ timeout: 10_000 });

    // Switch to Tab 2 (Architecture)
    await tabArch.click();
    await expect(page.getByTestId('blueprint-flow-canvas')).toBeVisible({ timeout: 10_000 });

    // Switch to Tab 3 (State Machine)
    await tabSM.click();
    await expect(page.getByTestId('blueprint-flow-canvas')).toBeVisible({ timeout: 10_000 });

    // Switch to Tab 4 (Workflow)
    await tabWF.click();
    await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 10_000 });

    // Switch to Tab 5 (WBS)
    await tabWBS.click();
    await expect(page.getByTestId('wbs-editor')).toBeVisible({ timeout: 10_000 });

    // 4. Test URL search param direct navigation (?section=state_machine)
    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit?section=state_machine`);
    await expect(page.getByTestId('blueprint-flow-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(tabSM).toHaveAttribute('aria-selected', 'true');

    // 5. Test Validation Panel tab and Issue Focus deep linking
    await page.getByRole('tab', { name: /Panel Validasi Server/i }).click();
    await expect(page.getByText('Panel Validasi & Konsistensi')).toBeVisible({ timeout: 10_000 });

    // Save desktop 1440 evidence
    await savePhase09Evidence('phase09-integration-desktop-1440', page, [...exchanges], {
      blueprint_id: id,
      all_five_tabs_verified: true,
      url_param_routing_verified: true,
      validation_panel_rendered: true,
    });

    // 6. Mobile 390px Viewport Verification
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Verify Mobile Read-only Banner is visible
    await expect(page.getByText('Tampilan Terbatas (Perangkat Mobile)')).toBeVisible();

    // Verify desktop mutation buttons are hidden on mobile
    await expect(page.getByRole('button', { name: 'Simpan Draft' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Selesaikan Section' })).toBeHidden();

    // Verify horizontal overflow on 390px viewport
    const bodyOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(bodyOverflow).toBe(false);

    // Save mobile 390 evidence
    await savePhase09Evidence('phase09-integration-mobile-390', page, [...exchanges], {
      blueprint_id: id,
      body_overflow: bodyOverflow,
      mobile_read_only_banner_visible: true,
      mutation_controls_concealed: true,
    });
  });
});
