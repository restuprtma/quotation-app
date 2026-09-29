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

const makeTable = (columns: number, marker?: { first: string; second: string }) => ({
  type: 'table',
  content: [
    {
      type: 'tableRow',
      attrs: { 'data-role': null, 'data-field': null },
      content: Array.from({ length: columns }, (_, index) =>
        makeCell(
          'tableHeader',
          marker && index === 0
            ? marker.first
            : marker && index === 1
              ? marker.second
              : `Column ${index + 1}`,
          marker && index === 0
            ? { 'data-column-width': '75' }
            : marker && index === 1
              ? { 'data-column-width': '25' }
              : {}
        )
      ),
    },
    {
      type: 'tableRow',
      attrs: { 'data-role': 'web_programmer_senior', 'data-field': null },
      content: Array.from({ length: columns }, (_, index) =>
        makeCell(
          'tableCell',
          index === columns - 1 ? 'Rp 150.000.000' : `Value ${index + 1}`,
          index === columns - 1 ? { 'data-field': 'line_total' } : {}
        )
      ),
    },
  ],
});

const representativeDocument = {
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
              text: 'Dedicated Squad',
              marks: [{ type: 'quotationField', attrs: { 'data-field': 'quotation_number' } }],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { 'data-field': 'client_company' },
          content: [{ type: 'text', text: 'Venturo Pro' }],
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
      content: [{ type: 'table', content: makeTable(5).content }],
    },
    {
      type: 'quotationSection',
      attrs: {
        'data-block-type': 'timeline',
        'data-section-number': '2',
        'data-template-code': null,
        'data-modified': null,
      },
      content: [
        {
          type: 'table',
          content: makeTable(2, { first: 'Description', second: 'Timeline' }).content,
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
      content: [{ type: 'table', content: makeTable(5).content }],
    },
    {
      type: 'legalBlock',
      attrs: {
        'data-block-type': 'legal',
        'data-section-number': '4',
        'data-template-code': 'quotation-legal-v1',
        'data-modified': 'false',
      },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Official legal terms.' }] }],
    },
  ],
};

function createEditor(content: any = representativeDocument) {
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
      LegalBlockExtension.configure({ unlocked: false }),
      ...QuotationHeaderExtensions,
    ],
    content,
  });
  // Headless editors do not mount a view, so explicitly attach the extension
  // plugins before dispatching the protected-block transaction below.
  const stateWithPlugins = editor.state.reconfigure({
    plugins: editor.extensionManager.plugins,
  });
  editor.view.updateState(stateWithPlugins);
  return editor;
}

describe('dedicated quotation document round-trip', () => {
  it('wraps editor fragments in the official article marker before persistence', () => {
    expect(wrapOfficialDocument('<section data-block-type="opening"><p>Draft</p></section>')).toBe(
      '<article class="quotation-document"><section data-block-type="opening"><p>Draft</p></section></article>'
    );
  });

  it('retains section order, protected legal marker, table widths, columns, and money text', () => {
    const editor = createEditor();
    const json = editor.getJSON() as unknown as JSONContent;
    const sections = (json.content ?? []).filter((node) =>
      ['quotationSection', 'legalBlock'].includes(node.type ?? '')
    );

    expect(sections.map((node) => node.attrs?.['data-block-type'])).toEqual([
      'metadata',
      'commercial',
      'timeline',
      'payment',
      'legal',
    ]);
    expect(sections.map((node) => node.attrs?.['data-section-number'])).toEqual([
      null,
      '1',
      '2',
      '3',
      '4',
    ]);

    const contentOf = (node: JSONContent | undefined): JSONContent[] => node?.content ?? [];
    const timeline = sections[2];
    const timelineTable = contentOf(timeline)[0];
    const timelineRow = contentOf(timelineTable)[0];
    const timelineCells = contentOf(timelineRow);
    expect(timelineCells.map((cell) => cell.attrs?.['data-column-width'])).toEqual(['75', '25']);

    const costTable = contentOf(contentOf(sections[1])[0])[0];
    const paymentTable = contentOf(contentOf(sections[3])[0])[0];
    const cost = contentOf(costTable);
    const payment = contentOf(paymentTable);
    expect(cost).toHaveLength(5);
    expect(payment).toHaveLength(5);
    expect(JSON.stringify(json)).toContain('Rp 150.000.000');
    expect(JSON.stringify(json)).toContain('quotation_number');
    expect(JSON.stringify(json)).toContain('client_company');
    expect(sections[4].type).toBe('legalBlock');
    expect(sections[4].attrs?.['data-template-code']).toBe('quotation-legal-v1');

    editor.destroy();
  });

  it('keeps the legal block read-only until the existing unlock command is used', () => {
    const editor = createEditor();
    expect(
      editor.extensionManager.extensions.find((extension) => extension.name === 'legalBlock')
        ?.options.unlocked
    ).toBe(false);
    let legalPosition = -1;
    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'legalBlock') legalPosition = position + 2;
    });

    expect(legalPosition).toBeGreaterThan(0);
    const before = JSON.stringify(editor.getJSON());
    const transaction = editor.state.tr.insertText('TAMPERED ', legalPosition);
    editor.view.dispatch(transaction);
    expect(JSON.stringify(editor.getJSON())).toBe(before);

    editor.destroy();
  });

  it('preserves non-metadata sections identically before and after header edits', () => {
    const canonicalHeader = buildCanonicalHeaderHTML({
      title: 'PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD',
      quotationNumber: 'VEN/2026/001',
      subject: 'Dedicated Team Java & React',
      issueDate: '23 September 2026',
      clientPic: 'Bpk. Hendra',
      clientCompany: 'PT Multi Karya',
    });

    const docHTML = `<article class="quotation-document">
      ${canonicalHeader}
      <section data-block-type="commercial" data-section-number="1">
        <h2>1. Biaya Development Squad</h2>
        <table><thead><tr><th>Squad</th><th>Rate</th><th>Total</th></tr></thead><tbody>
          <tr data-role="web_programmer_senior"><td>Senior Web Programmer</td><td>Rp 15.000.000</td><td data-field="line_total">Rp 150.000.000</td></tr>
        </tbody></table>
      </section>
      <section data-block-type="timeline" data-section-number="2">
        <h2>2. Timeline</h2>
        <table><thead><tr><th data-column-width="75">Deskripsi</th><th data-column-width="25">Durasi</th></tr></thead><tbody>
          <tr><td>Sprint 1-6</td><td>3 Bulan</td></tr>
        </tbody></table>
      </section>
      <section data-block-type="payment" data-section-number="3">
        <h2>3. Pembayaran</h2>
        <table><thead><tr><th>Termin</th><th>Nominal</th></tr></thead><tbody>
          <tr><td>DP 50%</td><td>Rp 75.000.000</td></tr>
        </tbody></table>
      </section>
      <section data-block-type="legal" data-section-number="4" data-template-code="quotation-legal-v1" data-modified="false">
        <p>Official legal terms.</p>
      </section>
    </article>`;

    const editor = createEditor(docHTML);

    // Snapshot non-metadata sections before header edit
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

    // Edit header title and quotation number
    let headingPos = -1;
    let headingSize = 0;
    let numPos = -1;
    let numSize = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && headingPos === -1) {
        headingPos = pos + 1;
        headingSize = node.nodeSize - 2;
      }
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'quotation_number') {
        numPos = pos + 1;
        numSize = node.nodeSize - 2;
      }
    });

    expect(headingPos).toBeGreaterThan(0);
    expect(numPos).toBeGreaterThan(0);

    editor.commands.insertContentAt(
      { from: headingPos, to: headingPos + headingSize },
      'PENAWARAN DEDICATED SQUAD REVISED'
    );
    // Recalculate numPos after heading edit
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'quotation_number') {
        numPos = pos + 1;
        numSize = node.nodeSize - 2;
      }
    });
    editor.commands.insertContentAt({ from: numPos, to: numPos + numSize }, 'VEN/2026/REVISED/999');

    // Verify non-metadata sections are completely preserved and identical
    const nonMetadataAfter = getNonMetadataSnapshot(editor);
    expect(nonMetadataAfter).toBe(nonMetadataBefore);

    // Verify serialized HTML retains non-metadata tables, money figures, and legal block
    const serialized = editor.getHTML();
    expect(serialized).toContain('Rp 150.000.000');
    expect(serialized).toContain('Sprint 1-6');
    expect(serialized).toContain('Rp 75.000.000');
    expect(serialized).toContain('Official legal terms.');
    expect(serialized).toContain('PENAWARAN DEDICATED SQUAD REVISED');
    expect(serialized).toContain('VEN/2026/REVISED/999');

    editor.destroy();
  });
});
