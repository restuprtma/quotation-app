// @vitest-environment happy-dom

import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';

import { wrapOfficialDocument } from './quotation-editor';
import { QuotationHeaderExtensions } from './quotation-header-extension';
import { normalizeQuotationHeaderHTML } from './quotation-header-normalizer';
import {
  QuotationFieldMark,
  LegalBlockExtension,
  QuotationTableExtension,
  QuotationSectionExtension,
  QuotationTableRowExtension,
  QuotationTableCellExtension,
  QuotationTableHeaderExtension,
  QuotationFieldAttributesExtension,
} from './legal-block-extension';

const kioskQueueGovernmentHtml = `<article class="quotation-document kiosk-queue-document">
  <header data-block-type="metadata">
    <h1>PENAWARAN LAYANAN KIOSK &amp; SISTEM ANTRIAN</h1>
    <p><strong>Nomor:</strong> <span data-field="quotation_number">LANDA/MPP-Antrian/0726/003</span></p>
    <p><strong>Perihal:</strong> <span data-field="subject">Sistem Antrian Mall Pelayanan Publik</span></p>
    <p><strong>Tanggal:</strong> <span data-field="issue_date_header">30 Juli 2026</span></p>
    <p><strong>Ditujukan kepada:</strong> <span data-field="client_pic">Etik Mudarifa, S.STP., M.Si.</span></p>
    <p data-field="client_company">DPMPTSP</p>
    <p><strong>Sistem:</strong> <span data-field="system_name">Sistem Antrian Mall Pelayanan Publik</span></p>
  </header>
  <section data-block-type="opening"><p>Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami yang berjumlah lebih dari 100 orang untuk mendukung layanan dan keberhasilan proyek. Dokumen ini memuat ruang lingkup pekerjaan, output, timeline, dan rincian biaya sebagai acuan kesepakatan bersama kedua belah pihak.</p></section>
  <section data-block-type="scope" data-section-number="1">
    <h2>1. Lingkup Pekerjaan</h2>
    <h3>Requirement Analysis &amp; System Design</h3>
    <ul><li>Kick-off meeting dan identifikasi kebutuhan bisnis</li></ul>
  </section>
  <section data-block-type="experts" data-section-number="2">
    <h2>2. Kebutuhan Tenaga Ahli</h2>
    <table><thead><tr><th>Posisi / Peran</th><th>Jumlah SDM</th><th>Durasi</th><th>Kualifikasi Minimal</th></tr></thead><tbody>
      <tr data-role="expert_0"><td>UI/UX Designer</td><td>1</td><td>7 hari</td><td>S1/D4 Desain</td></tr>
    </tbody></table>
  </section>
  <section data-block-type="commercial" data-section-number="3">
    <h2>3. Rincian Biaya</h2>
    <table data-role="service_cost_table"><thead><tr><th>Deskripsi</th><th>Rate (Bulanan)</th><th>Jumlah SDM</th><th>Durasi</th><th>Total</th></tr></thead><tbody>
      <tr><td colspan="5"><strong>Requirement, Design &amp; Development</strong></td></tr>
      <tr data-role="service_0_0"><td>UI UX</td><td>Rp 13.370.000</td><td>1</td><td>0,25 Bulan</td><td data-field="service_line_total">Rp 3.342.500</td></tr>
      <tr><td colspan="4"><strong>Subtotal Jasa</strong></td><td data-field="service_subtotal">Rp 44.310.000</td></tr>
      <tr><td colspan="4"><strong>DISCOUNT</strong></td><td data-field="service_discount_amount">Rp 799.100</td></tr>
      <tr><td colspan="4"><strong>PPN 11%</strong></td><td data-field="service_tax_amount">Rp 4.874.100</td></tr>
      <tr><td colspan="4"><strong>Total Biaya Jasa</strong></td><td data-field="service_total">Rp 48.385.000</td></tr>
    </tbody></table>
    <table data-role="hardware_cost_table"><thead><tr><th>Perangkat Keras</th><th>Harga Satuan</th><th>Jumlah</th><th>Total</th></tr></thead><tbody>
      <tr data-role="hardware_0"><td>Mesin Kiosk Antrian iMin Crane 1 21,5"</td><td>Rp 24.500.000</td><td>1</td><td data-field="hardware_line_total">Rp 24.500.000</td></tr>
      <tr><td colspan="3"><strong>Subtotal Perangkat Keras</strong></td><td data-field="hardware_subtotal">Rp 46.500.000</td></tr>
      <tr><td colspan="3"><strong>PPN 11%</strong></td><td data-field="hardware_tax_amount">Rp 5.115.000</td></tr>
      <tr><td colspan="3"><strong>Total Biaya Perangkat Keras</strong></td><td data-field="hardware_total">Rp 51.615.000</td></tr>
    </tbody></table>
  </section>
  <section data-block-type="payment" data-section-number="4">
    <h2>4. Tahapan Pembayaran</h2>
    <table><thead><tr><th>Tahap Pembayaran</th><th>Dasar Penagihan</th><th>Nominal</th></tr></thead><tbody>
      <tr data-role="government_payment_0"><td>Uang Muka 50%</td><td>Kontrak ditandatangani &amp; SPMK terbit</td><td data-field="payment_nominal">Rp 51.615.000</td></tr>
      <tr data-role="government_payment_1"><td>Pelunasan 50%</td><td>Pekerjaan selesai 100%<br>Berita Acara Serah Terima (BAST)</td><td data-field="payment_nominal">Rp 48.385.000</td></tr>
      <tr><td colspan="2"><strong>TOTAL</strong></td><td data-field="payment_total">Rp 100.000.000</td></tr>
    </tbody></table>
    <p data-field="tax_clause">Total investasi telah termasuk PPN 11% sesuai regulasi perpajakan yang berlaku di Indonesia.</p>
    <p data-field="payment_due_clause">Pembayaran dilakukan maksimal H+14 hari kalender setelah invoice diterbitkan.</p>
  </section>
  <section data-block-type="limitations" data-section-number="5">
    <h2>5. Batasan dan Pengecualian</h2>
    <ol><li>Pekerjaan fisik dan sipil bukan tanggung jawab Venturo.</li></ol>
  </section>
  <section data-block-type="legal"><ol><li>Syarat dan ketentuan berlaku.</li></ol></section>
  <section data-block-type="signature">
    <table class="signature-table"><tbody><tr><td>Yulianto Frandi</td><td>Etik Mudarifa</td></tr></tbody></table>
  </section>
</article>`;

const kioskQueueRightsHtml = `<article class="quotation-document kiosk-queue-document">
  <section data-block-type="commercial"><p>Commercial content</p></section>
  <div data-block-type="rights"><p>Hak cipta dan kepemilikan kode sumber dialihkan kepada Klien setelah pelunasan.</p></div>
  <section data-block-type="legal"><ol><li>Syarat dan ketentuan resmi berlaku.</li></ol></section>
</article>`;

const kioskQueuePrivateHtml = `<article class="quotation-document kiosk-queue-document">
  <header data-block-type="metadata">
    <h1>PENAWARAN LAYANAN KIOSK &amp; SISTEM ANTRIAN</h1>
    <p><strong>Nomor:</strong> <span data-field="quotation_number">VEN/Kiosk-FoodCourt/0826/007</span></p>
  </header>
  <section data-block-type="opening"><p>Melalui penawaran ini, kami menegaskan kesiapan tim.</p></section>
  <section data-block-type="commercial" data-section-number="1">
    <h2>1. Biaya Development</h2>
    <table><thead><tr><th>Deskripsi</th><th>Rate (Bulanan)</th><th>Jumlah SDM</th><th>Durasi</th><th>Total</th></tr></thead><tbody>
      <tr><td colspan="5"><strong>Engineering Kick-off</strong></td></tr>
      <tr data-role="service_0_0"><td>Senior Web Developer</td><td>Rp 11.550.000</td><td>1</td><td>1 Bulan</td><td data-field="service_line_total">Rp 11.550.000</td></tr>
      <tr><td colspan="4"><strong>Subtotal</strong></td><td data-field="service_subtotal">Rp 138.505.000</td></tr>
      <tr><td colspan="4"><strong>DISCOUNT</strong></td><td data-field="service_discount_amount">Rp 42.200.000</td></tr>
      <tr><td colspan="4"><strong>TOTAL INVESTMENT</strong></td><td data-field="service_total">Rp 96.305.000</td></tr>
    </tbody></table>
  </section>
  <section data-block-type="commercial-maintenance" data-section-number="2">
    <h2>2. Biaya Maintenance</h2>
    <table><thead><tr><th>Maintenance Squad</th><th>Rate (Bulanan)</th><th>Jumlah SDM</th><th>Durasi</th><th>Total</th></tr></thead><tbody>
      <tr data-role="maintenance_0"><td>Senior Web Programmer</td><td>Rp 11.550.000</td><td>1</td><td>3 Bulan</td><td data-field="maintenance_line_total">Rp 34.650.000</td></tr>
      <tr><td colspan="4"><strong>TOTAL MAINTENANCE</strong></td><td data-field="maintenance_total">Rp 83.625.000</td></tr>
    </tbody></table>
  </section>
  <section data-block-type="scope" data-section-number="3">
    <h2>3. Lingkup Pekerjaan &amp; Timeline</h2>
    <table><thead><tr><th>Description</th><th>Timeline</th></tr></thead><tbody>
      <tr data-role="timeline_0"><td>Requirement Analysis</td><td>1 - 30 September 2026</td></tr>
    </tbody></table>
  </section>
  <section data-block-type="payment" data-section-number="4">
    <h2>4. Pembayaran</h2>
    <table><thead><tr><th>Work Period</th><th>Terms</th><th>Invoice Date</th><th>Due Date</th><th>Nominal</th></tr></thead><tbody>
      <tr data-role="private_payment_0"><td>Termin 1</td><td>DP</td><td>17 Aug 2026</td><td>31 Aug 2026</td><td data-field="payment_nominal">Rp 6.685.000</td></tr>
      <tr><td colspan="4"><strong>TOTAL</strong></td><td data-field="payment_total">Rp 96.305.000</td></tr>
    </tbody></table>
    <p data-field="tax_clause">Seluruh rincian biaya belum termasuk PPN sesuai regulasi perpajakan yang berlaku di Indonesia.</p>
  </section>
  <section data-block-type="limitations" data-section-number="5">
    <h2>5. Batasan dan Pengecualian</h2>
    <ol><li>Perangkat fisik disediakan oleh klien.</li></ol>
  </section>
  <section data-block-type="legal"><ol><li>Syarat berlaku.</li></ol></section>
</article>`;

function makeEditor(content: string | JSONContent, options = { unlocked: false }) {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      QuotationSectionExtension,
      QuotationFieldAttributesExtension,
      QuotationFieldMark,
      QuotationTableExtension.configure({ resizable: true }),
      QuotationTableRowExtension,
      QuotationTableHeaderExtension,
      QuotationTableCellExtension,
      LegalBlockExtension.configure({ unlocked: options.unlocked }),
      ...QuotationHeaderExtensions,
    ],
    content,
  });
  const stateWithPlugins = editor.state.reconfigure({
    plugins: editor.extensionManager.plugins,
  });
  editor.view.updateState(stateWithPlugins);
  return editor;
}

function roundTrip(html: string): string {
  const editor = makeEditor(html);
  const output = editor.getHTML();
  editor.destroy();
  return output;
}

function tryEditLockedBlock(editor: Editor, blockType: 'rights' | 'legal'): boolean {
  let targetPos = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === blockType) {
      node.descendants((child, childPos) => {
        if (child.isText && targetPos === -1) {
          targetPos = pos + 1 + childPos;
        }
      });
    }
  });
  if (targetPos <= 0) {
    return false;
  }
  const before = JSON.stringify(editor.getJSON());
  const tr = editor.state.tr.insertText('EDIT_ATTEMPT ', targetPos);
  editor.view.dispatch(tr);
  const after = JSON.stringify(editor.getJSON());
  return after !== before;
}

describe('kiosk queue document round-trip', () => {
  it('preserves kiosk queue commercial markers through TipTap round-trip', () => {
    const output = roundTrip(kioskQueueGovernmentHtml);
    expect(output).toContain('data-role="hardware_cost_table"');
    expect(output).toContain('data-field="service_tax_amount"');
    expect(output).toContain('data-field="hardware_tax_amount"');
    expect(output).toContain('data-role="government_payment_0"');
    expect(output).toContain('data-role="service_cost_table"');
    expect(output).toContain('data-field="service_subtotal"');
    expect(output).toContain('data-field="hardware_subtotal"');
    expect(output).toContain('data-field="payment_total"');
    expect(output).toContain('data-field="payment_due_clause"');
  });

  it('keeps rights and legal blocks locked until explicit unlock', () => {
    const editor = makeEditor(kioskQueueRightsHtml);
    expect(tryEditLockedBlock(editor, 'rights')).toBe(false);
    expect(tryEditLockedBlock(editor, 'legal')).toBe(false);

    editor.commands.setLegalUnlocked(true);
    expect(tryEditLockedBlock(editor, 'rights')).toBe(true);
    expect(tryEditLockedBlock(editor, 'legal')).toBe(true);
    editor.destroy();
  });

  it('preserves private food court commercial, maintenance, and timeline markers', () => {
    const output = roundTrip(kioskQueuePrivateHtml);
    expect(output).toContain('data-block-type="commercial"');
    expect(output).toContain('data-block-type="commercial-maintenance"');
    expect(output).toContain('data-field="service_subtotal"');
    expect(output).toContain('data-field="service_discount_amount"');
    expect(output).toContain('data-field="service_total"');
    expect(output).toContain('data-role="maintenance_0"');
    expect(output).toContain('data-field="maintenance_total"');
    expect(output).toContain('data-role="timeline_0"');
    expect(output).toContain('data-role="private_payment_0"');
    expect(output).toContain('data-field="tax_clause"');
    expect(output).not.toContain('hardware_cost_table');
  });

  it('wraps document in official article marker', () => {
    const wrapped = wrapOfficialDocument(
      '<section data-block-type="commercial"><p>Draft</p></section>'
    );
    expect(wrapped).toBe(
      '<article class="quotation-document"><section data-block-type="commercial"><p>Draft</p></section></article>'
    );
  });

  it('preserves all non-metadata sections identically before and after header edits on normalized legacy html', () => {
    // Legacy HTML normalized to canonical
    const normalizedHtml = normalizeQuotationHeaderHTML(kioskQueueGovernmentHtml);
    const editor = makeEditor(normalizedHtml);

    const getNonMetadataSnapshot = (ed: Editor) => {
      const json = ed.getJSON();
      const sections = (json.content ?? []).filter(
        (node) =>
          ['quotationSection', 'legalBlock'].includes(node.type ?? '') &&
          node.attrs?.['data-block-type'] !== 'metadata'
      );
      return JSON.stringify(sections);
    };

    const nonMetadataBefore = getNonMetadataSnapshot(editor);

    // Edit header fields
    let numPos = -1;
    let numSize = 0;
    let sysPos = -1;
    let sysSize = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'quotation_number') {
        numPos = pos + 1;
        numSize = node.nodeSize - 2;
      }
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'system_name') {
        sysPos = pos + 1;
        sysSize = node.nodeSize - 2;
      }
    });

    expect(numPos).toBeGreaterThan(0);
    expect(sysPos).toBeGreaterThan(0);

    editor.commands.insertContentAt(
      { from: numPos, to: numPos + numSize },
      'LANDA/MPP-Antrian/0726/003-REV'
    );
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'system_name') {
        sysPos = pos + 1;
        sysSize = node.nodeSize - 2;
      }
    });
    editor.commands.insertContentAt(
      { from: sysPos, to: sysPos + sysSize },
      'Sistem Antrian MPP V2'
    );

    const nonMetadataAfter = getNonMetadataSnapshot(editor);
    expect(nonMetadataAfter).toBe(nonMetadataBefore);

    const serialized = editor.getHTML();
    expect(serialized).toContain('LANDA/MPP-Antrian/0726/003-REV');
    expect(serialized).toContain('Sistem Antrian MPP V2');
    expect(serialized).toContain('data-role="hardware_cost_table"');
    expect(serialized).toContain('data-role="service_cost_table"');
    expect(serialized).toContain('Rp 51.615.000');
    expect(serialized).toContain('Rp 48.385.000');
    expect(serialized).toContain('Rp 100.000.000');
    expect(serialized).toContain('Pekerjaan fisik dan sipil bukan tanggung jawab Venturo.');

    editor.destroy();
  });
});
