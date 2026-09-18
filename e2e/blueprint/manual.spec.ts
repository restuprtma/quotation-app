import { expect, test } from '@playwright/test';
import { qaApi, qaSession } from './fixtures';
import { saveEvidence } from './artifacts';

test('scripted failure is completed through the Journey form and requires explicit Continue', async ({ page }) => {
  test.setTimeout(180_000);
  const session = await qaSession(page);
  const headers = { Authorization: `Bearer ${session.token}` };
  const exchanges: string[] = [];
  const sequence = () => exchanges.filter((line, index) => line !== exchanges[index - 1]);
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === qaApi && url.pathname.startsWith('/quotation/v1/'))
      exchanges.push(`${response.request().method()} ${url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')} ${response.status()}`);
  });
  try {
    await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
    await expect(page.getByLabel('Pilih Revisi')).toHaveValue(session.revision_id);
    await page.getByLabel('Judul Blueprint').fill('Sistem Antrian Manual QA');
    await page.getByLabel('Tujuan Bisnis 1').fill('Mengurangi waktu tunggu pemohon');
    await page.getByLabel('Aktor 1').fill('Pemohon Layanan');
    await page.getByLabel('Fase Bisnis 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Buat Blueprint' }).click();
    await expect(page).toHaveURL(/\/blueprint\/[0-9a-f-]{36}/);
    const id = page.url().split('/').pop()!;
    expect((await page.request.post(`${qaApi}/qa/fail-next/journey`, { headers })).status()).toBe(204);
    await page.getByRole('button', { name: 'Mulai Generasi' }).click();
    await expect(page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' })).toBeVisible({ timeout: 40_000 });
    const failed = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    await page.getByRole('button', { name: 'Lengkapi Manual tahap User Journey' }).click();
    await expect(page.getByText('Lengkapi Manual: User Journey')).toBeVisible();
    await page.getByRole('button', { name: 'Tambah Phase' }).click();
    await page.getByLabel('Label Phase 1').fill('Pendaftaran dan Reservasi');
    await page.getByRole('button', { name: 'Tambah Actor' }).click();
    await page.getByLabel('Label Actor 1').fill('Pemohon Layanan');
    await page.getByRole('button', { name: 'Tambah Activity' }).click();
    await page.getByLabel('Label Activity 1').fill('Ambil tiket antrean');
    await page.getByLabel('Deskripsi Activity 1').fill('Pemohon mengambil tiket antrean layanan.');
    await saveEvidence('manual-journey-1440', page, sequence(), failed);
    await page.getByRole('button', { name: 'Simpan & Validasi' }).click();
    await expect(page.getByText('Lengkapi Manual: User Journey')).toBeHidden({ timeout: 20_000 });
    const saved = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
    expect(saved.version).toBeGreaterThan(failed.version);
    await expect(page.getByRole('button', { name: 'Lanjutkan Generasi' }).first()).toBeVisible();
    await saveEvidence('manual-saved-1440', page, sequence(), { failed, saved });
    await page.getByRole('button', { name: 'Lanjutkan Generasi' }).first().click();
    await expect(page.getByRole('button', { name: 'Koreksi tahap Work Breakdown Structure (WBS)' })).toBeVisible({ timeout: 60_000 });
    const remaining = [
      { section: 'architecture', title: 'Arsitektur Sistem', add: 'Tambah Group', label: 'Label Group 1', value: 'Layanan Antrean' },
      { section: 'state_machine', title: 'State Machine', add: 'Tambah State', label: 'Label State 1', value: 'Menunggu' },
      { section: 'workflow', title: 'Workflow Bisnis', add: 'Tambah Workflow', label: 'Nama Workflow 1', value: 'Pelayanan Loket' },
      { section: 'wbs', title: 'Work Breakdown Structure (WBS)', add: 'Tambah Module', label: 'Nama Module 1', value: 'Modul Antrean' },
    ];
    for (const item of remaining) {
      await page.getByRole('button', { name: `Koreksi tahap ${item.title}` }).click();
      await expect(page.getByText(`Lengkapi Manual: ${item.title}`)).toBeVisible();
      if (!(await page.getByLabel(item.label).isVisible())) await page.getByRole('button', { name: item.add }).click();
      await page.getByLabel(item.label).fill(item.value);
      await expect(page.getByText('Peringatan: Mengubah tahap yang sudah selesai')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Simpan & Validasi' })).toBeDisabled();
      await page.getByLabel('Saya mengonfirmasi bahwa perubahan ini akan mengulang tahap-tahap hilir terkait').check();
      await expect(page.getByRole('button', { name: 'Simpan & Validasi' })).toBeEnabled();
      const state = await (await page.request.get(`${qaApi}/qa/verify/${id}`, { headers })).json();
      await saveEvidence(`correction-${item.section.replace('_', '-')}-1440`, page, sequence(), state);
      await page.getByRole('button', { name: 'Batal' }).click();
      await page.getByRole('button', { name: 'Buang Perubahan' }).click();
    }
  } finally {
    expect((await page.request.post(`${qaApi}/qa/cleanup`, { headers })).status()).toBe(204);
  }
});
