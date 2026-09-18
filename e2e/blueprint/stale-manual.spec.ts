import { expect, test } from '@playwright/test';
import { qaApi, qaSession } from './fixtures';
import { saveEvidence } from './artifacts';

test('stale manual 409 keeps local form input', async ({ page }) => {
  test.setTimeout(180_000);
  const session = await qaSession(page);
  const headers = { Authorization: `Bearer ${session.token}` };
  const exchanges: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/') && response.request().method() !== 'GET')
      exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
  });
  try {
    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id);
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Konflik QA');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengurangi waktu tunggu pemohon');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();
    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/);
    const id = page.url().split('/').pop()!;
    expect((await page.request.post(`${qaApi}/qa/fail-next/journey`, { headers })).status()).toBe(204);
    await page.getByRole('button', { name: 'Mulai Generasi' }).click();
    await page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' }).click();
    await page.getByRole('button', { name: 'Tambah Phase' }).click();
    await page.getByLabel('Label Phase 1').fill('Perubahan Lokal QA');
    await page.getByRole('button', { name: 'Tambah Actor' }).click();
    await page.getByLabel('Label Actor 1').fill('Pemohon Layanan');
    await page.getByRole('button', { name: 'Tambah Activity' }).click();
    await page.getByLabel('Label Activity 1').fill('Ambil tiket antrean');
    await page.getByLabel('Deskripsi Activity 1').fill('Pemohon mengambil tiket antrean.');
    const before = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect((await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/sections/journey/retry`, { headers })).status()).toBe(200);
    expect((await page.request.post(`${qaApi}/quotation/v1/blueprints/${id}/continue`, { headers })).status()).toBe(200);
    const current = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(current.version).toBeGreaterThan(before.version);
    const stale = page.waitForResponse((response) => response.url().endsWith(`/${id}/sections/journey/manual`) && response.status() === 409);
    await page.getByRole('button', { name: 'Simpan & Validasi' }).click();
    await stale;
    await expect(page.getByText('Konflik Versi Terdeteksi (409)')).toBeVisible();
    await expect(page.getByLabel('Label Phase 1')).toHaveValue('Perubahan Lokal QA');
    const after = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(after.version).toBe(current.version);
    await saveEvidence('stale-manual-1440', page, exchanges, { before, current, after, input_preserved: true });
  } finally {
    expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
  }
});
