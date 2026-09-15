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

const authenCloudHtml = `<article class="quotation-document quotation-document--cloud-infrastructure" data-service="cloud_infrastructure">
  <section data-block-type="commercial" data-section-code="cloud_cost" data-section-number="1"><h2>1. Biaya Venturo Cloud</h2><table><tbody>
    <tr data-cloud-package-row="0"><td data-cloud-package-field="name">Virtual Machine Small - Kube Master</td><td data-cloud-package-field="vcpu">4 vCPU</td><td data-cloud-package-field="ram">4 GB</td><td data-cloud-package-field="storage">32 GB</td><td data-cloud-package-field="unit_rate">Rp 900.000</td><td data-cloud-package-field="line_total">Rp 900.000</td></tr>
    <tr data-cloud-package-row="1"><td data-cloud-package-field="name">Virtual Machine Small - Kube Master</td><td data-cloud-package-field="vcpu">4 vCPU</td><td data-cloud-package-field="ram">4 GB</td><td data-cloud-package-field="storage">32 GB</td><td data-cloud-package-field="unit_rate">Rp 900.000</td><td data-cloud-package-field="line_total">Rp 900.000</td></tr>
    <tr data-cloud-total-row="monthly"><th colspan="5">Subtotal Bulanan</th><td data-cloud-field="monthly_subtotal">Rp 1.800.000</td></tr>
  </tbody></table></section>
  <section data-block-type="narrative" data-section-code="scope_timeline" data-section-number="2"><h2>2. Lingkup Pekerjaan &amp; Timeline</h2><table><tbody><tr data-cloud-scope-row="0"><td><h3>Performance / Load Test</h3><ul><li>Menyiapkan staging environment</li><li>Membuat script testing menggunakan tools K6</li></ul><h3>Penetration Test</h3><ul><li>Melakukan Reconnaissance dan Information Gathering</li></ul></td><td data-cloud-scope-field="timeline">2 Minggu</td></tr></tbody></table></section>
  <section data-block-type="commercial" data-section-code="payment" data-section-number="3"><h2>3. Pembayaran</h2><table><tbody><tr data-cloud-payment-row="0" data-cloud-payment-component="monthly_service"><td>Bulan 1</td><td data-cloud-field="payment_nominal_0">Rp 1.800.000</td></tr></tbody></table></section>
  <section data-block-type="legal" data-section-code="limitations" data-section-number="4"><h2>4. Batasan dan Pengecualian</h2><ol><li data-limitation-code="scope_change">Perubahan scope memerlukan persetujuan.</li></ol></section>
</article>`;

function makeEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit.configure({ link: false, underline: false, listItem: false }),
      QuotationListItemExtension,
      QuotationSectionExtension,
      QuotationFieldAttributesExtension,
      QuotationFieldMark,
      QuotationTableExtension,
      QuotationTableRowExtension,
      QuotationTableHeaderExtension,
      QuotationTableCellExtension,
      LegalBlockExtension.configure({ unlocked: false }),
    ],
    content,
  });
}

describe('cloud infrastructure document round-trip', () => {
  it('preserves cloud markers, package rows, payment amount, and editable narrative text', () => {
    const editor = makeEditor(authenCloudHtml);
    let narrativePosition = -1;
    editor.state.doc.descendants((node, pos) => {
      if (narrativePosition === -1 && node.isText && node.text?.includes('staging environment')) {
        narrativePosition = pos + node.text.indexOf('staging environment');
      }
    });
    expect(narrativePosition).toBeGreaterThan(0);
    editor.view.dispatch(editor.state.tr.insertText('production-ready ', narrativePosition));

    const saved = wrapOfficialDocument(editor.getHTML());
    editor.destroy();

    expect(saved).toContain('class="quotation-document quotation-document--cloud-infrastructure"');
    expect(saved).toContain('data-service="cloud_infrastructure"');
    expect((saved.match(/data-cloud-package-row=/g) ?? []).length).toBe(2);
    expect(saved).toMatch(/data-cloud-package-field="line_total"[^>]*>.*Rp 900\.000/);
    expect(saved).toMatch(/data-cloud-field="monthly_subtotal"[^>]*>.*Rp 1\.800\.000/);
    expect(saved).toMatch(/data-cloud-scope-field="timeline"[^>]*>.*2 Minggu/);
    expect(saved).toContain('data-cloud-payment-component="monthly_service"');
    expect(saved).toContain('production-ready staging environment');
    expect(saved).toContain('data-limitation-code="scope_change"');
    expect(saved).toContain('data-section-code="limitations"');
  });
});
