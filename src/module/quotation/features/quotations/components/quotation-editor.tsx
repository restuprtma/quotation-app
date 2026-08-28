import type { JSONContent } from '@tiptap/core';

import { useRef, useEffect } from 'react';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TableCell from '@tiptap/extension-table-cell';
import { useEditor, EditorContent } from '@tiptap/react';
import TableHeader from '@tiptap/extension-table-header';

import { TableToolbar } from './table-toolbar';
import { EditorToolbar } from './editor-toolbar';
import { DocumentCanvas } from './document-canvas';

type Props = {
  content: string;
  onChange?: (state: { html: string; json: JSONContent }) => void;
};

export function QuotationEditor({ content, onChange }: Props) {
  const lastContent = useRef(content);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) =>
      onChange?.({ html: currentEditor.getHTML(), json: currentEditor.getJSON() }),
  });

  useEffect(() => {
    if (!editor || content === lastContent.current || content === editor.getHTML()) return;
    lastContent.current = content;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) return null;

  return (
    <DocumentCanvas>
      <EditorToolbar editor={editor} />
      <TableToolbar editor={editor} />
      <EditorContent editor={editor} />
    </DocumentCanvas>
  );
}
