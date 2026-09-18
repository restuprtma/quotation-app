import { expect, test } from '@playwright/test';
import { qaApi, qaSession } from './fixtures';
import { saveEvidence } from './artifacts';

test.afterEach(async ({ page }) => {
  const response = await page.request.get(`${qaApi}/qa/session`);
  if (!response.ok()) return;
  const session = await response.json();
  const cleanup = await page.request.post(`${qaApi}/qa/cleanup`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(cleanup.status()).toBe(204);
});

test('keyboard dialog return and mobile read-only views', async ({ page }) => {
  test.setTimeout(180_000);
  const session = await qaSession(page);
  const headers = { Authorization: `Bearer ${session.token}` };
  const exchanges: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/blueprints'))
      exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
  });

  await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
  await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id, { timeout: 20_000 });
  const title = page.getByLabel('Judul Blueprint');
  await title.focus();
  await expect(title).toBeFocused();
  await page.keyboard.type('Sistem Antrian Aksesibilitas');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).not.toBe('Judul Blueprint');
  await page.getByLabel('Tujuan Bisnis 1').fill('Mengurangi waktu tunggu pemohon');
  await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
  await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
  await page.getByRole('button', { name: 'Buat Blueprint' }).click();
  await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/, { timeout: 20_000 });
  const id = page.url().split('/').pop()!;
  expect((await page.request.post(`${qaApi}/qa/fail-next/journey`, { headers })).status()).toBe(204);
  await page.goto(`http://127.0.0.1:18081/blueprint/${id}`);
  await expect(page.getByRole('button', { name: 'Mulai Generasi' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Mulai Generasi' }).click();
  const manualTrigger = page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' });
  await expect(manualTrigger).toBeVisible({ timeout: 45_000 });
  await manualTrigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: /Lengkapi Manual: User Journey/ });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await dialog.getByRole('button', { name: 'Tambah Phase' }).click();
  await dialog.getByRole('button', { name: 'Simpan & Validasi' }).click();
  const summary = dialog.getByText('Validasi Form Gagal');
  await expect(summary).toBeVisible();
  const validationAlert = dialog.getByRole('alert').filter({ hasText: 'Validasi Form Gagal' });
  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    role: document.activeElement?.getAttribute('role'),
    label: document.activeElement?.getAttribute('aria-label'),
  }));
  await expect(validationAlert, `Actual focus: ${JSON.stringify(focused)}`).toBeFocused();
  await saveEvidence('keyboard-dialog-1440', page, exchanges, { blueprint_id: id, dialog_focus_inside: true, validation_summary_focused: true });
  await dialog.getByRole('button', { name: 'Batal' }).click();
  await page.getByRole('dialog', { name: 'Tutup Form Pengisian?' }).getByRole('button', { name: 'Buang Perubahan' }).click();
  await expect(dialog).toBeHidden();
  await expect(manualTrigger).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText('Petunjuk Tampilan Desktop')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Periksa & Pulihkan' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' })).toHaveCount(0);
  const progressOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(progressOverflow).toBe(false);
  const progressDB = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
  await saveEvidence('keyboard-mobile-progress-390', page, exchanges, { ...progressDB, body_overflow: progressOverflow, mutation_controls_visible: false });
  await page.goto('http://127.0.0.1:18081/blueprint');
  await expect(page.getByRole('button', { name: 'Buka' })).toBeVisible({ timeout: 20_000 });
  const listOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(listOverflow).toBe(false);
  const listDB = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
  await saveEvidence('keyboard-mobile-list-390', page, exchanges, { ...listDB, body_overflow: listOverflow });
});
