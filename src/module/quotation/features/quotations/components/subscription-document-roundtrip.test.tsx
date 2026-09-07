import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';

import { wrapOfficialDocument } from './quotation-editor';
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

const representativeSubscriptionDocument: JSONContent = {
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
              text: 'PENAWARAN LAYANAN SOFTWARE SUBSCRIPTION / SAAS',
              marks: [{ type: 'quotationField', attrs: { 'data-field': 'quotation_number' } }],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'subject' },
          content: [{ type: 'text', text: 'Penawaran Subscription AI Percetakan' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_pic' },
          content: [{ type: 'text', text: 'Bpk. Mitra Percetakan' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_company' },
          content: [{ type: 'text', text: 'PT Percetakan Mandiri Sejahtera' }],
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
              text: 'Melalui penawaran ini, Venturo menyampaikan skema penggunaan layanan software berbasis subscription beserta biaya, periode layanan, ketentuan pembayaran, dan hak para pihak yang disepakati.',
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
                makeCell('tableHeader', 'Nama Paket / Komponen'),
                makeCell('tableHeader', 'Rate (Monthly)'),
                makeCell('tableHeader', 'Period (Month)'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'subscription_period_0', 'data-field': null },
              content: [
                makeCell('tableCell', 'Subscription AI Percetakan'),
                makeCell('tableCell', 'Rp 1.250.000'),
                makeCell('tableCell', '12 Bulan'),
                makeCell('tableCell', 'Rp 15.000.000', { 'data-field': 'subscription_line_total' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 3 }),
                makeCell('tableCell', 'Rp 15.000.000', { 'data-field': 'total_contract' }),
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'features',
        'data-section-number': '2',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 3, textAlign: null, 'data-field': null },
          content: [{ type: 'text', text: 'Fitur AI Percetakan' }],
        },
        {
          type: 'bulletList',
          attrs: { 'data-field': null },
          content: [
            {
              type: 'listItem',
              attrs: { 'data-field': null },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Automated Layout Preflight' }],
                },
              ],
            },
            {
              type: 'listItem',
              attrs: { 'data-field': null },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Color Separation Preview' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'payment',
        'data-section-number': '3',
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
                makeCell('tableHeader', 'Invoice Date'),
                makeCell('tableHeader', 'Due Date'),
                makeCell('tableHeader', 'Nominal'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', '1 Agustus 2026 - 31 Oktober 2026'),
                makeCell('tableCell', 'Saat kontrak ditandatangani'),
                makeCell('tableCell', 'H+14'),
                makeCell('tableCell', 'Rp 3.750.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', '1 November 2026 - 31 Januari 2027'),
                makeCell('tableCell', '1 Oktober 2026'),
                makeCell('tableCell', '15 Oktober 2026'),
                makeCell('tableCell', 'Rp 3.750.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', '1 Februari 2027 - 30 April 2027'),
                makeCell('tableCell', '1 Januari 2027'),
                makeCell('tableCell', '15 Januari 2027'),
                makeCell('tableCell', 'Rp 3.750.000', { 'data-field': 'payment_nominal' }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': null, 'data-field': null },
              content: [
                makeCell('tableCell', '1 Mei 2027 - 31 Juli 2027'),
                makeCell('tableCell', '1 April 2027'),
                makeCell('tableCell', '15 April 2027'),
                makeCell('tableCell', 'Rp 3.750.000', { 'data-field': 'payment_nominal' }),
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'auto_renewal' },
          content: [{ type: 'text', text: 'Masa berlangganan diperpanjang otomatis.' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'tax_clause' },
          content: [{ type: 'text', text: 'Harga belum termasuk PPN.' }],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'rights',
        'data-section-number': '4',
        'data-template-code': null,
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': 'rights_clause' },
          content: [{ type: 'text', text: 'Aplikasi dan source code merupakan milik Venturo.' }],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'income_sharing' },
          content: [
            {
              type: 'text',
              text: 'Pendapatan dari penjualan dari referensi klien dibagi sebesar 50% untuk Venturo dan 50% untuk Mitra. Pembayaran diselesaikan paling lambat 30 hari kerja. Diskon tidak dapat diberikan secara sepihak.',
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
        'data-template-code': 'subscription_saas_legal_v1',
        'data-modified': 'false',
      },
      content: [
        {
          type: 'paragraph',
          attrs: { 'data-field': null },
          content: [{ type: 'text', text: 'Official subscription legal terms and conditions.' }],
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
                makeCell(
                  'tableCell',
                  'Disetujui Oleh, Bpk. Mitra Percetakan - PT Percetakan Mandiri Sejahtera'
                ),
              ],
            },
          ],
        },
      ],
    },
  ],
};

function createEditor(
  content: JSONContent = representativeSubscriptionDocument,
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
    ],
    content,
  });
  const stateWithPlugins = editor.state.reconfigure({
    plugins: editor.extensionManager.plugins,
  });
  editor.view.updateState(stateWithPlugins);
  return editor;
}

describe('subscription saas quotation document round-trip', () => {
  it('wraps editor fragments in the official article marker before persistence', () => {
    expect(
      wrapOfficialDocument('<section data-block-type="commercial"><p>Draft</p></section>')
    ).toBe(
      '<article class="quotation-document"><section data-block-type="commercial"><p>Draft</p></section></article>'
    );
  });

  it('preserves commercial, features, payment, rights, legal, signature, roles, fields, and nominals', () => {
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
      'features',
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
      '5',
      null,
    ]);

    // Verify rights and legal are both parsed as legalBlock
    const rightsSection = sections.find((s) => s.attrs?.['data-block-type'] === 'rights');
    const legalSection = sections.find((s) => s.attrs?.['data-block-type'] === 'legal');
    expect(rightsSection?.type).toBe('legalBlock');
    expect(legalSection?.type).toBe('legalBlock');
    expect(legalSection?.attrs?.['data-template-code']).toBe('subscription_saas_legal_v1');

    // Verify commercial section contains subscription_period_0 and total_contract
    const commercialJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'commercial')
    );
    expect(commercialJson).toContain('subscription_period_0');
    expect(commercialJson).toContain('subscription_line_total');
    expect(commercialJson).toContain('total_contract');
    expect(commercialJson).toContain('Rp 15.000.000');

    // Verify features section structure
    const featuresJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'features')
    );
    expect(featuresJson).toContain('Fitur AI Percetakan');
    expect(featuresJson).toContain('Automated Layout Preflight');
    expect(featuresJson).toContain('Color Separation Preview');

    // Verify payment section contains payment_nominal
    const paymentJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-block-type'] === 'payment')
    );
    expect(paymentJson).toContain('payment_nominal');
    expect(paymentJson).toContain('Rp 3.750.000');
    expect(paymentJson).toContain('auto_renewal');
    expect(paymentJson).toContain('tax_clause');

    // Verify rights section fields
    const rightsJson = JSON.stringify(rightsSection);
    expect(rightsJson).toContain('rights_clause');
    expect(rightsJson).toContain('income_sharing');
    expect(rightsJson).toContain('50%');

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

    // Verify QuotationSectionExtension renders commercial section
    const commRender = QuotationSectionExtension.config.renderHTML?.call(
      {} as any,
      { HTMLAttributes: { 'data-block-type': 'commercial', 'data-section-number': '1' } } as any
    ) as any;
    expect(commRender?.[0]).toBe('section');
    expect(commRender?.[1]?.['data-block-type']).toBe('commercial');
    expect(commRender?.[1]?.['data-section-number']).toBe('1');
  });

  it('protects both legal AND rights blocks when locked, while allowing edits in standard sections', () => {
    const editor = createEditor(representativeSubscriptionDocument, { unlocked: false });

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
    const editor = createEditor(representativeSubscriptionDocument, { unlocked: true });

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
});
