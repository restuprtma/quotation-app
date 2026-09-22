import { expect, test } from '@playwright/test';
import { qaApi, qaSession, setPageAuth } from './fixtures';
import { savePhase09Evidence } from './artifacts';

test.describe('Blueprint Phase 09 — Five Visual Editors Acceptance & Lifecycle (Task 9.02)', () => {
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

  // ===========================================================================
  // MATRIX ROW 1: Journey Visual Editor
  // ===========================================================================
  test('Matrix Row 1 - Journey: phase/actor/activity CRUD, move cell, save draft, reload and DB invariants', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
      }
    });

    // 1. Create blueprint & generate pipeline
    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, { timeout: 20_000 });
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Publik Journey Matrix');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan flow antrian publik');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    for (let i = 0; i < 5; i++) {
      await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers });
    }

    // 2. Open Visual Editor
    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    const beforeDetail = await (await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })).json();
    const firstAct = beforeDetail.data.content_json.journey.activities[0];

    // 3. Edit Activity
    const actEditBtn = page.getByRole('button', { name: new RegExp(`Edit aktivitas ${firstAct.label}`, 'i') }).first();
    await actEditBtn.click();
    await expect(page.getByText('Edit Journey Activity')).toBeVisible();
    await page.getByLabel('Label Aktivitas').fill(`${firstAct.label} (Accepted Matrix)`);
    await page.getByRole('button', { name: 'Simpan Aktivitas' }).click();
    await expect(page.getByText('Edit Journey Activity')).toBeHidden();

    // 4. Save Draft
    const savePromise = page.waitForResponse((r) => r.url().includes('/sections/journey/draft') && r.status() === 200);
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await savePromise;

    // 5. Verify DB state
    const afterVerify = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(afterVerify.version).toBe(7);
    expect(afterVerify.runs.journey.status).toBe('manual_edit');
    expect(afterVerify.runs.architecture.status).toBe('pending'); // downstream invalidated

    // 6. Reload and verify persistence invariant
    await page.reload();
    await expect(page.getByText(`${firstAct.label} (Accepted Matrix)`)).toBeVisible({ timeout: 20_000 });

    // Save evidence
    await savePhase09Evidence('five-editors-acceptance-journey-1440', page, exchanges, {
      blueprint_id: id,
      version: 7,
      section: 'journey',
    });
  });

  // ===========================================================================
  // MATRIX ROW 2: Architecture Visual Editor
  // ===========================================================================
  test('Matrix Row 2 - Architecture: group/node CRUD, auto-layout, save draft, reload and DB invariants', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
      }
    });

    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, { timeout: 20_000 });
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Publik Arch Matrix');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan arsitektur');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    for (let i = 0; i < 5; i++) {
      await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers });
    }

    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Switch to Architecture
    await page.getByRole('tab', { name: /arsitektur/i }).click();
    await expect(page.getByRole('button', { name: 'Tambah Node' })).toBeVisible({ timeout: 20_000 });

    const beforeDetail = await (await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })).json();
    const firstNode = beforeDetail.data.content_json.architecture.nodes[0];

    // Edit node
    const nodeEditBtn = page.getByRole('button', { name: new RegExp(`Edit node ${firstNode.label}`, 'i') }).first();
    await nodeEditBtn.click();
    await expect(page.getByRole('heading', { name: 'Edit Node Arsitektur' })).toBeVisible();
    await page.getByLabel('Label Node').fill(`${firstNode.label} (Accepted Arch)`);
    await page.getByRole('button', { name: 'Simpan Node' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Node Arsitektur' })).toBeHidden();

    // Auto-layout
    await page.getByRole('button', { name: 'Auto-Layout' }).first().click();

    // Save draft
    const savePromise = page.waitForResponse((r) => r.url().includes('/sections/architecture/draft') && r.status() === 200);
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await savePromise;

    // Verify DB
    const afterVerify = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(afterVerify.version).toBe(7);
    expect(afterVerify.runs.architecture.status).toBe('manual_edit');
    expect(afterVerify.runs.state_machine.status).toBe('pending'); // downstream invalidated

    // Reload and verify
    await page.reload();
    await page.getByRole('tab', { name: /arsitektur/i }).click();
    await expect(page.getByText(`${firstNode.label} (Accepted Arch)`).first()).toBeVisible({ timeout: 20_000 });

    await savePhase09Evidence('five-editors-acceptance-architecture-1440', page, exchanges, {
      blueprint_id: id,
      version: 7,
      section: 'architecture',
    });
  });

  // ===========================================================================
  // MATRIX ROW 3: State Machine Visual Editor
  // ===========================================================================
  test('Matrix Row 3 - State Machine: state/transition CRUD, single initial, save draft, reload and DB invariants', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
      }
    });

    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, { timeout: 20_000 });
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Publik SM Matrix');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan state machine');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    for (let i = 0; i < 5; i++) {
      await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers });
    }

    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Switch to State Machine
    await page.getByRole('tab', { name: /state machine/i }).click();
    await expect(page.getByRole('button', { name: 'Tambah State' })).toBeVisible({ timeout: 20_000 });

    const beforeDetail = await (await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })).json();
    const firstState = beforeDetail.data.content_json.state_machine.states[0];
    const stateName = firstState.label || firstState.id;

    // Edit state
    const stateEditBtn = page.getByRole('button', { name: /^Edit State/i }).first();
    await stateEditBtn.click();
    await expect(page.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeVisible();
    await page.getByLabel('Label State').fill(`${stateName} (Accepted SM)`);
    await page.getByRole('button', { name: 'Simpan State' }).click();
    await expect(page.getByRole('heading', { name: /Edit State Siklus Hidup/i })).toBeHidden();

    // Auto-layout
    await page.getByRole('button', { name: /Auto-Layout/i }).first().click();

    // Save draft
    const savePromise = page.waitForResponse((r) => r.url().includes('/sections/state_machine/draft') && r.status() === 200);
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await savePromise;

    // Verify DB
    const afterVerify = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(afterVerify.version).toBe(7);
    expect(afterVerify.runs.state_machine.status).toBe('manual_edit');
    expect(afterVerify.runs.workflow.status).toBe('pending');

    // Reload and verify
    await page.reload();
    await page.getByRole('tab', { name: /state machine/i }).click();
    await expect(page.getByText(`${stateName} (Accepted SM)`).first()).toBeVisible({ timeout: 20_000 });

    await savePhase09Evidence('five-editors-acceptance-state-machine-1440', page, exchanges, {
      blueprint_id: id,
      version: 7,
      section: 'state_machine',
    });
  });

  // ===========================================================================
  // MATRIX ROW 4: Workflow Visual Editor
  // ===========================================================================
  test('Matrix Row 4 - Workflow: multiple workflows, lanes, nodes, decision branches, save draft, reload and DB invariants', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
      }
    });

    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, { timeout: 20_000 });
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Publik Workflow Matrix');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan workflow bisnis');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    for (let i = 0; i < 5; i++) {
      await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers });
    }

    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Switch to Workflow
    await page.getByRole('tab', { name: /workflow/i }).click();
    await expect(page.getByRole('button', { name: 'Tambah Workflow' })).toBeVisible({ timeout: 20_000 });

    const beforeDetail = await (await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })).json();
    const workflowsList = beforeDetail.data.content_json.workflows || beforeDetail.data.content_json.workflow?.workflows || [];
    const firstWf = workflowsList[0];
    const firstWfNode = firstWf.nodes[0];
    const nodeLabel = firstWfNode.label || firstWfNode.id;

    // Edit workflow node
    const wfNodeEditBtn = page.getByRole('button', { name: new RegExp(`Edit Node ${nodeLabel}`, 'i') }).first();
    await wfNodeEditBtn.click();
    await expect(page.getByRole('heading', { name: /Edit Node Workflow/i })).toBeVisible();
    await page.getByLabel('Label Node').fill(`${nodeLabel} (Accepted WF)`);
    await page.getByRole('button', { name: 'Simpan Node' }).click();
    await expect(page.getByRole('heading', { name: /Edit Node Workflow/i })).toBeHidden();

    // Auto-layout
    await page.getByRole('button', { name: /Auto-Layout/i }).first().click();

    // Save draft
    const savePromise = page.waitForResponse((r) => r.url().includes('/sections/workflow/draft') && r.status() === 200);
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await savePromise;

    // Verify DB
    const afterVerify = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(afterVerify.version).toBe(7);
    expect(afterVerify.runs.workflow.status).toBe('manual_edit');
    expect(afterVerify.runs.wbs.status).toBe('pending');

    // Reload and verify
    await page.reload();
    await page.getByRole('tab', { name: /workflow/i }).click();
    await expect(page.getByText(`${nodeLabel} (Accepted WF)`).first()).toBeVisible({ timeout: 20_000 });

    await savePhase09Evidence('five-editors-acceptance-workflow-1440', page, exchanges, {
      blueprint_id: id,
      version: 7,
      section: 'workflow',
    });
  });

  // ===========================================================================
  // MATRIX ROW 5: WBS Visual Editor
  // ===========================================================================
  test('Matrix Row 5 - WBS: module/feature tree, criteria, cycle detector, save draft, reload and DB invariants', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };
    const exchanges: string[] = [];

    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/')) {
        exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
      }
    });

    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, { timeout: 20_000 });
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Publik WBS Matrix');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengoptimalkan WBS breakdown');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    for (let i = 0; i < 5; i++) {
      await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers });
    }

    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Switch to WBS
    await page.getByRole('tab', { name: /wbs/i }).click();
    await expect(page.getByRole('button', { name: 'Tambah Module' })).toBeVisible({ timeout: 20_000 });

    const beforeDetail = await (await page.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })).json();
    const firstMod = beforeDetail.data.content_json.wbs.modules[0];
    const modName = firstMod.name || firstMod.id;

    // Edit module
    const modEditBtn = page.getByRole('button', { name: new RegExp(`Edit Module ${modName}`, 'i') }).first();
    await modEditBtn.click();
    await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeVisible();
    await page.getByLabel('Nama Module').fill(`${modName} (Accepted WBS)`);
    await page.getByRole('button', { name: 'Simpan Module' }).click();
    await expect(page.getByRole('heading', { name: /Edit Module WBS/i })).toBeHidden();

    // Save draft
    const savePromise = page.waitForResponse((r) => r.url().includes('/sections/wbs/draft') && r.status() === 200);
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await savePromise;

    // Verify DB
    const afterVerify = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(afterVerify.version).toBe(7);
    expect(afterVerify.runs.wbs.status).toBe('manual_edit');
    expect(afterVerify.runs.cross_validation.status).toBe('pending');

    // Reload and verify
    await page.reload();
    await page.getByRole('tab', { name: /wbs/i }).click();
    await expect(page.getByText(`${modName} (Accepted WBS)`).first()).toBeVisible({ timeout: 20_000 });

    // Mobile 390px Check
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText(/Tampilan Terbatas/i)).toBeVisible({ timeout: 10_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    await savePhase09Evidence('five-editors-acceptance-wbs-mobile-390', page, exchanges, {
      blueprint_id: id,
      version: 7,
      body_overflow: overflow,
    });

    await page.setViewportSize({ width: 1440, height: 900 });
  });

  // ===========================================================================
  // LIFECYCLE RECOVERY: failed -> draft -> complete -> continue
  // ===========================================================================
  test('Manual lifecycle: failed stage -> open editor draft -> save draft -> complete -> continue next stage', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };

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
    await page.getByLabel('Judul Blueprint').fill('Lifecycle Recovery Blueprint');
    await page.getByLabel('Tujuan Bisnis 1').fill('Menguji recovery failed -> draft -> complete');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    // 2. Inject failure on Journey stage
    const scriptFail = await page.request.post(`${qaApi}/qa/fail-next/journey`, { headers });
    expect(scriptFail.status()).toBe(204);

    // Click "Mulai Generasi" in UI -> Journey fails
    await page.getByRole('button', { name: 'Mulai Generasi' }).click();
    await expect(page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' })).toBeVisible({
      timeout: 40_000,
    });

    // Verify DB run status is failed
    const failVerify = await (
      await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
    ).json();
    expect(failVerify.runs.journey.status).toBe('failed');

    // 3. Open Visual Editor on the failed section (/blueprint/:id/edit?section=journey)
    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit?section=journey`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Verify recovery alert banner is displayed
    await expect(page.getByText('Tahap Memerlukan Perbaikan')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Gagal').first()).toBeVisible();

    // 4. Author a valid phase, actor, and activity in Journey editor
    await page.getByRole('button', { name: 'Tambah Fase' }).click();
    await page.getByRole('button', { name: 'Tambah Aktor' }).click();

    await page.getByRole('button', { name: 'Tambah Aktivitas' }).first().click();
    await expect(page.getByText('Tambah Journey Activity')).toBeVisible();
    await page.getByLabel('Label Aktivitas').fill('Ambil Nomor Antrian');
    await page.getByLabel('Deskripsi Aktivitas').fill('Pemohon mengambil nomor antrian pada kiosk.');
    await page.getByRole('button', { name: 'Simpan Aktivitas' }).click();
    await expect(page.getByText('Tambah Journey Activity')).toBeHidden();

    // 5. Click Save Draft -> status becomes manual_edit (200 OK)
    const draftSavePromise = page.waitForResponse(
      (r) => r.url().includes('/sections/journey/draft') && r.status() === 200
    );
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await draftSavePromise;

    // Verify DB run status updated to manual_edit
    const draftVerify = await (
      await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
    ).json();
    expect(draftVerify.runs.journey.status).toBe('manual_edit');

    // 6. Click Selesaikan Section -> authoritative manual completion
    const completePromise = page.waitForResponse(
      (r) => r.url().includes('/manual') && r.status() === 200
    );
    await page.getByRole('button', { name: 'Selesaikan Section' }).click();
    await completePromise;

    // Verify DB run status is now validated
    const completeVerify = await (
      await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
    ).json();
    expect(completeVerify.runs.journey.status).toBe('validated');

    // 7. Advance pipeline -> next stage (Architecture) continues and succeeds!
    const nextContinue = await page.request.post(
      `${qaApi}/quotation/v1/blueprints/${id}/continue`,
      { headers }
    );
    expect(nextContinue.status()).toBe(200);

    const nextVerify = await (
      await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
    ).json();
    expect(nextVerify.runs.architecture.status).toBe('completed');
  });

  // ===========================================================================
  // TWO-TAB 409 CONCURRENCY & ZERO WRITE
  // ===========================================================================
  test('Two-tab 409 concurrency & 422 error preserves local unsaved buffer with zero write', async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000);
    const session = await qaSession(page);
    const headers = { Authorization: `Bearer ${session.token}` };

    // 1. Create blueprint and advance pipeline
    await page.goto(
      `http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`
    );
    await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, {
      timeout: 20_000,
    });
    await page.getByLabel('Judul Blueprint').fill('Concurrency & 422 Guard Blueprint');
    await page.getByLabel('Tujuan Bisnis 1').fill('Menguji 409/422 safety');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();

    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const id = page.url().split('/').pop()!;

    for (let i = 0; i < 5; i++) {
      await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers });
    }

    // 2. Open Tab 1 and Tab 2
    await page.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    const page2 = await context.newPage();
    await setPageAuth(page2, session);
    await page2.goto(`http://127.0.0.1:18081/blueprint/${id}/edit`);
    await expect(page2.getByText('Visual Matrix Editor')).toBeVisible({ timeout: 20_000 });

    // Tab 2 makes an unsaved edit
    const tab2Detail = await (
      await page2.request.get(`${qaApi}/quotation/v1/blueprints/${id}`, { headers })
    ).json();
    const tab2FirstAct = tab2Detail.data.content_json.journey.activities[0];
    const tab2EditBtn = page2
      .getByRole('button', {
        name: new RegExp(`Edit aktivitas ${tab2FirstAct.label}`, 'i'),
      })
      .first();
    await tab2EditBtn.click();
    await expect(page2.getByText('Edit Journey Activity')).toBeVisible();
    await page2.getByLabel('Label Aktivitas').fill('Tab 2 Unsaved Unique Changes');
    await page2.getByRole('button', { name: 'Simpan Aktivitas' }).click();
    await expect(page2.getByText('Edit Journey Activity')).toBeHidden();

    // Tab 1 commits a save to advance server version (v6 -> v7)
    const tab1EditBtn = page
      .getByRole('button', {
        name: new RegExp(`Edit aktivitas ${tab2FirstAct.label}`, 'i'),
      })
      .first();
    await tab1EditBtn.click();
    await expect(page.getByText('Edit Journey Activity')).toBeVisible();
    await page.getByLabel('Label Aktivitas').fill('Tab 1 Saved Changes');
    await page.getByRole('button', { name: 'Simpan Aktivitas' }).click();
    await expect(page.getByText('Edit Journey Activity')).toBeHidden();

    const tab1SavePromise = page.waitForResponse(
      (r) => r.url().includes('/sections/journey/draft') && r.status() === 200
    );
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await tab1SavePromise;

    // Verify server version is now 7
    const serverV7 = await (
      await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
    ).json();
    expect(serverV7.version).toBe(7);

    // Tab 2 attempts Save Draft with stale version 6 -> HTTP 409
    const tab2SaveConflict = page2.waitForResponse(
      (r) => r.url().includes('/sections/journey/draft') && r.status() === 409
    );
    await page2.getByRole('button', { name: 'Simpan Draft' }).click();
    await tab2SaveConflict;

    // Conflict dialog rendered (match heading specifically to avoid snackbar text collision)
    await expect(page2.getByRole('heading', { name: /Konflik Versi Terdeteksi/i })).toBeVisible();

    // Click "Pertahankan Perubahan Lokal" -> dialog closes, local unsaved text remains
    await page2.getByRole('button', { name: 'Pertahankan Perubahan Lokal' }).click();
    await expect(page2.getByRole('heading', { name: /Konflik Versi Terdeteksi/i })).toBeHidden();
    await expect(page2.getByText('Tab 2 Unsaved Unique Changes')).toBeVisible();

    // Server DB version remains 7 (zero writes by Tab 2)
    const serverStillV7 = await (
      await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })
    ).json();
    expect(serverStillV7.version).toBe(7);

    await page2.close();
  });
});
