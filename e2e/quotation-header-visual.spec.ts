import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { qaSession } from './blueprint/fixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../test-results/quotation-header');

const CANONICAL_TEST_QUOTATION = {
  id: 'header-visual-test-quotation',
  quotation_number: 'VEN/2026/TEST/001',
  subject: 'PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD',
  revision_id: 'rev-visual-001',
  content_version: 1,
  content_html: `<article class="quotation-document">
  <section data-block-type="metadata" data-section-number="0">
    <div data-role="quotation-brand">
      <img src="/logo/venturo-logo.png" alt="Venturo — Expert Programmers" />
    </div>
    <h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1>
    <div data-role="metadata-layout">
      <div data-role="metadata-facts">
        <div data-role="metadata-row" data-field="quotation_number">
          <span data-role="metadata-label">No</span>
          <span data-role="metadata-separator">:</span>
          <span data-role="metadata-value">VEN/2026/TEST/001</span>
        </div>
        <div data-role="metadata-row" data-field="subject">
          <span data-role="metadata-label">Perihal</span>
          <span data-role="metadata-separator">:</span>
          <span data-role="metadata-value">PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</span>
        </div>
        <div data-role="metadata-row" data-field="issue_date_header">
          <span data-role="metadata-label">Tanggal</span>
          <span data-role="metadata-separator">:</span>
          <span data-role="metadata-value">23 September 2026</span>
        </div>
      </div>
      <div data-role="metadata-recipient">
        <div data-role="recipient-heading">Kepada</div>
        <div data-role="recipient-line" data-field="client_pic">
          <span data-role="recipient-prefix">Yth. </span>
          <span data-role="metadata-value">Bpk. Joko Susilo</span>
        </div>
        <div data-role="recipient-line" data-field="client_company">
          <span data-role="metadata-value">PT Nusantara Teknologi Mandiri</span>
        </div>
      </div>
    </div>
  </section>
  <section data-block-type="commercial" data-section-number="1">
    <h2>1. Biaya Layanan</h2>
    <p>Rincian investasi untuk layanan Dedicated Programmer Squad.</p>
  </section>
</article>`,
  legal_template_snapshot: null,
  legal_content_modified: false,
  commercial_content_modified: false,
};

async function setupQuotationEditorPage(page: Page, initialQuotation = CANONICAL_TEST_QUOTATION) {
  let currentQuotation = { ...initialQuotation };

  await qaSession(page);

  await page.route(`**/quotation/v1/quotations/${currentQuotation.id}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentQuotation }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route(`**/quotation/v1/quotations/${currentQuotation.id}/draft`, async (route) => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON();
      currentQuotation = {
        ...currentQuotation,
        content_html: payload.content_html,
        content_version: (payload.content_version || 1) + 1,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            ...currentQuotation,
            content_html: currentQuotation.content_html,
            content_version: currentQuotation.content_version,
            legal_content_modified: false,
            commercial_content_modified: false,
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto(`http://127.0.0.1:18081/quotation/${currentQuotation.id}/edit`);
  await expect(page.locator('.quotation-document .ProseMirror')).toBeVisible({ timeout: 20_000 });
  await expect(
    page.locator('.quotation-document .ProseMirror > [data-block-type="metadata"]')
  ).toBeVisible({ timeout: 20_000 });
}

test.describe('Quotation Header Visual, Mobile, and Print Verification', () => {
  test.beforeAll(() => {
    fs.mkdirSync(outputDir, { recursive: true });
  });

  test('asserts canonical quotation header semantic structure and attributes', async ({ page }) => {
    await setupQuotationEditorPage(page);

    const document = page.locator('.quotation-document .ProseMirror');
    const metadataBlock = document.locator('> [data-block-type="metadata"]');
    const obsoleteHeader = page.locator('.quotation-official-header');

    // .ProseMirror > [data-block-type="metadata"] has count 1
    await expect(metadataBlock).toHaveCount(1);

    // .quotation-official-header has count 0
    await expect(obsoleteHeader).toHaveCount(0);

    // [data-role="quotation-brand"] img has src="/logo/venturo-logo.png"
    const brandImg = metadataBlock.locator('[data-role="quotation-brand"] img');
    await expect(brandImg).toHaveCount(1);
    await expect(brandImg).toHaveAttribute('src', '/logo/venturo-logo.png');
    await expect(brandImg).toHaveAttribute('alt', 'Venturo — Expert Programmers');

    // [data-field="client_company"] contains expected company text
    const companyField = metadataBlock.locator('[data-field="client_company"]');
    await expect(companyField).toHaveCount(1);
    await expect(companyField).toContainText('PT Nusantara Teknologi Mandiri');

    // No binary decoration pattern (0 1 0 1)
    const documentText = await page.locator('.quotation-document').innerText();
    expect(documentText).not.toMatch(/0\s*1\s*0\s*1/);
  });

  test('asserts desktop 2-column layout and typography styling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupQuotationEditorPage(page);

    const factsCol = page.locator('[data-role="metadata-facts"]');
    const recipientCol = page.locator('[data-role="metadata-recipient"]');

    await expect(factsCol).toBeVisible();
    await expect(recipientCol).toBeVisible();

    const factsBox = (await factsCol.boundingBox())!;
    const recipientBox = (await recipientCol.boundingBox())!;

    expect(factsBox).not.toBeNull();
    expect(recipientBox).not.toBeNull();

    // metadata-facts and metadata-recipient are side-by-side: recipientBox.x > factsBox.x + factsBox.width
    expect(recipientBox.x).toBeGreaterThan(factsBox.x + factsBox.width - 2);

    // metadata-value has wordBreak !== 'break-all'
    const values = page.locator('[data-role="metadata-value"]');
    const count = await values.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const wordBreak = await values.nth(i).evaluate((el) => window.getComputedStyle(el).wordBreak);
      expect(wordBreak).not.toBe('break-all');
    }
  });

  const narrowWidths = [320, 375, 414, 600];

  for (const width of narrowWidths) {
    test(`asserts narrow viewport ${width}px vertical stacking without horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 850 });
      await setupQuotationEditorPage(page);

      const metadataBlock = page.locator(
        '.quotation-document .ProseMirror > [data-block-type="metadata"]'
      );
      const factsCol = page.locator('[data-role="metadata-facts"]');
      const recipientCol = page.locator('[data-role="metadata-recipient"]');

      await expect(factsCol).toBeVisible();
      await expect(recipientCol).toBeVisible();

      const factsBox = (await factsCol.boundingBox())!;
      const recipientBox = (await recipientCol.boundingBox())!;

      // Facts column precedes recipient column vertically: recipientBox.y >= factsBox.y + factsBox.height
      expect(recipientBox.y).toBeGreaterThanOrEqual(factsBox.y + factsBox.height - 2);

      // scrollWidth <= clientWidth (no horizontal overflow on metadata header or document)
      const hasOverflow = await metadataBlock.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(hasOverflow).toBe(false);
    });
  }

  test('asserts print media retains 2-column layout and exports A4 PDF', async ({ page }) => {
    await setupQuotationEditorPage(page);

    await page.emulateMedia({ media: 'print' });

    const factsCol = page.locator('[data-role="metadata-facts"]');
    const recipientCol = page.locator('[data-role="metadata-recipient"]');

    await expect(factsCol).toBeVisible();
    await expect(recipientCol).toBeVisible();

    const printFacts = (await factsCol.boundingBox())!;
    const printRecipient = (await recipientCol.boundingBox())!;

    // Columns remain side-by-side in print (printRecipient.x > printFacts.x)
    expect(printRecipient.x).toBeGreaterThan(printFacts.x);

    // Capture PDF to test-results/quotation-header/a4-header.pdf
    const pdfPath = path.join(outputDir, 'a4-header.pdf');
    if (page.pdf) {
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
      expect(fs.existsSync(pdfPath)).toBe(true);
    }
  });

  test('asserts interactive editing of header title and metadata fields with editor updates', async ({
    page,
  }) => {
    await setupQuotationEditorPage(page);

    const metadataBlock = page.locator(
      '.quotation-document .ProseMirror > [data-block-type="metadata"]'
    );
    const heading = metadataBlock.locator('h1');
    const subjectValue = metadataBlock.locator(
      '[data-field="subject"] [data-role="metadata-value"]'
    );
    const companyValue = metadataBlock.locator(
      '[data-field="client_company"] [data-role="metadata-value"]'
    );

    // Select and type into metadata value elements or title h1
    await heading.selectText();
    await page.keyboard.type('PENAWARAN LAYANAN CUSTOM ENTERPRISE ARCHITECTURE');
    await expect(heading).toHaveText('PENAWARAN LAYANAN CUSTOM ENTERPRISE ARCHITECTURE');

    await subjectValue.selectText();
    await page.keyboard.type('Pengembangan Sistem Core Banking');
    await expect(subjectValue).toHaveText('Pengembangan Sistem Core Banking');

    await companyValue.selectText();
    await page.keyboard.type('PT Bank Digital Internasional');
    await expect(companyValue).toHaveText('PT Bank Digital Internasional');

    // Verify Save Draft button becomes enabled and persist
    const saveButton = page.getByRole('button', { name: /Save Draft|Simpan/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(page.getByText(/Saved|Tersimpan|successfully/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Content remains updated
    await expect(heading).toHaveText('PENAWARAN LAYANAN CUSTOM ENTERPRISE ARCHITECTURE');
    await expect(subjectValue).toHaveText('Pengembangan Sistem Core Banking');
    await expect(companyValue).toHaveText('PT Bank Digital Internasional');
  });
});
