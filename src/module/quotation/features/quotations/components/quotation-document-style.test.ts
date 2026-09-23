import { readFileSync } from 'node:fs';
import { it, expect, describe } from 'vitest';

const stylesheet = readFileSync(
  new URL('../styles/dedicated-document.css', import.meta.url),
  'utf8'
).replace(/\s+/g, ' ');

const canvasSource = readFileSync(new URL('./document-canvas.tsx', import.meta.url), 'utf8');
const standaloneStyles = readFileSync(
  new URL('../styles/standalone-maintenance-document.css', import.meta.url),
  'utf8'
);
const headerStyles = readFileSync(
  new URL('../styles/quotation-document-header.css', import.meta.url),
  'utf8'
);

describe('quotation document table style contract', () => {
  it('defines the approved teal and white document tokens', () => {
    expect(stylesheet).toContain('--quotation-table-highlight-bg: #45818e;');
    expect(stylesheet).toContain('--quotation-table-highlight-fg: #ffffff;');
  });

  it('covers every semantic summary marker without matching generic line totals', () => {
    const exactDataFields = [
      'total',
      'discount',
      'total_investment',
      'discount_amount',
      'service_total',
      'hardware_total',
      'maintenance_total',
      'payment_total',
      'total_contract',
      'total_license',
      'maintenance_hosting_total',
      'total_before_tax',
      'dpp_amount',
      'tax_amount',
      'grand_total',
    ];

    for (const field of exactDataFields) {
      expect(stylesheet).toContain(`[data-field='${field}']`);
    }

    expect(stylesheet).toContain("[data-field$='_subtotal']");
    expect(stylesheet).toContain("[data-field$='_discount_amount']");
    expect(stylesheet).toContain("[data-field$='_tax_amount']");
    expect(stylesheet).toContain("[data-quotation-field$='_subtotal']");
    expect(stylesheet).toContain("[data-quotation-field='discount_amount']");
    expect(stylesheet).toContain("[data-quotation-field='total_investment']");
    expect(stylesheet).toContain("[data-quotation-field='monthly_total']");
    expect(stylesheet).toContain('tr[data-cloud-total-row]');
    expect(stylesheet).not.toContain("[data-field$='_total']");
    expect(stylesheet).not.toContain("[data-block-type='timeline'] tbody");
  });

  it('uses compact content-driven cells and preserves signature spacing', () => {
    expect(stylesheet).toContain('padding: 4px 8px;');
    expect(stylesheet).toContain('line-height: 1.35;');
    expect(stylesheet).toContain('.quotation-document .signature-table td');
    expect(stylesheet).toContain('padding: 0.75rem 1rem 0;');
    expect(standaloneStyles).not.toContain('padding-top: 0.75rem;');
    expect(standaloneStyles).not.toContain('padding-bottom: 0.75rem;');
  });

  it('removes MUI declarations that would override canonical CSS', () => {
    expect(canvasSource).not.toContain("bgcolor: 'action.hover'");
    expect(canvasSource).not.toContain('p: { xs: 1, sm: 1.5 }');
  });

  it('loads the header stylesheet and lays out persisted metadata with semantic roles', () => {
    expect(canvasSource).toContain("import '../styles/quotation-document-header.css';");
    expect(headerStyles).toContain(
      ".quotation-document__editor .ProseMirror > [data-block-type='metadata']"
    );
    expect(headerStyles).toContain("[data-role='metadata-layout']");
    expect(headerStyles).toContain("[data-role='metadata-facts']");
    expect(headerStyles).toContain("[data-role='metadata-row']");
    expect(headerStyles).toContain("[data-role='metadata-recipient']");
    expect(headerStyles).toContain('@media print');

    expect(headerStyles).not.toContain(':has(');
    expect(headerStyles).not.toContain("content: 'No'");
    expect(headerStyles).not.toContain("content: 'Perihal'");
    expect(headerStyles).not.toContain("content: 'Tanggal'");
    expect(headerStyles).not.toContain("content: 'Kepada'");
    expect(headerStyles).not.toContain("content: 'Yth. '");
    expect(headerStyles).not.toContain('0 1 0 1');
  });
});
