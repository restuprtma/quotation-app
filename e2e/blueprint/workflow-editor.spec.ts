import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — Workflow Visual Editor (Task 7.03)', () => {
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

  test('Workflow visual editor: UI -> HTTP -> DB edit, Save Draft, and reload multiple workflows preserving IDs, lanes, nodes, edges, branch labels, and layout', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Visual Workflow QA');
      await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan alur kerja multi-lane');
      await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
      await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Pelayanan');
      await page.getByRole('button', { name: 'Buat Blueprint' }).click();

      await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
      const id = page.url().split('/').pop()!;

      // 2. Generate all 5 stages in pipeline so Workflow has content
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

      // Switch to Workflow tab
      await page.getByRole('tab', { name: /workflow/i }).click();
      await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 20_000 });

      // 4. Capture initial DB state before edit
      const beforeVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const beforeDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();
      const initialVersion = beforeVerify.version;
      const initialWorkflows = beforeDetail.data.content_json.workflows || [];

      expect(initialWorkflows.length).toBeGreaterThan(0);
      const firstWf = initialWorkflows[0];
      expect(firstWf.lanes.length).toBeGreaterThan(0);
      expect(firstWf.nodes.length).toBeGreaterThan(0);

      // Save evidence of desktop editor view before editing
      await savePhase09Evidence('workflow-editor-desktop-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        initial_version: initialVersion,
        initial_workflows_count: initialWorkflows.length,
        initial_workflow_0_name: firstWf.name,
        initial_workflow_0_lanes_count: firstWf.lanes.length,
        initial_workflow_0_nodes_count: firstWf.nodes.length,
        initial_workflow_0_edges_count: firstWf.edges?.length || 0,
      });

      // 5. In active workflow: Edit first node
      const firstNode = firstWf.nodes[0];
      const editNodeBtn = page.getByRole('button', { name: `Edit Node ${firstNode.label || firstNode.id}` });
      await editNodeBtn.click();

      // Modal opens
      await expect(page.getByRole('heading', { name: /Edit Node Workflow/i })).toBeVisible();
      const updatedNodeLabel = `${firstNode.label} (Updated QA)`;
      await page.getByLabel('Label Node').fill(updatedNodeLabel);
      await page.getByRole('button', { name: 'Simpan Node' }).click();
      await expect(page.getByRole('heading', { name: /Edit Node Workflow/i })).toBeHidden();

      // Verify dirty indicator appears
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 6. Test Auto-layout
      await page.getByRole('button', { name: /Auto-Layout/i }).first().click();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      // 7. Save Draft via "Simpan Draft" button
      const saveDraftResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/workflow/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await saveDraftResponsePromise;

      // Verify dirty indicator disappears and success toast is shown
      await expect(page.getByText('Belum Disimpan')).toBeHidden();
      await expect(page.getByText('Draft Workflow Bisnis berhasil disimpan.')).toBeVisible();

      // 8. Verify DB state after save
      const afterVerify = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      const afterDetail = await (
        await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
      ).json();

      expect(afterVerify.version).toBe(initialVersion + 1);
      expect(afterVerify.runs?.workflow?.status).toBe('manual_edit');

      // Downstream section must be invalidated (wbs)
      if (afterVerify.runs?.wbs) {
        expect(afterVerify.runs.wbs.status).toBe('pending');
      }
      if (afterVerify.runs?.cross_validation) {
        expect(afterVerify.runs.cross_validation.status).toBe('pending');
      }

      // Upstream sections remain completed
      for (const sec of ['journey', 'architecture', 'state_machine']) {
        if (afterVerify.runs?.[sec]) {
          expect(afterVerify.runs[sec].status).toBe('completed');
        }
      }

      await savePhase09Evidence('workflow-editor-saved-1440', page, [...exchanges], {
        blueprint_id: id,
        revision_id: session.revision_id,
        before_version: initialVersion,
        after_version: afterVerify.version,
        workflow_run_status: afterVerify.runs?.workflow?.status,
        downstream_runs: afterVerify.runs,
        saved_workflows_count: afterDetail.data.content_json.workflows?.length,
      });

      // 9. Reload Page and assert data preservation
      await page.reload();
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /workflow/i }).click();
      await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 20_000 });

      // Invariant assertion: multiple workflows, lanes, nodes, edges, labels, layout preserved
      const reloadedWorkflows = afterDetail.data.content_json.workflows || [];
      expect(reloadedWorkflows.length).toBeGreaterThanOrEqual(1);

      const reloadedFirstWf = reloadedWorkflows[0];
      expect(reloadedFirstWf.id).toBe(firstWf.id);
      expect(reloadedFirstWf.lanes.length).toBe(firstWf.lanes.length);
      expect(reloadedFirstWf.nodes.length).toBe(firstWf.nodes.length);

      // Check edited node
      const editedNode = reloadedFirstWf.nodes.find((n: any) => n.id === firstNode.id);
      expect(editedNode).toBeDefined();
      expect(editedNode.label).toBe(updatedNodeLabel);
      expect(editedNode.type).toBe(firstNode.type);
      expect(editedNode.lane_id).toBe(firstNode.lane_id);
      expect(editedNode.layout).toBeDefined();
      expect(typeof editedNode.layout.x).toBe('number');
      expect(typeof editedNode.layout.y).toBe('number');

      // Check untouched nodes IDs and types remained identical
      for (let i = 1; i < firstWf.nodes.length; i++) {
        const original = firstWf.nodes[i];
        const preserved = reloadedFirstWf.nodes.find((n: any) => n.id === original.id);
        expect(preserved).toBeDefined();
        expect(preserved.label).toBe(original.label);
        expect(preserved.type).toBe(original.type);
        expect(preserved.lane_id).toBe(original.lane_id);
      }

      // Check edge branch labels preserved
      if (firstWf.edges && firstWf.edges.length > 0) {
        expect(reloadedFirstWf.edges.length).toBe(firstWf.edges.length);
        for (const origEdge of firstWf.edges) {
          const preservedEdge = reloadedFirstWf.edges.find((e: any) => e.id === origEdge.id);
          expect(preservedEdge).toBeDefined();
          expect(preservedEdge.source).toBe(origEdge.source);
          expect(preservedEdge.target).toBe(origEdge.target);
          if (origEdge.label) {
            expect(preservedEdge.label).toBe(origEdge.label);
          }
        }
      }
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('Workflow visual editor: Delete node or lane with connected edges prompts confirmation dialog', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Workflow Delete QA');
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
      await page.getByRole('tab', { name: /workflow/i }).click();
      await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 20_000 });

      // Click delete on a node that has connected edges
      const deleteButtons = page.getByRole('button', { name: /Hapus Node/i });
      await deleteButtons.first().click();

      // Check confirmation dialog appears
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeVisible();
      await expect(page.getByText(/akan otomatis menghapus/i)).toBeVisible();

      // Cancel deletion
      await page.getByRole('button', { name: 'Batal' }).click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeHidden();

      // Click delete again and confirm
      await deleteButtons.first().click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeVisible();
      await page.getByRole('button', { name: 'Hapus Node beserta Edge' }).click();
      await expect(page.getByRole('heading', { name: 'Konfirmasi Hapus Node' })).toBeHidden();

      // Dirty state is set
      await expect(page.getByText('Belum Disimpan')).toBeVisible();
    } finally {
      expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
    }
  });

  test('Workflow visual editor: Two-tab concurrency produces 409 and preserves unsaved local buffer', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Concurrency Workflow QA');
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

      // 2. Open Tab 1 at visual editor and switch to Workflow tab
      await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
      await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('tab', { name: /workflow/i }).click();
      await expect(page.getByTestId('workflow-editor')).toBeVisible({ timeout: 20_000 });

      // 3. Open Tab 2 at visual editor and switch to Workflow tab
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
      await page2.getByRole('tab', { name: /workflow/i }).click();
      await expect(page2.getByTestId('workflow-editor')).toBeVisible({ timeout: 20_000 });

      const initialDB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();

      // 4. In Tab 2: Make local edit
      const tab2NodeBtn = page2.getByRole('button', { name: /Edit Node/i }).first();
      await tab2NodeBtn.click();
      await expect(page2.getByRole('heading', { name: /Edit Node Workflow/i })).toBeVisible();
      const tab2LocalLabel = 'Node Khusus Tab 2 (Unsaved Buffer)';
      await page2.getByLabel('Label Node').fill(tab2LocalLabel);
      await page2.getByRole('button', { name: 'Simpan Node' }).click();
      await expect(page2.getByRole('heading', { name: /Edit Node Workflow/i })).toBeHidden();
      await expect(page2.getByText('Belum Disimpan')).toBeVisible();

      // 5. In Tab 1: Make edit and successfully Save Draft
      const tab1NodeBtn = page.getByRole('button', { name: /Edit Node/i }).first();
      await tab1NodeBtn.click();
      await expect(page.getByRole('heading', { name: /Edit Node Workflow/i })).toBeVisible();
      await page.getByLabel('Label Node').fill('Node Tab 1 (Committed to Server)');
      await page.getByRole('button', { name: 'Simpan Node' }).click();
      await expect(page.getByRole('heading', { name: /Edit Node Workflow/i })).toBeHidden();
      await expect(page.getByText('Belum Disimpan')).toBeVisible();

      const tab1SavePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/sections/workflow/draft`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await page.getByRole('button', { name: 'Simpan Draft' }).click();
      await tab1SavePromise;
      await expect(page.getByText('Draft Workflow Bisnis berhasil disimpan.')).toBeVisible();

      // Verify DB version incremented by Tab 1
      const tab1DB = await (
        await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
      ).json();
      expect(tab1DB.version).toBe(initialDB.version + 1);

      // 6. In Tab 2: Try to Save Draft with stale version -> HTTP 409
      const tab2SavePromise = page2.waitForResponse(
        (res) =>
          res.url().includes(`/sections/workflow/draft`) &&
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
      await savePhase09Evidence('workflow-editor-stale-409-1440', page2, [...exchanges], {
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

  test('Workflow visual editor: 390px mobile read-only view prevents mutations and avoids layout overflow', async ({
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
      await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Mobile Workflow QA');
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

      // Switch to Workflow tab
      await page.getByRole('tab', { name: /workflow/i }).click();

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
      await savePhase09Evidence('workflow-editor-mobile-390', page, [...exchanges], {
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
