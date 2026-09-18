import { expect, test } from '@playwright/test';
import { qaApi, qaSession } from './fixtures';
import { saveEvidence } from './artifacts';

test('1440px source creates Blueprint through HTTP and PostgreSQL', async ({ page }) => {
  test.setTimeout(180_000);
  const session = await qaSession(page);
  const exchanges: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/'))
      exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
  });
  await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
  await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id);
  await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Pelayanan Terpadu');
  await page.getByLabel('Tujuan Bisnis 1').fill('Mengurangi waktu tunggu pemohon layanan publik');
  await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
  await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
  for (const marker of ['COMMERCIAL_RATE_QA7B05', 'LEGAL_INDEMNITY_QA7B05', 'CREDENTIAL_QA7B05', 'SYSTEM_PROMPT_QA7B05'])
    expect(await page.locator('body').innerText()).not.toContain(marker);
  await saveEvidence('source-1440', page, exchanges, { quotation_id: session.quotation_id, revision_id: session.revision_id });
  await page.getByRole('button', { name: 'Buat Blueprint' }).click();
  await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
  const blueprintId = page.url().split('/').pop()!;
  const verification = await page.request.get(`${qaApi}/qa/verify/${blueprintId}`, { headers: { Authorization: `Bearer ${session.token}` } });
  expect(verification.status()).toBe(200);
  const db = await verification.json();
  expect(db.blueprint_id).toBe(blueprintId);
  expect(db.version).toBeGreaterThanOrEqual(1);
  expect(exchanges).toContain('POST /quotation/v1/blueprints/generate 201');
  const canaryResponse = await page.request.get(`${qaApi}/qa/canary/${blueprintId}`, { headers: { Authorization: `Bearer ${session.token}` } });
  expect(canaryResponse.status()).toBe(200);
  const canary = await canaryResponse.json();
  expect(canary).toEqual({ source_seeded: true, skill_seeded: true, source_snapshotted: true, skill_snapshotted: true });
  await saveEvidence('progress-1440', page, exchanges, db);
  const countBefore = exchanges.filter((line) => line.includes('POST /quotation/v1/blueprints/:id/continue')).length;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mulai Generasi' })).toBeVisible({ timeout: 20_000 });
  const countAfter = exchanges.filter((line) => line.includes('POST /quotation/v1/blueprints/:id/continue')).length;
  expect(countAfter).toBe(countBefore);
  await saveEvidence('resume-1440', page, exchanges, { ...db, continue_before: countBefore, continue_after: countAfter });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText('Petunjuk Tampilan Desktop')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await saveEvidence('progress-390', page, exchanges, { ...db, body_overflow: overflow });
  expect(overflow).toBe(false);
  await page.setViewportSize({ width: 1440, height: 900 });
  const scriptedFailure = await page.request.post(`${qaApi}/qa/fail-next/journey`, { headers: { Authorization: `Bearer ${session.token}` } });
  expect(scriptedFailure.status()).toBe(204);
  await page.getByRole('button', { name: 'Mulai Generasi' }).click();
  await expect(page.getByRole('button', { name: 'Coba Lagi tahap User Journey' })).toBeVisible({ timeout: 40_000 });
  const failedDB = await (await page.request.get(`${qaApi}/qa/verify/${blueprintId}`, { headers: { Authorization: `Bearer ${session.token}` } })).json();
  await saveEvidence('retry-1440', page, exchanges, failedDB);
  await page.getByRole('button', { name: 'Coba Lagi tahap User Journey' }).click();
  await expect(page.getByRole('button', { name: 'Lanjutkan Generasi' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Lanjutkan Generasi' }).click();
  await expect(page.getByText('Generasi Selesai')).toBeVisible({ timeout: 60_000 });
  const completedDB = await (await page.request.get(`${qaApi}/qa/verify/${blueprintId}`, { headers: { Authorization: `Bearer ${session.token}` } })).json();
  expect(completedDB.status).toBe('completed');
  await saveEvidence('final-1440', page, exchanges, completedDB);
  await expect(page.getByText('Pemohon Layanan', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Petugas Loket', { exact: true }).first()).toBeVisible();
  const rendered = await page.locator('body').innerText();
  for (const sentinel of ['COMMERCIAL_RATE_QA7B05', 'LEGAL_INDEMNITY_QA7B05', 'CREDENTIAL_QA7B05', 'SYSTEM_PROMPT_QA7B05', 'AI_PROVIDER_API_KEY_SECRET_CANARY', 'SYSTEM_PROMPT_RAW_INSTRUCTION_SECRET', 'Bearer ey', 'credential_encryption_key'])
    expect(rendered).not.toContain(sentinel);
  await page.getByRole('tab', { name: 'Panel Validasi & Konsistensi' }).click();
  const validationRendered = await page.locator('body').innerText();
  for (const sentinel of ['COMMERCIAL_RATE_QA7B05', 'LEGAL_INDEMNITY_QA7B05', 'CREDENTIAL_QA7B05', 'SYSTEM_PROMPT_QA7B05'])
    expect(validationRendered).not.toContain(sentinel);
  await saveEvidence('safe-issues-1440', page, exchanges, { ...completedDB, canary_seeded_and_snapshotted: true, rendered_sentinels: false });
  await page.setViewportSize({ width: 390, height: 844 });
  const resultsOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await saveEvidence('results-390', page, exchanges, { ...completedDB, body_overflow: resultsOverflow });
  expect(resultsOverflow).toBe(false);
  expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers: { Authorization: `Bearer ${session.token}` } })).status()).toBe(204);
});
