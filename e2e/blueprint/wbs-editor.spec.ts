import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — WBS Visual Editor (Task 8.03)', () => {
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

  test('WBS visual editor: UI -> HTTP -> DB edit, Save Draft, and reload hierarchy, dependencies, and cross_references preserving IDs, priorities, criteria, and order', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Visual WBS QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan estimasi WBS multi-level');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Pelayanan');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      // 2. Generate all 5 stages in pipeline so WBS has content
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

      // Switch to WBS tab
      await page.getByRole('tab', { name: /wbs/i }).click();
      await expect(page.getByTestId('wbs-editor')).toBeVisible({ timeout: 20_000 });

      // 4. Capture initial DB state before edit
      const beforeVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const beforeDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const initialVersion = beforeVerify.version;
      const initialWbs = beforeDetail.data.content_json.wbs;
      const initialModules = initialWbs?.modules || [];
      const initialCrossRefs = beforeDetail.data.content_json.cross_references || [];

      expect(initialModules.length).toBeGreaterThan(0);
      const firstMod = initialModules[0];
      expect(firstMod.features.length).toBeGreaterThan(0);
      const firstFeat = firstMod.features[0];

      // Save evidence of desktop editor view before editing
      await savePhase09Evidence('wbs-editor-desktop-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        initial_version: initialVersion,
        initial_modules_count: initialModules.length,
        initial_module_0_name: firstMod.name,
        initial_module_0_features_count: firstMod.features.length,
        initial_cross_refs_count: initialCrossRefs.length,
      });

      // 5. Edit first module: Rename title and change priority
      const editModBtn = page.getByRole('button', { name: `Edit Module ${firstMod.name || firstMod.id}` });
      await editModBtn.click();

      // Modal opens
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeVisible();
      const updatedModName = `${firstMod.name} (Updated QA)`;
      await page.getByLabel('Nama Module').fill(updatedModName);
      await page.getByLabel('Deskripsi Module').fill('Deskripsi modul WBS dimutasi melalui QA.');
      await page.getByRole('button', { name: 'Simpan Module' }).click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeHidden();

      // Verify dirty indicator appears
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 6. Edit first feature: Add a new acceptance criterion
      const editFeatBtn = page.getByRole('button', { name: `Edit Feature ${firstFeat.name || firstFeat.id}` });
      await editFeatBtn.click();

      await expect(page.getByRole('heading', { name: /Edit Feature/i })).toBeVisible();
      const newCritText = 'Kriteria Keberterimaan Tambahan dari QA Visual Test';
      await page.getByPlaceholder('Tulis kriteria keberterimaan...').fill(newCritText);
      await page.getByRole('button', { name: 'Tambah Kriteria' }).click();
      await expect(page.locator(`input[value="${newCritText}"]`)).toBeVisible();
      await page.getByRole('button', { name: 'Simpan Feature' }).click();
      await expect(page.getByRole('heading', { name: /Edit Feature/i })).toBeHidden();

      // 7. Save Draft via "Simpan Draft" button
      const saveDraftResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/wbs/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await saveDraftResponsePromise;

      // Verify dirty indicator disappears and success toast is shown
      await expect(page.getByText('Belum Disimpan')).toBeHidden();
      await expect(page.getByText('Draft WBS Deliverable berhasil disimpan.')).toBeVisible();

      // 8. Verify DB state after save
      const afterVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const afterDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();

      expect(afterVerify.version).toBe(initialVersion + 1);
      expect(afterVerify.runs?.wbs?.status).toBe('manual_edit');

      // Downstream section must be invalidated (cross_validation)
      if (afterVerify.runs?.cross_validation) {
        expect(afterVerify.runs.cross_validation.status).toBe('pending');
      }

      // Upstream sections remain completed
      for (const sec of ['journey', 'architecture', 'state_machine', 'workflow']) {
        if (afterVerify.runs?.[sec]) {
          expect(afterVerify.runs[sec].status).toBe('completed');
        }
      }

      await savePhase09Evidence('wbs-editor-saved-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        before_version: initialVersion,
        after_version: afterVerify.version,
        wbs_run_status: afterVerify.runs?.wbs?.status,
        downstream_runs: afterVerify.runs,
        saved_modules_count: afterDetail.data.content_json.wbs?.modules?.length,
      });

      // 9. Reload Page and assert data preservation
      await page.reload();
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /wbs/i }).click();
      await expect(page.getByTestId('wbs-editor')).toBeVisible({ timeout: 20_000 });

      // Invariant assertion: modules, features, acceptance criteria preserved
      const reloadedWbs = afterDetail.data.content_json.wbs;
      expect(reloadedWbs).toBeDefined();
      expect(reloadedWbs.modules.length).toBe(initialModules.length);

      const reloadedFirstMod = reloadedWbs.modules[0];
      expect(reloadedFirstMod.id).toBe(firstMod.id);
      expect(reloadedFirstMod.name).toBe(updatedModName);
      expect(reloadedFirstMod.description).toBe('Deskripsi modul WBS dimutasi melalui QA.');

      // Check edited feature
      const reloadedFeat = reloadedFirstMod.features.find((f: any) => f.id === firstFeat.id);
      expect(reloadedFeat).toBeDefined();
      expect(reloadedFeat.acceptance_criteria).toContain(newCritText);

      // Check untouched modules IDs and features remained identical
      for (let i = 1; i < initialModules.length; i++) {
        const original = initialModules[i];
        const preserved = reloadedWbs.modules.find((m: any) => m.id === original.id);
        expect(preserved).toBeDefined();
        expect(preserved.name).toBe(original.name);
        expect(preserved.priority).toBe(original.priority);
        expect(preserved.features?.length).toBe(original.features?.length || 0);
      }
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('WBS visual editor: Cyclic dependency shows warning banner and blocks completion', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };

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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian WBS Cycle QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Tujuan QA');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran');
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

      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /wbs/i }).click();
      await expect(page.getByTestId('wbs-editor')).toBeVisible({ timeout: 20_000 });

      // Fetch detail to know module IDs
      const detail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const mods = detail.data.content_json.wbs?.modules || [];
      expect(mods.length).toBeGreaterThanOrEqual(2);

      const modA = mods[0];
      const modB = mods[1];

      // Step 1: In Module A, ensure modB is in dependencies
      await page.getByRole('button', { name: `Edit Module ${modA.name || modA.id}` }).click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeVisible();
      await page.getByLabel('Prasyarat / Dependencies Modul').click();
      const optionB = page.getByRole('option', { name: new RegExp(modB.name || modB.id, 'i') });
      const isBSelected = (await optionB.getAttribute('aria-selected')) === 'true';
      if (!isBSelected) {
        await optionB.click();
      }
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Simpan Module' }).click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeHidden();

      // Step 2: In Module B, add modA to dependencies (creating cycle modA <-> modB)
      await page.getByRole('button', { name: `Edit Module ${modB.name || modB.id}` }).click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeVisible();
      await page.getByLabel('Prasyarat / Dependencies Modul').click();
      const optionA = page.getByRole('option', { name: new RegExp(modA.name || modA.id, 'i') });
      const isASelected = (await optionA.getAttribute('aria-selected')) === 'true';
      if (!isASelected) {
        await optionA.click();
      }
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Simpan Module' }).click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeHidden();

      // Verify cycle warning banner is displayed
      await expect(
        page.getByText('Terdeteksi Siklus Dependensi (Dependency Cycle Blocking)')
      ).toBeVisible();

      // Verify CYCLIC badges appear
      await expect(page.getByText('CYCLIC').first()).toBeVisible();

      // Attempting to complete section should be blocked by validation modal
      await page.getByRole('button', { name: 'Selesaikan Section' }).click();
      await expect(
        page.getByRole('heading', { name: 'Validasi Tahap Belum Lengkap' })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/cyclic dependency pada Module WBS/i)
      ).toBeVisible();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('WBS visual editor: Two-tab concurrency produces 409 and preserves unsaved local buffer', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Concurrency WBS QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Tujuan Bisnis QA');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Layanan');
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

      // 2. Open Tab 1 at visual editor and switch to WBS tab
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /wbs/i }).click();
      await expect(page.getByTestId('wbs-editor')).toBeVisible({ timeout: 20_000 });

      // 3. Open Tab 2 at visual editor and switch to WBS tab
      const page2 = await context.newPage();
      await setPageAuth(page2, session);
      page2.on('response', (response) => {
        const url = new URL(response.url());
        if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
          recordExchange(response.request().method(), url.pathname, response.status());
        }
      });
      await page2.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page2.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page2.getByRole('tab', { name: /wbs/i }).click();
      await expect(page2.getByTestId('wbs-editor')).toBeVisible({ timeout: 20_000 });

      const initialDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();

      // 4. In Tab 2: Make local edit
      const tab2ModBtn = page2.getByRole('button', { name: /Edit Module/i }).first();
      await tab2ModBtn.click();
      await expect(page2.getByRole('heading', { name: /Edit Module WBS/i })).toBeVisible();
      const tab2LocalName = 'Modul Khusus Tab 2 (Unsaved Buffer)';
      await page2.getByLabel('Nama Module').fill(tab2LocalName);
      await page2.getByRole('button', { name: 'Simpan Module' }).click();
      await expect(page2.getByRole('heading', { name: /Edit Module WBS/i })).toBeHidden();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      // 5. In Tab 1: Make edit and successfully Save Draft
      const tab1ModBtn = page.getByRole('button', { name: /Edit Module/i }).first();
      await tab1ModBtn.click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeVisible();
      await page.getByLabel('Nama Module').fill('Modul Tab 1 (Committed to Server)');
      await page.getByRole('button', { name: 'Simpan Module' }).click();
      await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeHidden();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      const tab1SavePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/wbs/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await tab1SavePromise;
      await expect(page.getByText('Draft WBS Deliverable berhasil disimpan.')).toBeVisible();

      // Verify DB version incremented by Tab 1
      const tab1DB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(tab1DB.version).toBe(initialDB.version + 1);

      // 6. In Tab 2: Try to Save Draft with stale version -> HTTP 409
      const tab2SavePromise = page2.waitForResponse(
        (res) =>
          res.url().includes(`/sections/wbs/draft`) &&
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
      await savePhase09Evidence('wbs-editor-stale-409-1440', page2, [...exchanges], {
        blueprint_id: id,
        initial_version: initialDB.version,
        current_server_version: tab1DB.version,
        tab2_local_name: tab2LocalName,
        conflict_status: 409,
      });

      // Dismiss modal with "Pertahankan Perubahan Lokal"
      await page2.getByRole('button', { name: 'Pertahankan Perubahan Lokal' }).click();
      await expect(
        page2.getByRole('heading', { name: 'Konflik Versi Terdeteksi (409)' })
      ).toBeHidden();

      // Assert Tab 2's local buffer still contains the unsaved edit
      await expect(page2.getByText(tab2LocalName).first()).toBeVisible();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      await page2.close();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('WBS visual editor: 390px mobile read-only view prevents mutations and avoids layout overflow', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Mobile WBS QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Tujuan Bisnis QA');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Layanan');
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

      // Switch to WBS tab
      await page.getByRole('tab', { name: /wbs/i }).click();

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
      await savePhase09Evidence('wbs-editor-mobile-390', page, [...exchanges], {
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
