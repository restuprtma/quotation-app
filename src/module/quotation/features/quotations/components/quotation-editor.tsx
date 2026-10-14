import type { JSONContent } from '@tiptap/core';

import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEditor, EditorContent } from '@tiptap/react';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { TableToolbar } from './table-toolbar';
import { EditorToolbar } from './editor-toolbar';
import { DocumentCanvas } from './document-canvas';
import { TableGripOverlay } from './table-grip-overlay';
import { EditorContextMenu } from './editor-context-menu';
import { QuotationHeaderExtensions } from './quotation-header-extension';
import { normalizeQuotationHeaderHTML } from './quotation-header-normalizer';
import {
  QuotationFieldMark,
  LegalBlockExtension,
  QuotationImageExtension,
  QuotationTableExtension,
  QuotationSectionExtension,
  QuotationListItemExtension,
  QuotationTableRowExtension,
  QuotationTableCellExtension,
  QuotationTableHeaderExtension,
  QuotationSignatureBoxExtension,
  QuotationFieldAttributesExtension,
} from './legal-block-extension';

type Props = {
  content: string;
  isUnlocked?: boolean;
  disabled?: boolean;
  onToggleUnlock?: () => void;
  onRestoreOfficial?: () => void;
  onChange?: (state: { html: string; json: JSONContent }) => void;
};

/**
 * Tiptap serializes the document fragment (the ProseMirror `doc` node has no
 * HTML wrapper). Keep the official article wrapper on every save so the
 * persisted draft remains printable and distinguishable from legacy HTML.
 */
export function wrapOfficialDocument(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '<article class="quotation-document"></article>';
  const cloudDocument =
    /data-section-code=["']cloud_cost["']/i.test(trimmed) ||
    /data-cloud-(?:package-row|scope-row|payment-row|field|package-field|scope-field)=/i.test(
      trimmed
    );
  if (/^<article\b[^>]*class=["'][^"']*\bquotation-document\b/i.test(trimmed)) {
    if (cloudDocument) {
      return trimmed
        .replace(
          /(<article\b[^>]*class=["'])[^"']*(["'])/i,
          '$1quotation-document quotation-document--cloud-infrastructure$2'
        )
        .replace(/\sdata-service=["'][^"']*["']/i, '')
        .replace('<article ', '<article data-service="cloud_infrastructure" ');
    }
    return trimmed;
  }
  // The article is outside ProseMirror's document fragment. Talent documents
  // identify themselves with approved child section codes, so restore their
  // fixed service marker when saving rather than accepting arbitrary wrapper
  // attributes from editable HTML.
  const talentDocument =
    !cloudDocument &&
    /\bdata-section-code=["'](?:development_cost|scope_timeline|payment|limitations)["']/i.test(
      trimmed
    );
  const className = talentDocument
    ? 'quotation-document talent-outsourcing-document'
    : cloudDocument
      ? 'quotation-document quotation-document--cloud-infrastructure'
      : 'quotation-document';
  const service = talentDocument
    ? ' data-service="talent_outsourcing"'
    : cloudDocument
      ? ' data-service="cloud_infrastructure"'
      : '';
  return `<article class="${className}"${service}>${trimmed}</article>`;
}

export function QuotationEditor({
  content,
  isUnlocked = false,
  disabled = false,
  onToggleUnlock,
  onRestoreOfficial,
  onChange,
}: Props) {
  const normalizedContent = useMemo(() => normalizeQuotationHeaderHTML(content), [content]);
  const lastContent = useRef(normalizedContent);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false, listItem: false }),
      QuotationListItemExtension,
      QuotationSectionExtension,
      QuotationFieldAttributesExtension,
      QuotationFieldMark,
      QuotationImageExtension,
      QuotationSignatureBoxExtension,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      QuotationTableExtension.configure({ resizable: true }),
      QuotationTableRowExtension,
      QuotationTableHeaderExtension,
      QuotationTableCellExtension,
      LegalBlockExtension.configure({ unlocked: isUnlocked }),
      ...QuotationHeaderExtensions,
    ],
    editorProps: {
      handleDOMEvents: {
        contextmenu: (_view, event) => {
          event.preventDefault();
          setContextMenu({ top: event.clientY, left: event.clientX });
          return true;
        },
      },
    },
    content: normalizedContent,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const wrapped = wrapOfficialDocument(currentEditor.getHTML());
      lastContent.current = wrapped;
      onChange?.({
        html: wrapped,
        json: currentEditor.getJSON(),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setLegalUnlocked(isUnlocked);
  }, [isUnlocked, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (
      !editor ||
      normalizedContent === lastContent.current ||
      normalizedContent === wrapOfficialDocument(editor.getHTML()) ||
      normalizedContent === editor.getHTML()
    )
      return;
    lastContent.current = normalizedContent;
    editor.commands.setContent(normalizedContent, { emitUpdate: false });
  }, [normalizedContent, editor]);

  if (!editor) return null;

  return (
    <DocumentCanvas>
      <Box className="quotation-document__editor-ui" data-editor-ui="true">
        <EditorToolbar
          editor={editor}
          isUnlocked={isUnlocked}
          onToggleUnlock={onToggleUnlock}
          onRestoreOfficial={onRestoreOfficial}
          disabled={disabled}
        />
        <TableToolbar editor={editor} />
      </Box>
      <Box ref={containerRef} className="quotation-document__editor" sx={{ position: 'relative' }}>
        <TableGripOverlay editor={editor} containerRef={containerRef} isUnlocked={isUnlocked} />
        <EditorContent editor={editor} />
      </Box>
      <EditorContextMenu
        editor={editor}
        anchorPosition={contextMenu}
        onClose={() => setContextMenu(null)}
        isUnlocked={isUnlocked}
      />
    </DocumentCanvas>
  );
}
