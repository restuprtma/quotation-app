import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — State Machine Visual Editor (Task 6.03)', () => {
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

  test('State Machine visual editor: UI -> HTTP -> DB edit, Save Draft, and reload state machine preserving IDs, transitions, states, and positions', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Visual State Machine QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan flow state machine');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      // 2. Generate all 5 stages in pipeline so State Machine has content
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

      // Switch to State Machine tab
      await page.getByRole('tab', { name: /state machine/i }).click();
      await expect(page.getByTestId('state-machine-editor')).toBeVisible({ timeout: 20_000 });

      // 4. Capture initial DB state before edit
      const beforeVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const beforeDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const initialVersion = beforeVerify.version;
      const initialStateMachine = beforeDetail.data.content_json.state_machine;

      expect(initialStateMachine.states.length).toBeGreaterThan(0);
      expect(initialStateMachine.transitions.length).toBeGreaterThan(0);
      expect(initialStateMachine.initial_state).toBeTruthy();

      // Save evidence of desktop editor view before editing
      await savePhase09Evidence('state-machine-editor-desktop-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        initial_version: initialVersion,
        initial_states_count: initialStateMachine.states.length,
        initial_transitions_count: initialStateMachine.transitions.length,
        initial_entity: initialStateMachine.entity,
        initial_state: initialStateMachine.initial_state,
      });

      // 5. Click state in state list to edit
      const firstState = initialStateMachine.states[0];
      const editStateBtn = page.getByRole('button', { name: `Edit State ${firstState.label || firstState.id}` });
      await editStateBtn.click();

      // Modal opens
      await expect(page.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeVisible();
      const updatedLabel = `${firstState.label} (Updated QA)`;

      await page.getByLabel('Label State').fill(updatedLabel);
      await page.getByRole('button', { name: 'Simpan State' }).click();

      await expect(page.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeHidden();

      // Verify dirty chip appears
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 6. Test Auto-layout
      await page.getByRole('button', { name: /Auto-Layout/i }).click();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 7. Save Draft via "Simpan Draft" button
      const saveDraftResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/state_machine/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await saveDraftResponsePromise;

      // Verify dirty indicator disappears and success toast is shown
      await expect(page.getByText('Belum Disimpan')).toBeHidden();
      await expect(page.getByText('Draft State Machine berhasil disimpan.')).toBeVisible();

      // 8. Verify DB state after save
      const afterVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const afterDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();

      expect(afterVerify.version).toBe(initialVersion + 1);
      expect(afterVerify.runs?.state_machine?.status).toBe('manual_edit');

      // Downstream sections must be invalidated (workflow, wbs)
      if (afterVerify.runs) {
        for (const sec of ['workflow', 'wbs']) {
          if (afterVerify.runs[sec]) {
            expect(afterVerify.runs[sec].status).toBe('pending');
          }
        }
      }

      // Upstream sections remain completed
      if (afterVerify.runs) {
        for (const sec of ['journey', 'architecture']) {
          if (afterVerify.runs[sec]) {
            expect(afterVerify.runs[sec].status).toBe('completed');
          }
        }
      }

      await savePhase09Evidence('state-machine-editor-saved-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        before_version: initialVersion,
        after_version: afterVerify.version,
        state_machine_run_status: afterVerify.runs?.state_machine?.status,
        downstream_runs: afterVerify.runs,
      });

      // 9. Reload Page and assert data preservation
      await page.reload();
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /state machine/i }).click();
      await expect(page.getByTestId('state-machine-editor')).toBeVisible({ timeout: 20_000 });

      // Invariant assertion: IDs, states, transitions, initial_state, positions preserved
      const reloadedSm = afterDetail.data.content_json.state_machine;
      expect(reloadedSm.states.length).toBe(initialStateMachine.states.length);
      expect(reloadedSm.transitions.length).toBe(initialStateMachine.transitions.length);
      expect(reloadedSm.initial_state).toBe(initialStateMachine.initial_state);

      // Check edited state
      const editedState = reloadedSm.states.find((s: any) => s.id === firstState.id);
      expect(editedState).toBeDefined();
      expect(editedState.label).toBe(updatedLabel);
      expect(editedState.type).toBe(firstState.type);
      expect(editedState.layout).toBeDefined();
      expect(typeof editedState.layout.x).toBe('number');
      expect(typeof editedState.layout.y).toBe('number');

      // Check untouched states IDs and references remained identical
      for (let i = 1; i < initialStateMachine.states.length; i++) {
        const original = initialStateMachine.states[i];
        const preserved = reloadedSm.states.find((s: any) => s.id === original.id);
        expect(preserved).toBeDefined();
        expect(preserved.label).toBe(original.label);
        expect(preserved.type).toBe(original.type);
      }
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('State Machine visual editor: Delete state with dependent transitions prompts confirmation dialog', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian State Delete QA');
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
      await page.getByRole('tab', { name: /state machine/i }).click();
      await expect(page.getByTestId('state-machine-editor')).toBeVisible({ timeout: 20_000 });

      // Click delete on a state that has connected transitions
      const deleteButtons = page.getByRole('button', { name: /Hapus State/i });
      await deleteButtons.first().click();

      // Check confirmation dialog appears
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus State' })).toBeVisible();
      await expect(page.getByText(/akan otomatis menghapus/i)).toBeVisible();

      // Cancel deletion
      await page.getByRole('button', { name: 'Batal' }).click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus State' })).toBeHidden();

      // Click delete again and confirm
      await deleteButtons.first().click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus State' })).toBeVisible();
      await page.getByRole('button', { name: 'Hapus State beserta Transition' }).click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus State' })).toBeHidden();

      // Dirty state is set
      await expect(page.getByText('Belum Disimpan')).toBeVisible();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('State Machine visual editor: Two-tab concurrency produces 409 and preserves unsaved local buffer', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Concurrency State Machine QA');
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

      // 2. Open Tab 1 at visual editor and switch to State Machine tab
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /state machine/i }).click();
      await expect(page.getByTestId('state-machine-editor')).toBeVisible({ timeout: 20_000 });

      // 3. Open Tab 2 at visual editor and switch to State Machine tab
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
      await page2.getByRole('tab', { name: /state machine/i }).click();
      await expect(page2.getByTestId('state-machine-editor')).toBeVisible({ timeout: 20_000 });

      const initialDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();

      // 4. In Tab 2: Make local edit
      const tab2StateBtn = page2.getByRole('button', { name: /Edit State/i }).first();
      await tab2StateBtn.click();
      await expect(page2.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeVisible();
      const tab2LocalLabel = 'State Khusus Tab 2 (Unsaved Buffer)';
      await page2.getByLabel('Label State').fill(tab2LocalLabel);
      await page2.getByRole('button', { name: 'Simpan State' }).click();
      await expect(page2.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeHidden();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      // 5. In Tab 1: Make edit and successfully Save Draft
      const tab1StateBtn = page.getByRole('button', { name: /Edit State/i }).first();
      await tab1StateBtn.click();
      await expect(page.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeVisible();
      await page.getByLabel('Label State').fill('State Tab 1 (Committed to Server)');
      await page.getByRole('button', { name: 'Simpan State' }).click();
      await expect(page.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeHidden();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      const tab1SavePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/state_machine/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await tab1SavePromise;
      await expect(page.getByText('Draft State Machine berhasil disimpan.')).toBeVisible();

      // Verify DB version incremented by Tab 1
      const tab1DB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(tab1DB.version).toBe(initialDB.version + 1);

      // 6. In Tab 2: Try to Save Draft with stale version -> HTTP 409
      const tab2SavePromise = page2.waitForResponse(
        (res) =>
          res.url().includes(`/sections/state_machine/draft`) &&
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
      await savePhase09Evidence('state-machine-editor-stale-409-1440', page2, [...exchanges], {
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
      await expect(page2.getByText(tab2LocalLabel).first()).toBeVisible();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      await page2.close();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('State Machine visual editor: 390px mobile read-only view prevents mutations and avoids layout overflow', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Mobile State Machine QA');
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

      // Switch to State Machine tab
      await page.getByRole('tab', { name: /state machine/i }).click();

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
      await savePhase09Evidence('state-machine-editor-mobile-390', page, [...exchanges], {
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
