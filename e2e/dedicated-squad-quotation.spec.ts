/**
 * Dedicated Squad golden benchmark flow (Task 14).
 *
 * HARNESS BLOCKER (2026-09-05): this repository does not declare or install
 * `@playwright/test`/`playwright`, has no Playwright config, and has no npm
 * script that starts the frontend/API services. The suite is intentionally
 * skipped until that harness is provisioned. A skipped suite is not evidence
 * that the four flows pass; do not remove the skip without adding the
 * dependency, browser install, service startup, and auth fixture.
 *
 * Once the harness exists, run the suite with the command documented in
 * `docs/qa/dedicated-squad-benchmark-checklist.md`.
 */

import { expect, test, type Locator, type Page } from '@playwright/test';

type SquadLine = readonly [role: string, seniority: string, headcount: string, duration: string];

type BenchmarkScenario = {
  id: string;
  model: '1A' | '1B' | '1C' | '1D';
  modelLabel: RegExp;
  subject: string;
  company: string;
  client: string;
  requirement: string;
  rateCardCode: string;
  paymentCount: string;
  development: readonly SquadLine[];
  maintenance?: readonly SquadLine[];
  kickoffDiscount?: RegExp;
  startDate?: string;
  endDate?: string;
  expectedBlocks: readonly string[];
  expectedSections: number;
};

const scenarios: readonly BenchmarkScenario[] = [
  {
    id: 'sow-250jt',
    model: '1A',
    modelLabel: /1A.*SOW Large/i,
    subject: 'Current-card deterministic benchmark: SOW 250JT',
    company: 'PT Benchmark 250JT',
    client: 'Benchmark 250JT PIC',
    requirement:
      'Build a marketplace portal with registration, reservation, payments, analytics, and access control.',
    rateCardCode: 'VENTURO-STD-2026',
    paymentCount: '6',
    development: [
      ['UI/UX Designer', 'Senior', '1', '1.0'],
      ['Business Analyst', 'Senior', '1', '1.0'],
      ['Back End Programmer', 'Senior', '1', '3.0'],
      ['Back End Programmer', 'Intermediate', '1', '3.0'],
      ['Mobile Developer', 'Senior', '1', '3.0'],
      ['Functional Tester (Manual QA)', 'Intermediate', '1', '3.0'],
    ],
    maintenance: [
      ['DevOps Engineer', 'Senior', '1', '1.0'],
      ['Data Analyst', 'Intermediate', '1', '1.0'],
    ],
    expectedBlocks: [
      'metadata',
      'opening',
      'commercial',
      'commercial-maintenance',
      'timeline',
      'payment',
      'legal',
      'signature',
    ],
    expectedSections: 5,
  },
  {
    id: 'sow-50jt',
    model: '1B',
    modelLabel: /1B.*SOW Small/i,
    subject: 'Current-card deterministic benchmark: SOW 50JT',
    company: 'PT Benchmark 50JT',
    client: 'Benchmark 50JT PIC',
    requirement: 'Build a compact commerce portal with catalog, checkout, and order tracking.',
    rateCardCode: 'VENTURO-STD-2026',
    paymentCount: '3',
    development: [
      ['UI/UX Designer', 'Intermediate', '1', '1.0'],
      ['Business Analyst', 'Senior', '1', '1.0'],
      ['Back End Programmer', 'Intermediate', '1', '1.0'],
      ['Mobile Developer', 'Senior', '1', '1.0'],
    ],
    expectedBlocks: [
      'metadata',
      'opening',
      'commercial',
      'timeline',
      'payment',
      'legal',
      'signature',
    ],
    expectedSections: 4,
  },
  {
    id: 'kopi-studio',
    model: '1C',
    modelLabel: /1C.*Staff Augmentation/i,
    subject: 'Current-card deterministic benchmark: Kopi Studio staff augmentation',
    company: 'Kopi Studio',
    client: 'Kopi Studio PIC',
    requirement: "Provide dedicated engineering capacity for the client's product backlog.",
    rateCardCode: 'VENTURO-STD-2026',
    paymentCount: '6',
    kickoffDiscount: /50% discount/i,
    development: [
      ['Mobile Developer', 'Senior', '1', '6.0'],
      ['Back End Programmer', 'Intermediate', '0.5', '1.0'],
    ],
    expectedBlocks: ['metadata', 'opening', 'commercial', 'payment', 'legal', 'signature'],
    expectedSections: 3,
  },
  {
    id: 'cuit',
    model: '1D',
    modelLabel: /1D.*Short-term Sprint/i,
    subject: 'Current-card deterministic benchmark: Cuit feature sprint',
    company: 'Cuit',
    client: 'Cuit PIC',
    requirement:
      '- Penyesuaian layout responsive pada tampilan checkout mobile app\n- Perbaikan bug validasi form alamat pengiriman\n- Integrasi webhook callback status transaksi payment gateway\n- Testing dan verifikasi build release APK',
    rateCardCode: 'VENTURO-STD-2026',
    paymentCount: '1',
    startDate: '2026-07-14',
    endDate: '2026-07-17',
    development: [['Mobile Developer', 'Senior', '1', '4']],
    expectedBlocks: [
      'metadata',
      'opening',
      'commercial',
      'timeline',
      'payment',
      'legal',
      'signature',
    ],
    expectedSections: 4,
  },
] as const;

async function signInIfRequired(page: Page) {
  if (!page.url().includes('/auth/')) return;

  await page.getByLabel('Email or username').fill(process.env.E2E_LOGIN ?? 'superadmin@venturo.id');
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? 'password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/quotation(?:$|\/)/);
}

async function openDedicatedSquadForm(page: Page) {
  await page.goto('/quotation');
  await signInIfRequired(page);
  await page.getByRole('button', { name: /\/quotation.*Dedicated Squad/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Dedicated Squad Proposal Inception' })
  ).toBeVisible();
}

async function selectOption(
  page: Page,
  scope: Page | Locator,
  label: string | RegExp,
  option: string | RegExp,
  index = 0
) {
  await scope.getByLabel(label).nth(index).click();
  // MUI renders the option menu in a portal outside the scoped picker.
  await page.getByRole('option', { name: option }).click();
}

async function fillSquad(
  page: Page,
  pickerName: 'development' | 'maintenance',
  lines: readonly SquadLine[]
) {
  const picker = page.getByTestId(`${pickerName}-squad-picker`);
  const addLine = picker.getByRole('button', { name: 'Line' });

  for (let index = 1; index < lines.length; index += 1) await addLine.click();

  for (const [index, [role, seniority, headcount, duration]] of lines.entries()) {
    await selectOption(page, picker, 'Role', role, index);
    await selectOption(page, picker, 'Seniority', seniority, index);
    await page
      .locator(`input[name="dedicated_squad.${pickerName}_squad.${index}.headcount_quarters"]`)
      .fill(headcount);

    const durationField = `input[name="dedicated_squad.${pickerName}_squad.${index}.period_quarters"]`;
    const workdayField = `input[name="dedicated_squad.${pickerName}_squad.${index}.workday_count"]`;
    const durationLocator = page.locator(durationField);
    if (await durationLocator.count()) await durationLocator.fill(duration);
    else await page.locator(workdayField).fill(duration);
  }
}

async function fillScenario(page: Page, scenario: (typeof scenarios)[number]) {
  await page.locator('input[name="subject"]').fill(scenario.subject);
  await page.locator('input[name="client_company_name"]').fill(scenario.company);
  await page.locator('input[name="client_name"]').fill(scenario.client);
  await selectOption(page, page, 'Service Sub-model', scenario.modelLabel);
  await selectOption(page, page, 'Rate Card Pricing Model', new RegExp(scenario.rateCardCode));
  await page.getByLabel('Client Requirement').fill(scenario.requirement);

  await fillSquad(page, 'development', scenario.development);

  if (scenario.model === '1A') {
    await page.getByLabel('Include a post-go-live maintenance squad').check();
    await fillSquad(page, 'maintenance', scenario.maintenance ?? []);
  }

  if (scenario.kickoffDiscount) {
    await selectOption(page, page, 'Engineering kick-off discount', scenario.kickoffDiscount);
  }

  if (scenario.model === '1D') {
    await page
      .locator('input[name="dedicated_squad.timeline.start_date"]')
      .fill(scenario.startDate!);
    await page
      .locator('input[name="dedicated_squad.timeline.sprint_end_date"]')
      .fill(scenario.endDate!);
  }

  await page.locator('input[name="dedicated_squad.payment_count"]').fill(scenario.paymentCount);
  await page.locator('input[name="dedicated_squad.payment_anchor_date"]').fill('2026-07-14');
}

async function assertGeneratedQuotation(
  page: Page,
  expectedBlocks: readonly string[],
  expectedSections: number
) {
  const document = page.locator('.quotation-document .ProseMirror');
  await expect(document).toBeVisible();
  await expect(document.locator('[data-block-type]')).toHaveCount(expectedBlocks.length);
  await expect(document.locator('[data-block-type="metadata"] h1')).toHaveText(
    'PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD'
  );

  const blockTypes = await document
    .locator('[data-block-type]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-block-type')));
  expect(blockTypes).toEqual(expectedBlocks);
  await expect(document.locator('section[data-section-number]')).toHaveCount(expectedSections);
  await expect(document.locator('[data-field="total_investment"]')).toHaveCount(1);
  await expect(document.locator('[data-field="payment_nominal"]')).not.toHaveCount(0);
  await expect(document.locator('[data-field="exclusions"] li')).toHaveCount(4);
  await expect(
    document.locator('[data-block-type="signature"] .signature-table tr td')
  ).toHaveCount(2);
}

// This describe block is the explicit non-running scaffold until the harness
// blocker above is resolved. `test.describe.skip` keeps accidental local runs
// honest: no skipped case may be reported as a passing golden benchmark.
test.describe.skip('Dedicated Squad quotation golden benchmarks (harness blocked)', () => {
  test.use({
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8081',
    viewport: { width: 1440, height: 1200 },
  });

  for (const scenario of scenarios) {
    test(`${scenario.id}: ${scenario.model}`, async ({ page }, testInfo) => {
      await openDedicatedSquadForm(page);
      await fillScenario(page, scenario);

      await expect(page.getByTestId('quotation-calculation-preview')).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('button', { name: 'Create Quotation Draft' })).toBeEnabled();
      await page.getByRole('button', { name: 'Create Quotation Draft' }).click();

      await expect(page.getByRole('heading', { name: 'Quotation Draft Generated!' })).toBeVisible({
        timeout: 120_000,
      });
      await page.getByRole('button', { name: 'Open Quotation Editor' }).click();
      await page.waitForURL(/\/quotation\/[^/]+\/edit$/);

      await assertGeneratedQuotation(page, scenario.expectedBlocks, scenario.expectedSections);
      await page.screenshot({
        path: testInfo.outputPath(`${scenario.id}-1440x1200.png`),
        fullPage: true,
      });
    });
  }
});
