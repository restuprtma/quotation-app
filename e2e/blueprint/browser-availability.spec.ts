import { expect, test } from '@playwright/test';

test('launches the configured local browser for Blueprint QA', async ({ page }) => {
  await page.goto('data:text/html,<main>Blueprint QA browser ready</main>');
  await expect(page.getByText('Blueprint QA browser ready')).toBeVisible();
});
