/**
 * Prompt-first Dedicated Squad pilot journey.
 *
 * The repository currently has no Playwright dependency/configuration, QA API
 * fixture, or authenticated service startup. Keep this as an explicit
 * non-running contract until that harness is provisioned; skipped tests are
 * not evidence that the pilot passes.
 */
import { test } from '@playwright/test';

test.describe.skip('Prompt-first Dedicated Squad pilot (QA harness required)', () => {
  test('notes -> draft -> resolve role/duration -> initial price -> discount -> edit/save/reload', async () => {
    // Implement when a deterministic QA fixture can exercise the additive
    // prompt-first endpoints without touching active tenant data.
  });

  test('unavailable role or rate card remains blocking and shows no total', async () => {
    // Implement with the same fixture once the QA harness exists.
  });
});
