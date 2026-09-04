import type { JSONContent } from '@tiptap/core';

import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { useRef, useState, useEffect } from 'react';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEditor, EditorContent } from '@tiptap/react';

import Box from '@mui/material/Box';

import { TableToolbar } from './table-toolbar';
import { EditorToolbar } from './editor-toolbar';
import { DocumentCanvas } from './document-canvas';
import { TableGripOverlay } from './table-grip-overlay';
import { EditorContextMenu } from './editor-context-menu';
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
  if (/^<article\b[^>]*class=["'][^"']*\bquotation-document\b/i.test(trimmed)) {
    return trimmed;
  }
  return `<article class="quotation-document">${trimmed}</article>`;
}

export function QuotationEditor({
  content,
  isUnlocked = false,
  disabled = false,
  onToggleUnlock,
  onRestoreOfficial,
  onChange,
}: Props) {
  const lastContent = useRef(content);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      QuotationSectionExtension,
      QuotationFieldAttributesExtension,
      QuotationFieldMark,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      QuotationTableExtension.configure({ resizable: true }),
      QuotationTableRowExtension,
      QuotationTableHeaderExtension,
      QuotationTableCellExtension,
      LegalBlockExtension.configure({ unlocked: isUnlocked }),
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
    content,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) =>
      onChange?.({
        html: wrapOfficialDocument(currentEditor.getHTML()),
        json: currentEditor.getJSON(),
      }),
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
    if (!editor || content === lastContent.current || content === editor.getHTML()) return;
    lastContent.current = content;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

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
