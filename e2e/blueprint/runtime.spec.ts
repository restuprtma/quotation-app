import { expect, test } from '@playwright/test';
import { qaSession } from './fixtures';

test('QA session loads real quotation and revision choices', async ({ page }) => {
  const session = await qaSession(page);
  const requests: string[] = [];
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
  page.on('console', (message) => { if (message.type() === 'error') console.log('CONSOLE ERROR:', message.text()); });
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:18080/quotation/v1/'))
      requests.push(`${response.request().method()} ${new URL(response.url()).pathname} ${response.status()}`);
  });
  await page.goto(`http://127.0.0.1:18081/blueprint?quotation_id=${session.quotation_id}&revision_id=${session.revision_id}`);
  await expect(page.getByRole('heading', { name: 'Blueprint Generator' })).toBeVisible();
  await expect(page.getByLabel('Judul Blueprint')).toBeVisible();
  await expect.poll(() => requests.some((line) => line.includes('/quotations 200'))).toBeTruthy();
  await expect.poll(() => requests.some((line) => line.includes('/revisions 200'))).toBeTruthy();
});
