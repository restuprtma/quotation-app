import type { JSONContent } from '@tiptap/core';

import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import { useRef, useState, useEffect } from 'react';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TableCell from '@tiptap/extension-table-cell';
import { useEditor, EditorContent } from '@tiptap/react';
import TableHeader from '@tiptap/extension-table-header';

import Box from '@mui/material/Box';

import { TableToolbar } from './table-toolbar';
import { EditorToolbar } from './editor-toolbar';
import { DocumentCanvas } from './document-canvas';
import { TableGripOverlay } from './table-grip-overlay';
import { EditorContextMenu } from './editor-context-menu';
import { LegalBlockExtension } from './legal-block-extension';

type Props = {
  content: string;
  isUnlocked?: boolean;
  disabled?: boolean;
  onToggleUnlock?: () => void;
  onRestoreOfficial?: () => void;
  onChange?: (state: { html: string; json: JSONContent }) => void;
};

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
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
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
      onChange?.({ html: currentEditor.getHTML(), json: currentEditor.getJSON() }),
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
      <EditorToolbar
        editor={editor}
        isUnlocked={isUnlocked}
        onToggleUnlock={onToggleUnlock}
        onRestoreOfficial={onRestoreOfficial}
        disabled={disabled}
      />
      <TableToolbar editor={editor} />
      <Box ref={containerRef} sx={{ position: 'relative' }}>
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
