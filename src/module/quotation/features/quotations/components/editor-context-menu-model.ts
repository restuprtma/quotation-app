import type { Editor } from '@tiptap/core';
import type { IconifyName } from 'src/shared/ui/iconify';

import { EDITOR_ICONS } from './editor-icons';
import { isLegalUnlocked, isCellInLegalBlock } from './table-commands';

export type ContextMenuItem = {
  id: string;
  labelKey: string;
  icon: IconifyName;
  isActive?: boolean;
  disabled?: boolean;
  action: (editor: Editor) => void;
};

export type ContextMenuSection = {
  id: string;
  titleKey: string;
  items: ContextMenuItem[];
};

export interface EditorContextMenuOptions {
  isUnlocked?: boolean;
}

export function buildEditorContextMenuSections(
  editor: Editor,
  options?: EditorContextMenuOptions
): ContextMenuSection[] {
  const selectionPos = editor.state.selection.from;
  const inLegal = isCellInLegalBlock(editor.state.doc, selectionPos);
  const unlocked = options?.isUnlocked !== undefined ? options.isUnlocked : isLegalUnlocked(editor);
  const isLegalLocked = inLegal && !unlocked;
  const isBlocked = !editor.isEditable || isLegalLocked;

  const sections: ContextMenuSection[] = [
    {
      id: 'format',
      titleKey: 'editor.contextMenu.formatSection',
      items: [
        {
          id: 'bold',
          labelKey: 'editor.toolbar.bold',
          icon: EDITOR_ICONS.bold,
          isActive: editor.isActive('bold'),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleBold().run(),
        },
        {
          id: 'italic',
          labelKey: 'editor.toolbar.italic',
          icon: EDITOR_ICONS.italic,
          isActive: editor.isActive('italic'),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleItalic().run(),
        },
        {
          id: 'underline',
          labelKey: 'editor.toolbar.underline',
          icon: EDITOR_ICONS.underline,
          isActive: editor.isActive('underline'),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleUnderline().run(),
        },
        {
          id: 'strike',
          labelKey: 'editor.toolbar.strike',
          icon: EDITOR_ICONS.strike,
          isActive: editor.isActive('strike'),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleStrike().run(),
        },
        {
          id: 'alignLeft',
          labelKey: 'editor.toolbar.alignLeft',
          icon: EDITOR_ICONS.alignLeft,
          isActive: editor.isActive({ textAlign: 'left' }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().setTextAlign('left').run(),
        },
        {
          id: 'alignCenter',
          labelKey: 'editor.toolbar.alignCenter',
          icon: EDITOR_ICONS.alignCenter,
          isActive: editor.isActive({ textAlign: 'center' }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().setTextAlign('center').run(),
        },
        {
          id: 'alignRight',
          labelKey: 'editor.toolbar.alignRight',
          icon: EDITOR_ICONS.alignRight,
          isActive: editor.isActive({ textAlign: 'right' }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().setTextAlign('right').run(),
        },
        {
          id: 'alignJustify',
          labelKey: 'editor.toolbar.alignJustify',
          icon: EDITOR_ICONS.alignJustify,
          isActive: editor.isActive({ textAlign: 'justify' }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().setTextAlign('justify').run(),
        },
        {
          id: 'clearFormatting',
          labelKey: 'editor.toolbar.clearFormatting',
          icon: EDITOR_ICONS.clearFormatting,
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().clearNodes().unsetAllMarks().run(),
        },
      ],
    },
    {
      id: 'block',
      titleKey: 'editor.contextMenu.blockSection',
      items: [
        {
          id: 'paragraph',
          labelKey: 'editor.toolbar.paragraph',
          icon: EDITOR_ICONS.paragraph,
          isActive: editor.isActive('paragraph'),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().setParagraph().run(),
        },
        {
          id: 'heading1',
          labelKey: 'editor.toolbar.heading1',
          icon: EDITOR_ICONS.heading1,
          isActive: editor.isActive('heading', { level: 1 }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
          id: 'heading2',
          labelKey: 'editor.toolbar.heading2',
          icon: EDITOR_ICONS.heading2,
          isActive: editor.isActive('heading', { level: 2 }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          id: 'heading3',
          labelKey: 'editor.toolbar.heading3',
          icon: EDITOR_ICONS.heading3,
          isActive: editor.isActive('heading', { level: 3 }),
          disabled: isBlocked,
          action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
        },
      ],
    },
  ];

  if (editor.isActive('table')) {
    sections.push({
      id: 'table',
      titleKey: 'editor.contextMenu.tableSection',
      items: [
        {
          id: 'addRowBefore',
          labelKey: 'editor.table.addRowBefore',
          icon: EDITOR_ICONS.addRowBefore,
          disabled: isBlocked || !editor.can().addRowBefore(),
          action: (ed) => ed.chain().focus().addRowBefore().run(),
        },
        {
          id: 'addRowAfter',
          labelKey: 'editor.table.addRowAfter',
          icon: EDITOR_ICONS.addRowAfter,
          disabled: isBlocked || !editor.can().addRowAfter(),
          action: (ed) => ed.chain().focus().addRowAfter().run(),
        },
        {
          id: 'deleteRow',
          labelKey: 'editor.table.deleteRow',
          icon: EDITOR_ICONS.deleteRow,
          disabled: isBlocked || !editor.can().deleteRow(),
          action: (ed) => ed.chain().focus().deleteRow().run(),
        },
        {
          id: 'addColumnBefore',
          labelKey: 'editor.table.addColumnBefore',
          icon: EDITOR_ICONS.addColumnBefore,
          disabled: isBlocked || !editor.can().addColumnBefore(),
          action: (ed) => ed.chain().focus().addColumnBefore().run(),
        },
        {
          id: 'addColumnAfter',
          labelKey: 'editor.table.addColumnAfter',
          icon: EDITOR_ICONS.addColumnAfter,
          disabled: isBlocked || !editor.can().addColumnAfter(),
          action: (ed) => ed.chain().focus().addColumnAfter().run(),
        },
        {
          id: 'deleteColumn',
          labelKey: 'editor.table.deleteColumn',
          icon: EDITOR_ICONS.deleteColumn,
          disabled: isBlocked || !editor.can().deleteColumn(),
          action: (ed) => ed.chain().focus().deleteColumn().run(),
        },
        {
          id: 'mergeCells',
          labelKey: 'editor.table.mergeCells',
          icon: EDITOR_ICONS.mergeCells,
          disabled: isBlocked || !editor.can().mergeCells(),
          action: (ed) => ed.chain().focus().mergeCells().run(),
        },
        {
          id: 'splitCell',
          labelKey: 'editor.table.splitCell',
          icon: EDITOR_ICONS.splitCell,
          disabled: isBlocked || !editor.can().splitCell(),
          action: (ed) => ed.chain().focus().splitCell().run(),
        },
        {
          id: 'toggleHeaderRow',
          labelKey: 'editor.table.toggleHeaderRow',
          icon: EDITOR_ICONS.toggleHeaderRow,
          disabled: isBlocked || !editor.can().toggleHeaderRow(),
          action: (ed) => ed.chain().focus().toggleHeaderRow().run(),
        },
        {
          id: 'toggleHeaderColumn',
          labelKey: 'editor.table.toggleHeaderColumn',
          icon: EDITOR_ICONS.toggleHeaderColumn,
          disabled: isBlocked || !editor.can().toggleHeaderColumn(),
          action: (ed) => ed.chain().focus().toggleHeaderColumn().run(),
        },
        {
          id: 'deleteTable',
          labelKey: 'editor.table.delete',
          icon: EDITOR_ICONS.deleteTable,
          disabled: isBlocked || !editor.can().deleteTable(),
          action: (ed) => ed.chain().focus().deleteTable().run(),
        },
      ],
    });
  }

  return sections;
}

export const buildEditorContextMenuItems = buildEditorContextMenuSections;
