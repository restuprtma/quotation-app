// @vitest-environment happy-dom

import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';

import { wrapOfficialDocument } from './quotation-editor';
import { QuotationHeaderExtensions } from './quotation-header-extension';
import {
  buildCanonicalHeaderHTML,
  normalizeQuotationHeaderHTML,
} from './quotation-header-normalizer';
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

const makeCell = (type: 'tableCell' | 'tableHeader', text: string, attrs = {}) => ({
  type,
  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null, ...attrs },
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const representativeWhiteLabelDocument: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'metadata',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 1, textAlign: null, 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'PENAWARAN LAYANAN WHITE LABEL PRODUCT',
              marks: [{ type: 'quotationField', attrs: { 'data-field': 'quotation_number' } }],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'subject' },
          content: [{ type: 'text', text: 'Penawaran Lisensi Software POS Minimarket Ponpes' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_pic' },
          content: [{ type: 'text', text: 'Pimpinan Pondok Pesantren' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_company' },
          content: [{ type: 'text', text: 'Ponpes Modern' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'opening',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami yang berjumlah lebih dari 100 orang untuk mendukung layanan dan keberhasilan proyek. Dokumen ini memuat ruang lingkup pekerjaan, output, timeline, dan rincian biaya sebagai acuan kesepakatan bersama kedua belah pihak.',
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'commercial',
        'data-section-number': '1',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Nama Paket'),
                makeCell('tableHeader', 'Rate'),
                makeCell('tableHeader', 'Jumlah'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'license_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Paket Lisensi Software POS Minimarket (White Label)'),
                makeCell('tableCell', 'Rp 35.000.000'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', 'Rp 35.000.000', { 'data-field': 'license_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL INVESTMENT', { colspan: 3 }),
                makeCell('tableCell', 'Rp 35.000.000', { 'data-field': 'total_license' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'commercial-maintenance-hosting',
        'data-section-number': '2',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Nama Paket / Komponen'),
                makeCell('tableHeader', 'Rate (Monthly)'),
                makeCell('tableHeader', 'Employee'),
                makeCell('tableHeader', 'Period (Month)'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'maintenance_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Senior Web Programmer'),
                makeCell('tableCell', 'Rp 16.170.000'),
                makeCell('tableCell', '0.5'),
                makeCell('tableCell', '3 Bulan'),
                makeCell('tableCell', 'Rp 24.255.000', { 'data-field': 'maintenance_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'hosting_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Shared Hosting Small'),
                makeCell('tableCell', 'Rp 350.000'),
                makeCell('tableCell', '-'),
                makeCell('tableCell', '3 Bulan'),
                makeCell('tableCell', 'Rp 1.050.000', { 'data-field': 'hosting_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 4 }),
                makeCell('tableCell', 'Rp 25.305.000', {
                  'data-field': 'maintenance_hosting_total',
                }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'scope',
        'data-section-number': '3',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Master Data' }],
        },
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Inventory' }],
        },
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Pembelian' }],
        },
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Kasir POS' }],
        },
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Kas & Bank' }],
        },
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Laporan' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'payment',
        'data-section-number': '4',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableHeader', 'Work Period'),
                makeCell('tableHeader', 'Terms'),
                makeCell('tableHeader', 'Invoice Date'),
                makeCell('tableHeader', 'Due Date'),
                makeCell('tableHeader', 'Nominal'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Masa Implementasi Awal'),
                makeCell('tableCell', 'Pembayaran Lisensi di awal'),
                makeCell('tableCell', 'Saat kontrak ditandatangani'),
                makeCell('tableCell', 'H+14'),
                makeCell('tableCell', 'Rp 35.000.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Bulan ke-1'),
                makeCell('tableCell', 'Termin 1 Maintenance & Hosting'),
                makeCell('tableCell', '1 Oktober 2026'),
                makeCell('tableCell', '15 Oktober 2026'),
                makeCell('tableCell', 'Rp 8.435.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Bulan ke-2'),
                makeCell('tableCell', 'Termin 2 Maintenance & Hosting'),
                makeCell('tableCell', '1 November 2026'),
                makeCell('tableCell', '15 November 2026'),
                makeCell('tableCell', 'Rp 8.435.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Bulan ke-3'),
                makeCell('tableCell', 'Termin 3 Maintenance & Hosting'),
                makeCell('tableCell', '1 Desember 2026'),
                makeCell('tableCell', '15 Desember 2026'),
                makeCell('tableCell', 'Rp 8.435.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 4 }),
                makeCell('tableCell', 'Rp 60.305.000', { 'data-field': 'payment_total' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'rights',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'Hak cipta dan kepemilikan kode sumber utama tetap berada pada Venturo.',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            {
              type: 'text',
              text: 'Klien memiliki hak lisensi non-eksklusif untuk menggunakan dan merebranding aplikasi.',
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'legal',
        'data-section-number': '5',
        'data-template-code': 'QUOTATION_TERMS',
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [{ type: 'text', text: 'Official white label legal terms and limitations.' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'signature',
        'data-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [
            { type: 'text', text: 'Malang, ' },
            {
              type: 'text',
              text: '7 September 2026',
              marks: [{ type: 'quotationField', attrs: { 'data-field': 'issue_date' } }],
            },
          ],
        },
        {
          type: 'table',
          attrs: { class: 'signature-table' },
          content: [
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'Hormat Kami, Yulianto Frandi - Direksi Venturo Pro'),
                makeCell('tableCell', 'Disetujui Oleh, Pimpinan Pondok Pesantren - Ponpes Modern'),
              ],
            },
          ],
        },
      ],
    },
  ],
};

function createEditor(
  content: any = representativeWhiteLabelDocument,
  options = { unlocked: false }
) {
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

describe('white label quotation document round-trip', () => {
  it('wraps editor fragments in the official article marker before persistence', () => {
    expect(
      wrapOfficialDocument('<section data-block-type="commercial"><p>Draft</p></section>')
    ).toBe(
      '<article class="quotation-document"><section data-block-type="commercial"><p>Draft</p></section></article>'
    );
  });

  it('preserves commercial, commercial-maintenance-hosting, scope, payment, rights, legal, signature, roles, fields, and nominals', () => {
    const editor = createEditor();
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    // Verify section order and block types
    expect(sections.map((node) => node.attrs?.['data-block-type'])).toEqual([
      'metadata',
      'opening',
      'commercial',
      'commercial-maintenance-hosting',
      'scope',
      'payment',
      'rights',
      'legal',
      'signature',
    ]);

    // Verify section numbers
    expect(sections.map((node) => node.attrs?.['data-section-number'])).toEqual([
      null,
      null,
      '1',
      '2',
      '3',
      '4',
      null,
      '5',
      null,
    ]);

    // Verify rights and legal are both parsed as legalBlock
    const rightsSection = sections.find((s) => s.attrs?.['data-block-type'] === 'rights');
    const legalSection = sections.find((s) => s.attrs?.['data-block-type'] === 'legal');
    expect(rightsSection?.type).toBe('legalBlock');
    expect(legalSection?.type).toBe('legalBlock');
    expect(legalSection?.attrs?.['data-template-code']).toBe('QUOTATION_TERMS');

    // Verify commercial section contains license_0, license_line_total, total_license
    const commercialJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'commercial')
    );
    expect(commercialJson).toContain('license_0');
    expect(commercialJson).toContain('license_line_total');
    expect(commercialJson).toContain('total_license');
    expect(commercialJson).toContain('Rp 35.000.000');

    // Verify commercial-maintenance-hosting section contains maintenance_0, hosting_0, totals
    const mhJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'commercial-maintenance-hosting')
    );
    expect(mhJson).toContain('maintenance_0');
    expect(mhJson).toContain('maintenance_line_total');
    expect(mhJson).toContain('Rp 24.255.000');
    expect(mhJson).toContain('hosting_0');
    expect(mhJson).toContain('hosting_line_total');
    expect(mhJson).toContain('Rp 1.050.000');
    expect(mhJson).toContain('maintenance_hosting_total');
    expect(mhJson).toContain('Rp 25.305.000');

    // Verify scope section structure
    const scopeJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'scope')
    );
    expect(scopeJson).toContain('Master Data');
    expect(scopeJson).toContain('Inventory');
    expect(scopeJson).toContain('Pembelian');
    expect(scopeJson).toContain('Kasir POS');
    expect(scopeJson).toContain('Kas & Bank');
    expect(scopeJson).toContain('Laporan');

    // Verify payment section contains payment_nominal and payment_total
    const paymentJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'payment')
    );
    expect(paymentJson).toContain('payment_nominal');
    expect(paymentJson).toContain('payment_total');
    expect(paymentJson).toContain('Rp 60.305.000');
    expect(paymentJson).toContain('Rp 8.435.000');

    // Verify rights section fields
    const rightsJson = JSON.stringify(rightsSection);
    expect(rightsJson).toContain('Hak cipta dan kepemilikan kode sumber');
    expect(rightsJson).toContain('merebranding aplikasi');

    // Verify signature table class
    const signatureJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'signature')
    );
    expect(signatureJson).toContain('signature-table');
    expect(signatureJson).toContain('issue_date');

    editor.destroy();
  });

  it('renders matching block types and classes in extension renderHTML specs', () => {
    // Verify LegalBlockExtension correctly renders rights with data-block-type="rights"
    const rightsRender = LegalBlockExtension.config.renderHTML?.call(
      { options: { unlocked: false, HTMLAttributes: {} } } as any,
      { HTMLAttributes: { 'data-block-type': 'rights' } } as any
    ) as any;
    expect(rightsRender?.[0]).toBe('section');
    expect(rightsRender?.[1]?.['data-block-type']).toBe('rights');
    expect(rightsRender?.[1]?.class).toContain('qtr-legal-locked');

    // Verify LegalBlockExtension correctly renders legal with data-block-type="legal"
    const legalRender = LegalBlockExtension.config.renderHTML?.call(
      { options: { unlocked: true, HTMLAttributes: {} } } as any,
      { HTMLAttributes: { 'data-block-type': 'legal' } } as any
    ) as any;
    expect(legalRender?.[0]).toBe('section');
    expect(legalRender?.[1]?.['data-block-type']).toBe('legal');
    expect(legalRender?.[1]?.class).toContain('qtr-legal-unlocked');

    // Verify QuotationSectionExtension renders commercial-maintenance-hosting section
    const mhRender = QuotationSectionExtension.config.renderHTML?.call(
      {} as any,
      {
        HTMLAttributes: {
          'data-block-type': 'commercial-maintenance-hosting',
          'data-section-number': '2',
        },
      } as any
    ) as any;
    expect(mhRender?.[0]).toBe('section');
    expect(mhRender?.[1]?.['data-block-type']).toBe('commercial-maintenance-hosting');
    expect(mhRender?.[1]?.['data-section-number']).toBe('2');
  });

  it('protects both legal AND rights blocks when locked, while allowing edits in standard sections', () => {
    const editor = createEditor(representativeWhiteLabelDocument, { unlocked: false });

    // 1. Attempt to edit rights block when locked -> must be blocked
    let rightsPosition = -1;
    let legalPosition = -1;
    let commercialPosition = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'rights') {
        rightsPosition = pos + 2;
      }
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'legal') {
        legalPosition = pos + 2;
      }
      if (
        node.type.name === 'quotationSection' &&
        node.attrs?.['data-block-type'] === 'commercial'
      ) {
        commercialPosition = pos + 2;
      }
    });

    expect(rightsPosition).toBeGreaterThan(0);
    expect(legalPosition).toBeGreaterThan(0);
    expect(commercialPosition).toBeGreaterThan(0);

    const beforeRights = JSON.stringify(editor.getJSON());
    const trRights = editor.state.tr.insertText('TAMPERED_RIGHTS ', rightsPosition);
    editor.view.dispatch(trRights);
    expect(JSON.stringify(editor.getJSON())).toBe(beforeRights);

    // 2. Attempt to edit legal block when locked -> must be blocked
    const beforeLegal = JSON.stringify(editor.getJSON());
    const trLegal = editor.state.tr.insertText('TAMPERED_LEGAL ', legalPosition);
    editor.view.dispatch(trLegal);
    expect(JSON.stringify(editor.getJSON())).toBe(beforeLegal);

    // 3. Edit commercial block (standard section) -> must succeed
    const trComm = editor.state.tr.insertText('EDITED_COMMERCIAL ', commercialPosition);
    editor.view.dispatch(trComm);
    expect(JSON.stringify(editor.getJSON())).toContain('EDITED_COMMERCIAL');

    editor.destroy();
  });

  it('allows editing both rights and legal blocks once unlocked', () => {
    const editor = createEditor(representativeWhiteLabelDocument, { unlocked: true });

    let rightsPosition = -1;
    let legalPosition = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'rights') {
        rightsPosition = pos + 2;
      }
      if (node.type.name === 'legalBlock' && node.attrs?.['data-block-type'] === 'legal') {
        legalPosition = pos + 2;
      }
    });

    expect(rightsPosition).toBeGreaterThan(0);
    expect(legalPosition).toBeGreaterThan(0);

    const trRights = editor.state.tr.insertText('UNLOCKED_RIGHTS_EDIT ', rightsPosition);
    editor.view.dispatch(trRights);
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_RIGHTS_EDIT');

    const trLegal = editor.state.tr.insertText('UNLOCKED_LEGAL_EDIT ', legalPosition);
    editor.view.dispatch(trLegal);
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_LEGAL_EDIT');

    editor.destroy();
  });

  it('preserves all non-metadata sections identically before and after header edits', () => {
    const canonicalHeader = buildCanonicalHeaderHTML({
      title: 'PENAWARAN LAYANAN WHITE LABEL PRODUCT',
      quotationNumber: 'WL/2026/001',
      subject: 'Penawaran Lisensi Software POS Minimarket Ponpes',
      issueDate: '23 September 2026',
      clientPic: 'Pimpinan Pondok Pesantren',
      clientCompany: 'Ponpes Modern',
    });

    const docHTML = `<article class="quotation-document">
      ${canonicalHeader}
      <section data-block-type="opening"><p>Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami.</p></section>
      <section data-block-type="commercial" data-section-number="1">
        <h2>1. Biaya Lisensi White Label</h2>
        <table><thead><tr><th>Deskripsi</th><th>Total</th></tr></thead><tbody>
          <tr data-role="license_core"><td>Lisensi Source Code POS</td><td data-field="license_total">Rp 35.000.000</td></tr>
        </tbody></table>
      </section>
      <section data-block-type="commercial-maintenance-hosting" data-section-number="2">
        <h2>2. Biaya Maintenance &amp; Server Hosting</h2>
        <table><thead><tr><th>Layanan</th><th>Total</th></tr></thead><tbody>
          <tr data-role="maintenance_standard"><td>Maintenance Support 3 Bulan</td><td>Rp 16.170.000</td></tr>
        </tbody></table>
      </section>
      <section data-block-type="scope" data-section-number="3">
        <h2>3. Ruang Lingkup Fitur</h2>
        <p>Modul Kasir &amp; POS Minimarket.</p>
      </section>
      <section data-block-type="payment" data-section-number="4">
        <h2>4. Skema Pembayaran</h2>
        <table><thead><tr><th>Termin</th><th>Nominal</th></tr></thead><tbody>
          <tr><td>Termin 1 (DP 50%)</td><td>Rp 30.152.500</td></tr>
        </tbody></table>
      </section>
      <section data-block-type="rights" data-section-number="5" data-template-code="quotation-rights-v1">
        <h2>5. Hak Cipta dan Lisensi</h2>
        <p>Hak cipta dan kepemilikan kode sumber dialihkan kepada Klien setelah pelunasan.</p>
      </section>
      <section data-block-type="legal" data-template-code="quotation-legal-v1">
        <p>Official legal terms.</p>
      </section>
      <section data-block-type="signature">
        <table class="signature-table"><tbody><tr><td>Yulianto Frandi</td><td>Pimpinan Ponpes</td></tr></tbody></table>
      </section>
    </article>`;

    const editor = createEditor(docHTML);

    const getNonMetadataSnapshot = (ed: Editor) => {
      const json = ed.getJSON();
      const sections = (json.content ?? []).filter((node) =>
        ['quotationSection', 'legalBlock'].includes(node.type ?? '') &&
        node.attrs?.['data-block-type'] !== 'metadata'
      );
      return JSON.stringify(sections);
    };

    const nonMetadataBefore = getNonMetadataSnapshot(editor);

    // Edit header fields
    let numPos = -1;
    let numSize = 0;
    let compPos = -1;
    let compSize = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'quotation_number') {
        numPos = pos + 1;
        numSize = node.nodeSize - 2;
      }
      if (node.type.name === 'quotationRecipientLine' && node.attrs.field === 'client_company') {
        compPos = pos + 1;
        compSize = node.nodeSize - 2;
      }
    });

    expect(numPos).toBeGreaterThan(0);
    expect(compPos).toBeGreaterThan(0);

    editor.commands.insertContentAt({ from: numPos, to: numPos + numSize }, 'WL/2026/REVISED/777');
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationRecipientLine' && node.attrs.field === 'client_company') {
        compPos = pos + 1;
        compSize = node.nodeSize - 2;
      }
    });
    editor.commands.insertContentAt({ from: compPos, to: compPos + compSize }, 'Ponpes Modern Al-Hikmah');

    const nonMetadataAfter = getNonMetadataSnapshot(editor);
    expect(nonMetadataAfter).toBe(nonMetadataBefore);

    const serialized = editor.getHTML();
    expect(serialized).toContain('WL/2026/REVISED/777');
    expect(serialized).toContain('Ponpes Modern Al-Hikmah');
    expect(serialized).toContain('Rp 35.000.000');
    expect(serialized).toContain('Rp 16.170.000');
    expect(serialized).toContain('Modul Kasir &amp; POS Minimarket.');
    expect(serialized).toContain('Rp 30.152.500');
    expect(serialized).toContain('Hak cipta dan kepemilikan kode sumber');
    expect(serialized).toContain('Official legal terms.');

    editor.destroy();
  });
});
