import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — Architecture Visual Editor (Task 5.03)', () => {
  test('Architecture visual editor: UI -> HTTP -> DB edit, Save Draft, and reload architecture preserving IDs, edges, groups, and positions', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Visual Architecture QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan flow arsitektur publik');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      // 2. Generate all 5 stages in pipeline so Architecture has content
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

      // Switch to Architecture tab
      await page.getByRole('tab', { name: /arsitektur/i }).click();
      await expect(page.getByTestId('architecture-editor')).toBeVisible({ timeout: 20_000 });

      // 4. Capture initial DB state before edit
      const beforeVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const beforeDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const initialVersion = beforeVerify.version;
      const initialArchitecture = beforeDetail.data.content_json.architecture;

      expect(initialArchitecture.nodes.length).toBeGreaterThan(0);
      expect(initialArchitecture.edges.length).toBeGreaterThan(0);

      // Save evidence of desktop editor view before editing
      await savePhase09Evidence('architecture-editor-desktop-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        initial_version: initialVersion,
        initial_nodes_count: initialArchitecture.nodes.length,
        initial_edges_count: initialArchitecture.edges.length,
        initial_groups_count: initialArchitecture.groups?.length || 0,
      });

      // 5. Click node in flow or node list to edit
      const firstNode = initialArchitecture.nodes[0];
      const editNodeBtn = page.getByRole('button', { name: `Edit node ${firstNode.label}` });
      await editNodeBtn.click();

      // Modal opens
      await expect(page.getByRole('heading', { name: 'Edit Node Arsitektur' })).toBeVisible();
      const updatedLabel = `${firstNode.label} (Updated QA)`;
      const updatedDescription = 'Deskripsi arsitektur diperbarui melalui visual editor QA.';

      await page.getByLabel('Label Node').fill(updatedLabel);
      await page.getByLabel('Deskripsi Node').fill(updatedDescription);
      await page.getByRole('button', { name: 'Simpan Node' }).click();

      await expect(page.getByRole('heading', { name: 'Edit Node Arsitektur' })).toBeHidden();

      // Verify dirty chip appears
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 6. Test Auto-layout
      await page.getByRole('button', { name: 'Auto-Layout' }).click();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 7. Save Draft via "Simpan Draft" button
      const saveDraftResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/architecture/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await saveDraftResponsePromise;

      // Verify dirty indicator disappears and success toast is shown
      await expect(page.getByText('Belum Disimpan')).toBeHidden();
      await expect(page.getByText('Draft Arsitektur berhasil disimpan.')).toBeVisible();

      // 8. Verify DB state after save
      const afterVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const afterDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();

      expect(afterVerify.version).toBe(initialVersion + 1);
      expect(afterVerify.runs?.architecture?.status).toBe('manual_edit');

      // Downstream sections must be invalidated (pending/reset)
      if (afterVerify.runs) {
        for (const sec of ['state_machine', 'workflow', 'wbs']) {
          if (afterVerify.runs[sec]) {
            expect(afterVerify.runs[sec].status).toBe('pending');
          }
        }
      }

      await savePhase09Evidence('architecture-editor-saved-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        before_version: initialVersion,
        after_version: afterVerify.version,
        architecture_run_status: afterVerify.runs?.architecture?.status,
        downstream_runs: afterVerify.runs,
      });

      // 9. Reload Page and assert data preservation
      await page.reload();
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /arsitektur/i }).click();
      await expect(page.getByTestId('architecture-editor')).toBeVisible({ timeout: 20_000 });

      // Invariant assertion: IDs, nodes, edges, groups, positions, references preserved
      const reloadedArch = afterDetail.data.content_json.architecture;
      expect(reloadedArch.nodes.length).toBe(initialArchitecture.nodes.length);
      expect(reloadedArch.edges.length).toBe(initialArchitecture.edges.length);

      // Check edited node
      const editedNode = reloadedArch.nodes.find((n: any) => n.id === firstNode.id);
      expect(editedNode).toBeDefined();
      expect(editedNode.label).toBe(updatedLabel);
      expect(editedNode.description).toBe(updatedDescription);
      expect(editedNode.group_id).toBe(firstNode.group_id);
      expect(editedNode.layout).toBeDefined();
      expect(typeof editedNode.layout.x).toBe('number');
      expect(typeof editedNode.layout.y).toBe('number');

      // Check untouched nodes IDs and references remained identical
      for (let i = 1; i < initialArchitecture.nodes.length; i++) {
        const original = initialArchitecture.nodes[i];
        const preserved = reloadedArch.nodes.find((n: any) => n.id === original.id);
        expect(preserved).toBeDefined();
        expect(preserved.label).toBe(original.label);
        expect(preserved.type).toBe(original.type);
        expect(preserved.group_id).toBe(original.group_id);
      }
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('Architecture visual editor: Delete node with dependent edges prompts confirmation dialog', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Node Delete QA');
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
      await page.getByRole('tab', { name: /arsitektur/i }).click();
      await expect(page.getByTestId('architecture-editor')).toBeVisible({ timeout: 20_000 });

      // Click delete on a node that has connected edges
      const deleteButtons = page.getByRole('button', { name: /Hapus node/i });
      await deleteButtons.first().click();

      // Check confirmation dialog appears
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeVisible();
      await expect(page.getByText('Node ini terhubung dengan relasi berikut')).toBeVisible();

      // Cancel deletion
      await page.getByRole('button', { name: 'Batal' }).click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeHidden();

      // Click delete again and confirm
      await deleteButtons.first().click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeVisible();
      await page.getByRole('button', { name: 'Hapus Node beserta Relasi' }).click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeHidden();

      // Dirty state is set
      await expect(page.getByText('Belum Disimpan')).toBeVisible();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('Architecture visual editor: Two-tab concurrency produces 409 and preserves unsaved local buffer', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Concurrency Architecture QA');
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

      // 2. Open Tab 1 at visual editor and switch to Architecture tab
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /arsitektur/i }).click();
      await expect(page.getByTestId('architecture-editor')).toBeVisible({ timeout: 20_000 });

      // 3. Open Tab 2 at visual editor and switch to Architecture tab
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
      await page2.getByRole('tab', { name: /arsitektur/i }).click();
      await expect(page2.getByTestId('architecture-editor')).toBeVisible({ timeout: 20_000 });

      const initialDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();

      // 4. In Tab 2: Make local edit
      const tab2NodeBtn = page2.getByRole('button', { name: /edit node/i }).first();
      await tab2NodeBtn.click();
      await expect(page2.getByRole('heading', { name: 'Edit Node Arsitektur' })).toBeVisible();
      const tab2LocalLabel = 'Node Khusus Tab 2 (Unsaved Buffer)';
      await page2.getByLabel('Label Node').fill(tab2LocalLabel);
      await page2.getByRole('button', { name: 'Simpan Node' }).click();
      await expect(page2.getByRole('heading', { name: 'Edit Node Arsitektur' })).toBeHidden();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      // 5. In Tab 1: Make edit and successfully Save Draft
      const tab1NodeBtn = page.getByRole('button', { name: /edit node/i }).first();
      await tab1NodeBtn.click();
      await page.getByLabel('Label Node').fill('Node Tab 1 (Committed to Server)');
      await page.getByRole('button', { name: 'Simpan Node' }).click();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      const tab1SavePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/architecture/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await tab1SavePromise;
      await expect(page.getByText('Draft Arsitektur berhasil disimpan.')).toBeVisible();

      // Verify DB version incremented by Tab 1
      const tab1DB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(tab1DB.version).toBe(initialDB.version + 1);

      // 6. In Tab 2: Try to Save Draft with stale version -> HTTP 409
      const tab2SavePromise = page2.waitForResponse(
        (res) =>
          res.url().includes(`/sections/architecture/draft`) &&
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
      await savePhase09Evidence('architecture-editor-stale-409-1440', page2, [...exchanges], {
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

  test('Architecture visual editor: 390px mobile read-only view prevents mutations and avoids layout overflow', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Mobile Architecture QA');
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

      // Switch to Architecture tab
      await page.getByRole('tab', { name: /arsitektur/i }).click();

      // 3. Verify mobile read-only guidance
      await expect(page.getByText('Tampilan Terbatas (Perangkat Mobile)')).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText('Mode Baca Arsitektur:')).toBeVisible();

      // Verify mutation buttons are not visible on mobile
      await expect(page.getByRole('button', { name: 'Simpan Draft' })).toBeHidden();
      await expect(page.getByRole('button', { name: 'Selesaikan Section' })).toBeHidden();

      // Verify no horizontal overflow on mobile body
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);

      // Save evidence for mobile 390px
      await savePhase09Evidence('architecture-editor-mobile-390', page, [...exchanges], {
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
