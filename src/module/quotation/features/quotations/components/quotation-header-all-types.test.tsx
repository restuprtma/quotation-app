// @vitest-environment happy-dom

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';

import { wrapOfficialDocument } from './quotation-editor';
import { QuotationSectionExtension } from './legal-block-extension';
import {
  HEADER_FIELDS,
  QuotationHeaderExtensions,
} from './quotation-header-extension';
import {
  buildCanonicalHeaderHTML,
  normalizeQuotationHeaderHTML,
} from './quotation-header-normalizer';

const OFFICIAL_TITLES = [
  'PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD',
  'PENAWARAN LAYANAN CUSTOM SOFTWARE DEVELOPMENT',
  'PENAWARAN LAYANAN SOFTWARE SUBSCRIPTION / SAAS',
  'PENAWARAN LAYANAN WHITE LABEL PRODUCT',
  'PENAWARAN LAYANAN STANDALONE MAINTENANCE & SUPPORT',
  'PENAWARAN LAYANAN KIOSK & SISTEM ANTRIAN',
  'PENAWARAN LAYANAN TALENT OUTSOURCING',
  'PENAWARAN LAYANAN CLOUD INFRASTRUCTURE',
] as const;

function createEditor(content: string) {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      QuotationSectionExtension,
      ...QuotationHeaderExtensions,
    ],
    content,
  });
  return editor;
}

function editHeading(editor: Editor, newText: string) {
  let pos = -1;
  let size = 0;
  editor.state.doc.descendants((node, p) => {
    if (node.type.name === 'heading') {
      pos = p + 1;
      size = node.nodeSize - 2;
    }
  });
  if (pos > 0) {
    editor.commands.insertContentAt({ from: pos, to: pos + size }, newText);
  }
}

function editField(editor: Editor, typeName: string, fieldName: string, newText: string) {
  let pos = -1;
  let size = 0;
  editor.state.doc.descendants((node, p) => {
    if (node.type.name === typeName && node.attrs.field === fieldName) {
      pos = p + 1;
      size = node.nodeSize - 2;
    }
  });
  if (pos > 0) {
    if (size > 0) {
      editor.commands.insertContentAt({ from: pos, to: pos + size }, newText);
    } else {
      editor.commands.insertContentAt(pos, newText);
    }
  }
}

describe('quotation header round-trip across all quotation types', () => {
  describe('Step 1: table-driven round-trip for all eight official quotation titles', () => {
    it.each(OFFICIAL_TITLES)(
      'round-trips %s preserving brand logo, layout, and 5 data-field markers',
      (title) => {
        const canonicalHTML = buildCanonicalHeaderHTML({
          title,
          quotationNumber: 'VEN/2026/TEST/001',
          subject: `Penawaran ${title}`,
          issueDate: '23 September 2026',
          clientPic: 'Budi Raharjo',
          clientCompany: 'PT Venturo Nusantara',
        });

        const wrappedHTML = wrapOfficialDocument(canonicalHTML);
        const editor = createEditor(wrappedHTML);

        // 1. Verify ProseMirror node types
        const nodeTypes: string[] = [];
        let extractedHeading = '';
        editor.state.doc.descendants((node) => {
          nodeTypes.push(node.type.name);
          if (node.type.name === 'heading') {
            extractedHeading = node.textContent;
          }
        });

        expect(nodeTypes).toContain('quotationSection');
        expect(nodeTypes).toContain('quotationBrand');
        expect(nodeTypes).toContain('heading');
        expect(nodeTypes).toContain('quotationMetadataLayout');
        expect(nodeTypes).toContain('quotationMetadataColumn');
        expect(nodeTypes).toContain('quotationMetadataRow');
        expect(nodeTypes).toContain('quotationRecipientHeading');
        expect(nodeTypes).toContain('quotationRecipientLine');
        expect(extractedHeading).toBe(title);

        // 2. Verify serialized HTML preserves brand logo, title, layout roles, and fields
        const serialized = editor.getHTML();
        const safeTitle = title.replace(/&/g, '&amp;');

        expect(serialized).toContain('data-block-type="metadata"');
        expect(serialized).toContain('data-role="quotation-brand"');
        expect(serialized).toContain('src="/logo/venturo-logo.png"');
        expect(serialized).toContain('alt="Venturo — Expert Programmers"');
        expect(serialized).toContain(`<h1>${safeTitle}</h1>`);
        expect(serialized).toContain('data-role="metadata-layout"');
        expect(serialized).toContain('data-role="metadata-facts"');
        expect(serialized).toContain('data-role="metadata-recipient"');
        expect(serialized).toContain('data-role="recipient-heading"');
        expect(serialized).toContain('Kepada');
        expect(serialized).toContain('data-role="recipient-prefix"');
        expect(serialized).toContain('Yth. ');

        // Verify all 5 canonical header data-field markers are preserved
        for (const field of HEADER_FIELDS) {
          expect(serialized).toContain(`data-field="${field}"`);
        }

        // Verify values
        expect(serialized).toContain('VEN/2026/TEST/001');
        expect(serialized).toContain(`Penawaran ${safeTitle}`);
        expect(serialized).toContain('23 September 2026');
        expect(serialized).toContain('Budi Raharjo');
        expect(serialized).toContain('PT Venturo Nusantara');

        editor.destroy();
      }
    );

    it('round-trips optional system_name field when present in header', () => {
      const canonicalWithSystem = buildCanonicalHeaderHTML({
        title: 'PENAWARAN LAYANAN KIOSK & SISTEM ANTRIAN',
        quotationNumber: 'LANDA/MPP-Antrian/0726/003',
        subject: 'Sistem Antrian Mall Pelayanan Publik',
        issueDate: '30 Juli 2026',
        clientPic: 'Etik Mudarifa, S.STP., M.Si.',
        clientCompany: 'DPMPTSP Kota Mojokerto',
        systemName: 'Sistem Antrian Terpadu MPP',
      });

      const editor = createEditor(canonicalWithSystem);
      const serialized = editor.getHTML();

      expect(serialized).toContain('data-field="system_name"');
      expect(serialized).toContain('Sistem Antrian Terpadu MPP');
      expect(serialized).toContain('Sistem');

      editor.destroy();
    });
  });

  describe('Step 2: editable-value transaction coverage & empty-value editing', () => {
    it('persists edited title, quotation number, subject, date, PIC, and company across editor instances', () => {
      const initialHTML = buildCanonicalHeaderHTML({
        title: 'PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD',
        quotationNumber: 'VEN/ORIGINAL/001',
        subject: 'Initial Subject',
        issueDate: '01 Januari 2026',
        clientPic: 'Original PIC',
        clientCompany: 'Original Company',
      });

      const firstEditor = createEditor(initialHTML);

      // Edit heading and all 5 fields
      editHeading(firstEditor, 'PENAWARAN REVISI KHUSUS ENTERPRISE');
      editField(firstEditor, 'quotationMetadataRow', 'quotation_number', 'VEN/REVISED/2026/888');
      editField(firstEditor, 'quotationMetadataRow', 'subject', 'Pengembangan Portal Digital Terpadu');
      editField(firstEditor, 'quotationMetadataRow', 'issue_date_header', '15 Oktober 2026');
      editField(firstEditor, 'quotationRecipientLine', 'client_pic', 'Dr. Hendra Wijaya');
      editField(firstEditor, 'quotationRecipientLine', 'client_company', 'PT Solusi Digital Pratama');

      // Serialize from first editor
      const serializedFirst = firstEditor.getHTML();
      firstEditor.destroy();

      // Parse into second independent editor instance
      const secondEditor = createEditor(serializedFirst);
      const serializedSecond = secondEditor.getHTML();

      expect(serializedSecond).toContain('<h1>PENAWARAN REVISI KHUSUS ENTERPRISE</h1>');
      expect(serializedSecond).toContain(
        '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">VEN/REVISED/2026/888</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Pengembangan Portal Digital Terpadu</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">15 Oktober 2026</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Dr. Hendra Wijaya</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">PT Solusi Digital Pratama</span></div>'
      );

      // Verify all 5 data-field markers still exist
      for (const field of HEADER_FIELDS) {
        expect(serializedSecond).toContain(`data-field="${field}"`);
      }

      secondEditor.destroy();
    });

    it('accepts edits in initially empty field nodes and retains stable data-field attributes', () => {
      // Build canonical header with all values initially empty
      const emptyHeaderHTML = buildCanonicalHeaderHTML({
        title: 'PENAWARAN LAYANAN SOFTWARE SUBSCRIPTION / SAAS',
        quotationNumber: '',
        subject: '',
        issueDate: '',
        clientPic: '',
        clientCompany: '',
      });

      const firstEditor = createEditor(emptyHeaderHTML);
      const initialSerialized = firstEditor.getHTML();

      // Assert all 5 empty field nodes are present
      expect(initialSerialized).toContain(
        '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
      );
      expect(initialSerialized).toContain(
        '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
      );
      expect(initialSerialized).toContain(
        '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value"></span></div>'
      );
      expect(initialSerialized).toContain(
        '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value"></span></div>'
      );
      expect(initialSerialized).toContain(
        '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value"></span></div>'
      );

      // Insert text dynamically into each empty field node
      editField(firstEditor, 'quotationMetadataRow', 'quotation_number', 'SAAS-2026-999');
      editField(firstEditor, 'quotationMetadataRow', 'subject', 'Langganan ERP Cloud');
      editField(firstEditor, 'quotationMetadataRow', 'issue_date_header', '12 Desember 2026');
      editField(firstEditor, 'quotationRecipientLine', 'client_pic', 'Bpk. Irwan');
      editField(firstEditor, 'quotationRecipientLine', 'client_company', 'PT Maju Makmur');

      const serializedFirst = firstEditor.getHTML();
      firstEditor.destroy();

      // Re-parse in second editor instance
      const secondEditor = createEditor(serializedFirst);
      const serializedSecond = secondEditor.getHTML();

      expect(serializedSecond).toContain(
        '<div data-role="metadata-row" data-field="quotation_number"><span data-role="metadata-label">No</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">SAAS-2026-999</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="metadata-row" data-field="subject"><span data-role="metadata-label">Perihal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">Langganan ERP Cloud</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="metadata-row" data-field="issue_date_header"><span data-role="metadata-label">Tanggal</span><span data-role="metadata-separator">:</span><span data-role="metadata-value">12 Desember 2026</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="recipient-line" data-field="client_pic"><span data-role="recipient-prefix">Yth. </span><span data-role="metadata-value">Bpk. Irwan</span></div>'
      );
      expect(serializedSecond).toContain(
        '<div data-role="recipient-line" data-field="client_company"><span data-role="metadata-value">PT Maju Makmur</span></div>'
      );

      for (const field of HEADER_FIELDS) {
        expect(serializedSecond).toContain(`data-field="${field}"`);
      }

      secondEditor.destroy();
    });

    it('normalizes legacy unlabelled headers and allows editing them safely', () => {
      const legacyHTML = `<article class="quotation-document">
        <header data-block-type="metadata">
          <h1>PENAWARAN LAYANAN TALENT OUTSOURCING</h1>
          <p>TALENT/2026/005</p>
          <p>Penempatan Frontend React</p>
          <p><strong>Tanggal:</strong> 25 Agustus 2026</p>
          <p><strong>Kepada:</strong> Yth. Direktur HR</p>
          <p>PT Global Tech</p>
        </header>
        <section data-block-type="commercial" data-section-number="1"><p>Commercial content</p></section>
      </article>`;

      const normalized = normalizeQuotationHeaderHTML(legacyHTML);
      const editor = createEditor(normalized);
      const serialized = editor.getHTML();

      expect(serialized).toContain('data-role="quotation-brand"');
      expect(serialized).toContain('src="/logo/venturo-logo.png"');
      expect(serialized).toContain('<h1>PENAWARAN LAYANAN TALENT OUTSOURCING</h1>');
      expect(serialized).toContain('TALENT/2026/005');
      expect(serialized).toContain('Penempatan Frontend React');
      expect(serialized).toContain('25 Agustus 2026');
      expect(serialized).toContain('Direktur HR');
      expect(serialized).toContain('PT Global Tech');

      // Verify non-metadata section is intact
      expect(serialized).toContain('<section data-block-type="commercial" data-section-number="1"><p>Commercial content</p></section>');

      editor.destroy();
    });
  });
});
