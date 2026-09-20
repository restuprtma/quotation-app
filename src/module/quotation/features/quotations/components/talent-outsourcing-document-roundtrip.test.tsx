// @vitest-environment happy-dom

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';

import { wrapOfficialDocument } from './quotation-editor';
import {
  QuotationFieldMark,
  LegalBlockExtension,
  QuotationTableExtension,
  QuotationSectionExtension,
  QuotationListItemExtension,
  QuotationTableRowExtension,
  QuotationTableCellExtension,
  QuotationTableHeaderExtension,
  QuotationFieldAttributesExtension,
} from './legal-block-extension';

function createEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit.configure({ link: false, underline: false, listItem: false }),
      QuotationListItemExtension,
      QuotationSectionExtension,
      QuotationFieldAttributesExtension,
      QuotationFieldMark,
      QuotationTableExtension.configure({ resizable: true }),
      QuotationTableRowExtension,
      QuotationTableHeaderExtension,
      QuotationTableCellExtension,
      LegalBlockExtension.configure({ unlocked: false }),
    ],
    content,
  });
}

const bpjsDocument = `<article class="quotation-document talent-outsourcing-document" data-service="talent_outsourcing">
  <section data-block-type="commercial" data-section-code="development_cost"><h2>1. Biaya</h2><table><tbody>
    <tr data-group-index="0"><th colspan="2">Personil</th></tr>
    <tr data-row-index="0"><td>Engineer</td><td data-field="cost_groups.0.items.0.line_total" data-value="532240000">Rp 532.240.000</td></tr>
    <tr><th>DPP PPN</th><td data-field="dpp_amount" data-value="557553333">Rp 557.553.333</td></tr>
    <tr><th>PPN</th><td data-field="tax_amount" data-value="66906400">Rp 66.906.400</td></tr>
  </tbody></table></section>
  <section data-block-type="limitations" data-section-code="limitations"><ul><li data-limitation-code="out_of_pocket">Pengeluaran di luar biaya.</li></ul></section>
</article>`;

const sysDocument = `<article class="quotation-document talent-outsourcing-document" data-service="talent_outsourcing">
  <section data-block-type="commercial" data-section-code="development_cost"><h2>1. Squad</h2><table><tbody>
    <tr data-row-index="0"><td>Developer</td><td data-field="squad.0.line_total" data-value="25000000">Rp 25.000.000</td></tr>
    <tr><th>Grand Total</th><td data-field="grand_total" data-value="25000000">Rp 25.000.000</td></tr>
  </tbody></table></section>
  <section data-block-type="payment" data-section-code="payment"><table><tbody><tr data-row-index="0"><td>Bulan 1</td><td data-field="payments.0.nominal" data-value="25000000">Rp 25.000.000</td></tr></tbody></table></section>
</article>`;

describe('talent outsourcing document round-trip', () => {
  it.each([
    [
      'BPJS',
      bpjsDocument,
      [
        'data-group-index="0"',
        'data-field="cost_groups.0.items.0.line_total"',
        'data-value="557553333"',
        'data-limitation-code="out_of_pocket"',
      ],
    ],
    [
      'SYS',
      sysDocument,
      ['data-row-index="0"', 'data-value="25000000"', 'data-section-code="payment"'],
    ],
  ])('%s retains every approved Talent marker and service wrapper', (_name, source, markers) => {
    const editor = createEditor(source);
    const saved = wrapOfficialDocument(editor.getHTML());

    expect(saved).toContain('class="quotation-document talent-outsourcing-document"');
    expect(saved).toContain('data-service="talent_outsourcing"');
    for (const marker of markers) expect(saved).toContain(marker);
  });

  it('does not turn arbitrary Talent-looking attributes into persisted markers', () => {
    const editor = createEditor(
      '<section data-block-type="commercial" data-section-code="development_cost" data-unapproved="drop"><ul><li data-limitation-code="valid" data-unapproved="drop">Text</li></ul></section>'
    );

    expect(editor.getHTML()).toContain('data-section-code="development_cost"');
    expect(editor.getHTML()).toContain('data-limitation-code="valid"');
    expect(editor.getHTML()).not.toContain('data-unapproved');
  });
});
