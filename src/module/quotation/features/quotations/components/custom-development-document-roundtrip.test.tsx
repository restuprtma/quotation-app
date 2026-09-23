// @vitest-environment happy-dom

import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';

import { wrapOfficialDocument } from './quotation-editor';
import { QuotationHeaderExtensions } from './quotation-header-extension';
import { buildCanonicalHeaderHTML } from './quotation-header-normalizer';
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

const representativeCustomDevelopmentDocument: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'metadata',
        'data-section-number': null,
        'data-quotation-section': null,
        'data-quotation-section-number': null,
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 1, textAlign: null, 'data-field': null, 'data-quotation-field': null },
          content: [
            {
              type: 'text',
              text: 'PENAWARAN LAYANAN CUSTOM SOFTWARE DEVELOPMENT',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': null, 'data-quotation-field': null },
          content: [
            { type: 'text', text: 'Nomor: ' },
            {
              type: 'text',
              text: 'BENCH-KOPI-STUDIO24',
              marks: [
                {
                  type: 'quotationField',
                  attrs: { 'data-field': 'quotation_number', 'data-quotation-field': null },
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': null, 'data-quotation-field': null },
          content: [
            { type: 'text', text: 'Perihal: ' },
            {
              type: 'text',
              text: 'Penawaran Sistem Kopi Studio24',
              marks: [
                {
                  type: 'quotationField',
                  attrs: { 'data-field': 'subject', 'data-quotation-field': null },
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
        'data-block-type': 'opening',
        'data-section-number': null,
        'data-quotation-section': null,
        'data-quotation-section-number': null,
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami yang berjumlah lebih dari 100 orang.',
            },
          ],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'commercial-development',
        'data-quotation-section-number': '1',
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Biaya Development' }],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                makeCell('tableHeader', 'Deskripsi'),
                makeCell('tableHeader', 'Rate (Monthly)'),
                makeCell('tableHeader', 'SDM'),
                makeCell('tableHeader', 'Period (Month)'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'development_line_0_0' },
              content: [
                makeCell('tableCell', 'Senior Backend Developer'),
                makeCell('tableCell', 'Rp 15.000.000'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', 'Rp 15.000.000', {
                  'data-quotation-field': 'development_line_0_0',
                }),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'development_line_0_1' },
              content: [
                makeCell('tableCell', 'Frontend Developer'),
                makeCell('tableCell', 'Rp 5.062.500'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', 'Rp 5.062.500', {
                  'data-quotation-field': 'development_line_0_1',
                }),
              ],
            },
            {
              type: 'tableRow',
              content: [
                makeCell('tableCell', 'Subtotal', { colspan: 4 }),
                makeCell('tableCell', 'Rp 20.062.500', {
                  'data-quotation-field': 'development_subtotal',
                }),
              ],
            },
            {
              type: 'tableRow',
              content: [
                makeCell('tableCell', 'DISCOUNT', { colspan: 4 }),
                makeCell('tableCell', 'Rp 2.062.500', {
                  'data-quotation-field': 'discount_amount',
                }),
              ],
            },
            {
              type: 'tableRow',
              content: [
                makeCell('tableCell', 'TOTAL INVESTMENT', { colspan: 4 }),
                makeCell('tableCell', 'Rp 18.000.000', {
                  'data-quotation-field': 'total_investment',
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
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'commercial-monthly',
        'data-quotation-section-number': '2',
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '2. Biaya Monthly' }],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                makeCell('tableHeader', 'Deskripsi'),
                makeCell('tableHeader', 'Spesifikasi'),
                makeCell('tableHeader', 'Biaya / Unit'),
                makeCell('tableHeader', 'Jumlah'),
                makeCell('tableHeader', 'Total'),
              ],
            },
            {
              type: 'tableRow',
              attrs: { 'data-role': 'monthly_0' },
              content: [
                makeCell('tableCell', 'Venturo Cloud Mini'),
                makeCell('tableCell', 'Cloud Server Standard'),
                makeCell('tableCell', 'Rp 800.000'),
                makeCell('tableCell', '1'),
                makeCell('tableCell', 'Rp 800.000', { 'data-quotation-field': 'monthly_line_0' }),
              ],
            },
            {
              type: 'tableRow',
              content: [
                makeCell('tableCell', 'TOTAL', { colspan: 4 }),
                makeCell('tableCell', 'Rp 1.272.000', { 'data-quotation-field': 'monthly_total' }),
              ],
            },
          ],
        },
        {
          type: 'bulletList',
          attrs: { 'data-quotation-component': 'monthly-notes' },
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Biaya API Gemini ditandai out-of-pocket.' }],
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
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'scope',
        'data-quotation-section-number': '3',
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '3. Lingkup Pekerjaan & Timeline' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Modul Transaksi & Kasir' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Pencatatan order dan invoice' }],
                },
              ],
            },
          ],
        },
        {
          type: 'quotationSection',
          attrs: {
            'data-block-type': null,
            'data-section-number': null,
            'data-quotation-section': 'timeline',
            'data-quotation-section-number': null,
            'data-quotation-component': null,
            'data-template-code': null,
            'data-modified': null,
          },
          content: [
            {
              type: 'table',
              content: [
                {
                  type: 'tableRow',
                  content: [
                    makeCell('tableHeader', 'Description', { 'data-column-width': '75' }),
                    makeCell('tableHeader', 'Timeline', { 'data-column-width': '25' }),
                  ],
                },
                {
                  type: 'tableRow',
                  content: [
                    makeCell('tableCell', 'Fase 1: Pengembangan dan Testing'),
                    makeCell('tableCell', '4 Minggu'),
                  ],
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
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'payment',
        'data-quotation-section-number': '4',
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '4. Pembayaran' }],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
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
              attrs: {
                'data-role': 'payment_0',
                'data-quotation-component': 'development',
              },
              content: [
                makeCell('tableCell', 'Down Payment 50%'),
                makeCell('tableCell', 'Termin 1'),
                makeCell('tableCell', 'Saat tanda tangan kontrak'),
                makeCell('tableCell', 'H+7'),
                makeCell('tableCell', 'Rp 9.000.000', {
                  'data-quotation-field': 'payment_nominal_0',
                }),
              ],
            },
            {
              type: 'tableRow',
              attrs: {
                'data-role': 'payment_1',
                'data-quotation-component': 'monthly_recurring',
              },
              content: [
                makeCell('tableCell', 'Bulan 1'),
                makeCell('tableCell', 'Layanan Bulanan Cloud & Support'),
                makeCell('tableCell', 'Awal bulan berjalan'),
                makeCell('tableCell', 'H+7'),
                makeCell('tableCell', 'Rp 1.272.000', {
                  'data-quotation-field': 'payment_nominal_1',
                }),
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-quotation-field': 'tax_clause' },
          content: [
            {
              type: 'text',
              text: 'Seluruh rincian biaya belum termasuk PPN sesuai regulasi perpajakan yang berlaku di Indonesia.',
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'rights',
        'data-quotation-section-number': '5',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '5. Hak Para Pihak' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hak cipta dan source code sistem diserahkan penuh kepada klien setelah pelunasan.',
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'limitations',
        'data-quotation-section-number': '6',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '6. Batasan dan Pengecualian' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Biaya akomodasi jika requested.' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'legal',
        'data-quotation-section-number': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Ketentuan umum dan kerahasiaan data.' }],
        },
      ],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': null,
        'data-section-number': null,
        'data-quotation-section': 'signature',
        'data-quotation-section-number': null,
        'data-quotation-component': null,
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Malang, ' },
            {
              type: 'text',
              text: '15 Juli 2026',
              marks: [
                {
                  type: 'quotationField',
                  attrs: { 'data-field': 'issue_date', 'data-quotation-field': null },
                },
              ],
            },
          ],
        },
        {
          type: 'table',
          attrs: { class: 'signature-table' },
          content: [
            {
              type: 'tableRow',
              content: [
                makeCell('tableCell', 'Hormat Kami, Yulianto Frandi'),
                makeCell('tableCell', 'Disetujui Oleh, Bpk. Hendra'),
              ],
            },
          ],
        },
      ],
    },
  ],
};

function createCustomDevEditor(
  content: any = representativeCustomDevelopmentDocument,
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

describe('custom development quotation document round-trip', () => {
  it('wraps editor fragments in the official article marker before persistence', () => {
    expect(
      wrapOfficialDocument(
        '<section data-quotation-section="commercial-development"><p>Draft</p></section>'
      )
    ).toBe(
      '<article class="quotation-document"><section data-quotation-section="commercial-development"><p>Draft</p></section></article>'
    );
  });

  it('preserves all custom development section markers, numbers, tables, fields, and components', () => {
    const editor = createCustomDevEditor();
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    // Verify section order
    const sectionMarkers = sections.map(
      (node) => node.attrs?.['data-quotation-section'] || node.attrs?.['data-block-type']
    );
    expect(sectionMarkers).toEqual([
      'metadata',
      'opening',
      'commercial-development',
      'commercial-monthly',
      'scope',
      'payment',
      'rights',
      'limitations',
      'legal',
      'signature',
    ]);

    // Verify section numbers
    const sectionNumbers = sections.map((node) => node.attrs?.['data-quotation-section-number']);
    expect(sectionNumbers).toEqual([null, null, '1', '2', '3', '4', '5', '6', null, null]);

    // Verify rights, limitations, and legal blocks are parsed as legalBlock
    const rightsSection = sections.find((s) => s.attrs?.['data-quotation-section'] === 'rights');
    const limSection = sections.find((s) => s.attrs?.['data-quotation-section'] === 'limitations');
    const legalSection = sections.find((s) => s.attrs?.['data-quotation-section'] === 'legal');
    expect(rightsSection?.type).toBe('legalBlock');
    expect(limSection?.type).toBe('legalBlock');
    expect(legalSection?.type).toBe('legalBlock');

    // Verify commercial development fields and figures
    const commJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-quotation-section'] === 'commercial-development')
    );
    expect(commJson).toContain('development_line_0_0');
    expect(commJson).toContain('development_line_0_1');
    expect(commJson).toContain('development_subtotal');
    expect(commJson).toContain('discount_amount');
    expect(commJson).toContain('total_investment');
    expect(commJson).toContain('Rp 20.062.500');
    expect(commJson).toContain('Rp 2.062.500');
    expect(commJson).toContain('Rp 18.000.000');

    // Verify commercial monthly fields, totals, and notes component
    const monthlySection = sections.find(
      (s) => s.attrs?.['data-quotation-section'] === 'commercial-monthly'
    );
    const monthlyJson = JSON.stringify(monthlySection);
    expect(monthlyJson).toContain('monthly_line_0');
    expect(monthlyJson).toContain('monthly_total');
    expect(monthlyJson).toContain('Rp 1.272.000');
    expect(monthlyJson).toContain('monthly-notes');
    expect(monthlyJson).toContain('Biaya API Gemini ditandai out-of-pocket.');

    // Verify timeline nested section inside scope
    const scopeJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-quotation-section'] === 'scope')
    );
    expect(scopeJson).toContain('timeline');
    expect(scopeJson).toContain('75');
    expect(scopeJson).toContain('25');
    expect(scopeJson).toContain('4 Minggu');

    // Verify payment components and nominals
    const paymentJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-quotation-section'] === 'payment')
    );
    expect(paymentJson).toContain('development');
    expect(paymentJson).toContain('monthly_recurring');
    expect(paymentJson).toContain('payment_nominal_0');
    expect(paymentJson).toContain('payment_nominal_1');
    expect(paymentJson).toContain('tax_clause');

    // Verify signature table class
    const sigJson = JSON.stringify(
      sections.find((s) => s.attrs?.['data-quotation-section'] === 'signature')
    );
    expect(sigJson).toContain('signature-table');

    editor.destroy();
  });

  it('supports custom development document without monthly and without rights (4 sections)', () => {
    const documentWithoutMonthlyRights: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'quotationSection',
          attrs: {
            'data-quotation-section': 'commercial-development',
            'data-quotation-section-number': '1',
          },
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '1. Biaya Development' }],
            },
          ],
        },
        {
          type: 'quotationSection',
          attrs: { 'data-quotation-section': 'scope', 'data-quotation-section-number': '2' },
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '2. Lingkup Pekerjaan & Timeline' }],
            },
          ],
        },
        {
          type: 'quotationSection',
          attrs: { 'data-quotation-section': 'payment', 'data-quotation-section-number': '3' },
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '3. Pembayaran' }],
            },
          ],
        },
        {
          type: 'legalBlock',
          attrs: { 'data-quotation-section': 'limitations', 'data-quotation-section-number': '4' },
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '4. Batasan dan Pengecualian' }],
            },
          ],
        },
      ],
    };

    const editor = createCustomDevEditor(documentWithoutMonthlyRights);
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    expect(sections.map((node) => node.attrs?.['data-quotation-section'])).toEqual([
      'commercial-development',
      'scope',
      'payment',
      'limitations',
    ]);
    expect(sections.map((node) => node.attrs?.['data-quotation-section-number'])).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);

    editor.destroy();
  });

  it('locks rights, limitations, and legal blocks when locked, while allowing edits in standard sections', () => {
    const editor = createCustomDevEditor(representativeCustomDevelopmentDocument, {
      unlocked: false,
    });

    let rightsPos = -1;
    let limPos = -1;
    let legalPos = -1;
    let scopePos = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock' && node.attrs?.['data-quotation-section'] === 'rights') {
        rightsPos = pos + 2;
      }
      if (
        node.type.name === 'legalBlock' &&
        node.attrs?.['data-quotation-section'] === 'limitations'
      ) {
        limPos = pos + 2;
      }
      if (node.type.name === 'legalBlock' && node.attrs?.['data-quotation-section'] === 'legal') {
        legalPos = pos + 2;
      }
      if (
        node.type.name === 'quotationSection' &&
        node.attrs?.['data-quotation-section'] === 'scope'
      ) {
        scopePos = pos + 2;
      }
    });

    expect(rightsPos).toBeGreaterThan(0);
    expect(limPos).toBeGreaterThan(0);
    expect(legalPos).toBeGreaterThan(0);
    expect(scopePos).toBeGreaterThan(0);

    // 1. Locked rights edit rejected
    const beforeRights = JSON.stringify(editor.getJSON());
    editor.view.dispatch(editor.state.tr.insertText('HACKED_RIGHTS ', rightsPos));
    expect(JSON.stringify(editor.getJSON())).toBe(beforeRights);

    // 2. Locked limitations edit rejected
    const beforeLim = JSON.stringify(editor.getJSON());
    editor.view.dispatch(editor.state.tr.insertText('HACKED_LIMITATIONS ', limPos));
    expect(JSON.stringify(editor.getJSON())).toBe(beforeLim);

    // 3. Locked legal edit rejected
    const beforeLegal = JSON.stringify(editor.getJSON());
    editor.view.dispatch(editor.state.tr.insertText('HACKED_LEGAL ', legalPos));
    expect(JSON.stringify(editor.getJSON())).toBe(beforeLegal);

    // 4. Scope edit accepted
    editor.view.dispatch(editor.state.tr.insertText('EDITED_SCOPE ', scopePos));
    expect(JSON.stringify(editor.getJSON())).toContain('EDITED_SCOPE');

    editor.destroy();
  });

  it('allows editing rights, limitations, and legal blocks once unlocked', () => {
    const editor = createCustomDevEditor(representativeCustomDevelopmentDocument, {
      unlocked: true,
    });

    let rightsPos = -1;
    let limPos = -1;
    let legalPos = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock' && node.attrs?.['data-quotation-section'] === 'rights') {
        rightsPos = pos + 2;
      }
      if (
        node.type.name === 'legalBlock' &&
        node.attrs?.['data-quotation-section'] === 'limitations'
      ) {
        limPos = pos + 2;
      }
      if (node.type.name === 'legalBlock' && node.attrs?.['data-quotation-section'] === 'legal') {
        legalPos = pos + 2;
      }
    });

    editor.view.dispatch(editor.state.tr.insertText('UNLOCKED_RIGHTS_EDIT ', rightsPos));
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_RIGHTS_EDIT');

    editor.view.dispatch(editor.state.tr.insertText('UNLOCKED_LIMITATIONS_EDIT ', limPos));
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_LIMITATIONS_EDIT');

    editor.view.dispatch(editor.state.tr.insertText('UNLOCKED_LEGAL_EDIT ', legalPos));
    expect(JSON.stringify(editor.getJSON())).toContain('UNLOCKED_LEGAL_EDIT');

    editor.destroy();
  });

  it('preserves all non-metadata sections identically before and after header edits', () => {
    const canonicalHeader = buildCanonicalHeaderHTML({
      title: 'PENAWARAN LAYANAN CUSTOM SOFTWARE DEVELOPMENT',
      quotationNumber: 'BENCH-KOPI-STUDIO24',
      subject: 'Penawaran Sistem Kopi Studio24',
      issueDate: '23 September 2026',
      clientPic: 'Bpk. Hendra',
      clientCompany: 'Kopi Studio24',
    });

    const docHTML = `<article class="quotation-document">
      ${canonicalHeader}
      <section data-block-type="opening"><p>Melalui penawaran ini, kami menegaskan kesiapan tim IT Profesional kami.</p></section>
      <section data-quotation-section="commercial-development" data-quotation-section-number="1">
        <h2>1. Biaya Development</h2>
        <table><thead><tr><th>Deskripsi</th><th>Rate (Monthly)</th><th>SDM</th><th>Period (Month)</th><th>Total</th></tr></thead><tbody>
          <tr data-role="development_line_0_0"><td>Senior Backend Developer</td><td>Rp 15.000.000</td><td>1</td><td>1</td><td data-quotation-field="development_line_0_0">Rp 15.000.000</td></tr>
          <tr><td colspan="4">TOTAL INVESTMENT</td><td data-quotation-field="total_investment">Rp 18.000.000</td></tr>
        </tbody></table>
      </section>
      <section data-quotation-section="commercial-monthly" data-quotation-section-number="2">
        <h2>2. Biaya Monthly</h2>
        <table><thead><tr><th>Deskripsi</th><th>Total</th></tr></thead><tbody>
          <tr data-role="monthly_0"><td>Venturo Cloud Mini</td><td data-quotation-field="monthly_line_0">Rp 800.000</td></tr>
        </tbody></table>
      </section>
      <section data-quotation-section="scope" data-quotation-section-number="3">
        <h2>3. Lingkup Pekerjaan &amp; Timeline</h2>
        <table><thead><tr><th>Tahap</th><th>Durasi</th></tr></thead><tbody>
          <tr><td>Design &amp; Architecture</td><td>4 Minggu</td></tr>
        </tbody></table>
      </section>
      <section data-quotation-section="payment" data-quotation-section-number="4">
        <h2>4. Tahapan Pembayaran</h2>
        <table><thead><tr><th>Tahap</th><th>Nominal</th></tr></thead><tbody>
          <tr><td>Termin 1 (DP 50%)</td><td>Rp 9.000.000</td></tr>
        </tbody></table>
      </section>
      <section data-quotation-section="rights" data-quotation-section-number="5" data-template-code="quotation-rights-v1">
        <h2>5. Hak Cipta dan Lisensi</h2>
        <p>Hak cipta source code dialihkan setelah pelunasan.</p>
      </section>
      <section data-quotation-section="limitations" data-quotation-section-number="6" data-template-code="quotation-limitations-v1">
        <h2>6. Batasan dan Pengecualian</h2>
        <p>Pekerjaan di luar lingkup dikenakan biaya terpisah.</p>
      </section>
      <section data-quotation-section="legal" data-template-code="quotation-legal-v1">
        <p>Official legal terms.</p>
      </section>
      <section data-quotation-section="signature">
        <table class="signature-table"><tbody><tr><td>Yulianto Frandi</td><td>Bpk. Hendra</td></tr></tbody></table>
      </section>
    </article>`;

    const editor = createCustomDevEditor(docHTML);

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

    editor.commands.insertContentAt({ from: numPos, to: numPos + numSize }, 'BENCH-KOPI-REVISED-2026');
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationRecipientLine' && node.attrs.field === 'client_company') {
        compPos = pos + 1;
        compSize = node.nodeSize - 2;
      }
    });
    editor.commands.insertContentAt({ from: compPos, to: compPos + compSize }, 'PT Kopi Studio Global');

    const nonMetadataAfter = getNonMetadataSnapshot(editor);
    expect(nonMetadataAfter).toBe(nonMetadataBefore);

    const serialized = editor.getHTML();
    expect(serialized).toContain('BENCH-KOPI-REVISED-2026');
    expect(serialized).toContain('PT Kopi Studio Global');
    expect(serialized).toContain('Rp 15.000.000');
    expect(serialized).toContain('Rp 18.000.000');
    expect(serialized).toContain('Rp 800.000');
    expect(serialized).toContain('Design &amp; Architecture');
    expect(serialized).toContain('Rp 9.000.000');
    expect(serialized).toContain('Hak cipta source code dialihkan setelah pelunasan.');
    expect(serialized).toContain('Official legal terms.');

    editor.destroy();
  });
});
