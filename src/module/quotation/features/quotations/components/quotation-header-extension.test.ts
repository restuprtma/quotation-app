import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
// @vitest-environment happy-dom
import { it, expect, describe } from 'vitest';

import { QuotationSectionExtension } from './legal-block-extension';
import {
  FACT_LABELS,
  HEADER_FIELDS,
  QuotationBrand,
  QuotationMetadataRow,
  QuotationRecipientLine,
  QuotationMetadataLayout,
  QuotationMetadataColumn,
  QuotationRecipientHeading,
  QuotationHeaderExtensions,
} from './quotation-header-extension';

const CANONICAL_HEADER_HTML = `<section data-block-type="metadata">
  <div data-role="quotation-brand"><img src="/logo/venturo-logo.png" alt="Venturo — Expert Programmers"></div>
  <h1>EDITABLE TITLE</h1>
  <div data-role="metadata-layout">
    <div data-role="metadata-facts">
      <div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Q-1</span></div>
      <div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Sistem Uji</span></div>
      <div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>
    </div>
    <div data-role="metadata-recipient">
      <div data-role="recipient-heading">Kepada</div>
      <div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Budi</span></div>
      <div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value"></span></div>
    </div>
  </div>
</section>`.trim();

function createHeaderEditor(content: string = CANONICAL_HEADER_HTML) {
  return new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      QuotationSectionExtension,
      ...QuotationHeaderExtensions,
    ],
    content,
  });
}

describe('QuotationHeaderExtensions', () => {
  it('exports expected constants and node extensions', () => {
    expect(HEADER_FIELDS).toEqual([
      'quotation_number',
      'subject',
      'issue_date_header',
      'client_pic',
      'client_company',
    ]);
    expect(FACT_LABELS).toEqual({
      quotation_number: 'No',
      subject: 'Perihal',
      issue_date_header: 'Tanggal',
      system_name: 'Sistem',
    });
    expect(QuotationHeaderExtensions).toHaveLength(6);
    expect(QuotationHeaderExtensions).toContain(QuotationBrand);
    expect(QuotationHeaderExtensions).toContain(QuotationMetadataLayout);
    expect(QuotationHeaderExtensions).toContain(QuotationMetadataColumn);
    expect(QuotationHeaderExtensions).toContain(QuotationMetadataRow);
    expect(QuotationHeaderExtensions).toContain(QuotationRecipientHeading);
    expect(QuotationHeaderExtensions).toContain(QuotationRecipientLine);
  });

  it('round-trips canonical header roles and empty field nodes into semantic Tiptap JSON and HTML', () => {
    const editor = createHeaderEditor();

    // Verify ProseMirror node types in JSON
    const nodeTypes: string[] = [];
    editor.state.doc.descendants((node) => {
      nodeTypes.push(node.type.name);
    });

    expect(nodeTypes).toContain('quotationSection');
    expect(nodeTypes).toContain('quotationBrand');
    expect(nodeTypes).toContain('heading');
    expect(nodeTypes).toContain('quotationMetadataLayout');
    expect(nodeTypes).toContain('quotationMetadataColumn');
    expect(nodeTypes).toContain('quotationMetadataRow');
    expect(nodeTypes).toContain('quotationRecipientHeading');
    expect(nodeTypes).toContain('quotationRecipientLine');

    // Verify HTML serialization
    const html = editor.getHTML();
    expect(html).toContain('data-block-type="metadata"');
    expect(html).toContain('data-role="quotation-brand"');
    expect(html).toContain('src="/logo/venturo-logo.png"');
    expect(html).toContain('alt="Venturo — Expert Programmers"');
    expect(html).toContain('<h1>EDITABLE TITLE</h1>');
    expect(html).toContain('data-role="metadata-layout"');
    expect(html).toContain('data-role="metadata-facts"');
    expect(html).toContain('data-role="metadata-recipient"');
    expect(html).toContain('data-field="quotation_number"');
    expect(html).toContain('data-field="subject"');
    expect(html).toContain('data-field="issue_date_header"');
    expect(html).toContain('data-role="recipient-heading"');
    expect(html).toContain('data-field="client_pic"');
    expect(html).toContain('data-field="client_company"');
    expect(html).toContain('data-role="recipient-prefix"');
    expect(html).toContain('Yth. ');

    editor.destroy();
  });

  it('preserves data-field attributes on empty field nodes', () => {
    const editor = createHeaderEditor();
    const html = editor.getHTML();

    expect(html).toContain(
      '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
    );
    expect(html).toContain(
      '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value"></span></div>'
    );

    editor.destroy();
  });

  it('edits title, fact values, and recipient lines properly', () => {
    const editor = createHeaderEditor();

    // 1. Edit heading
    let headingPos = -1;
    let headingSize = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headingPos = pos + 1;
        headingSize = node.nodeSize - 2;
      }
    });
    expect(headingPos).toBeGreaterThan(0);
    editor.commands.insertContentAt(
      { from: headingPos, to: headingPos + headingSize },
      'PENAWARAN KERJASAMA'
    );

    // 2. Edit quotation_number value
    let numberPos = -1;
    let numberSize = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationMetadataRow' && node.attrs.field === 'quotation_number') {
        numberPos = pos + 1;
        numberSize = node.nodeSize - 2;
      }
    });
    expect(numberPos).toBeGreaterThan(0);
    editor.commands.insertContentAt({ from: numberPos, to: numberPos + numberSize }, 'Q-2026-001');

    // 3. Edit client_company (which was empty)
    let companyPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'quotationRecipientLine' && node.attrs.field === 'client_company') {
        companyPos = pos + 1;
      }
    });
    expect(companyPos).toBeGreaterThan(0);
    editor.commands.insertContentAt(companyPos, 'PT Maju Bersama');

    const updatedHtml = editor.getHTML();
    expect(updatedHtml).toContain('<h1>PENAWARAN KERJASAMA</h1>');
    expect(updatedHtml).toContain(
      '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Q-2026-001</span></div>'
    );
    expect(updatedHtml).toContain(
      '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">PT Maju Bersama</span></div>'
    );

    editor.destroy();
  });

  it('marks brand logo as atom and non-selectable', () => {
    expect(QuotationBrand.config.atom).toBe(true);
    expect(QuotationBrand.config.selectable).toBe(false);
    expect(QuotationBrand.config.draggable).toBe(false);
  });
});
