import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { it, expect, describe } from 'vitest';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

import { LegalBlockExtension } from './legal-block-extension';
import {
  buildEditorContextMenuItems,
  buildEditorContextMenuSections,
} from './editor-context-menu-model';

describe('editor-context-menu-model', () => {
  const createDocumentContent = () => ({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Normal text ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header 1' }] }],
              },
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header 2' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell A' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell B' }] }],
              },
            ],
          },
        ],
      },
      {
        type: 'legalBlock',
        attrs: { 'data-block-type': 'legal' },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Legal terms and conditions clause' }],
          },
        ],
      },
    ],
  });

  function createTestEditor(options?: { unlocked?: boolean }) {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({ underline: false }),
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        LegalBlockExtension.configure({ unlocked: options?.unlocked ?? false }),
      ],
      content: createDocumentContent(),
    });

    const stateWithPlugins = editor.state.reconfigure({
      plugins: editor.extensionManager.plugins,
    });
    editor.view.updateState(stateWithPlugins);

    return editor;
  }

  it('exports both buildEditorContextMenuItems and buildEditorContextMenuSections', () => {
    expect(buildEditorContextMenuItems).toBeDefined();
    expect(buildEditorContextMenuSections).toBeDefined();
  });

  describe('Normal paragraph selection', () => {
    it('returns formatting and block sections, without table section', () => {
      const editor = createTestEditor();
      // Focus in the first paragraph ("Normal text")
      editor.commands.setTextSelection(3);

      const sections = buildEditorContextMenuSections(editor);
      expect(sections.map((s) => s.id)).toEqual(['format', 'block']);

      const formatSection = sections.find((s) => s.id === 'format');
      expect(formatSection).toBeDefined();
      expect(formatSection?.titleKey).toBe('editor.contextMenu.formatSection');
      expect(formatSection?.items.map((i) => i.id)).toEqual([
        'bold',
        'italic',
        'underline',
        'strike',
        'alignLeft',
        'alignCenter',
        'alignRight',
        'alignJustify',
        'clearFormatting',
      ]);

      const blockSection = sections.find((s) => s.id === 'block');
      expect(blockSection).toBeDefined();
      expect(blockSection?.titleKey).toBe('editor.contextMenu.blockSection');
      expect(blockSection?.items.map((i) => i.id)).toEqual([
        'paragraph',
        'heading1',
        'heading2',
        'heading3',
      ]);

      // Bold should be false at pos 3, paragraph should be true
      const boldItem = formatSection?.items.find((i) => i.id === 'bold');
      expect(boldItem?.isActive).toBe(false);
      expect(boldItem?.disabled).toBe(false);

      const paragraphItem = blockSection?.items.find((i) => i.id === 'paragraph');
      expect(paragraphItem?.isActive).toBe(true);
      expect(paragraphItem?.disabled).toBe(false);

      editor.destroy();
    });

    it('correctly reports isActive for bold mark when selected on bold text', () => {
      const editor = createTestEditor();
      // Selection inside "bold text" (pos 15)
      editor.commands.setTextSelection(15);

      const sections = buildEditorContextMenuSections(editor);
      const boldItem = sections.find((s) => s.id === 'format')?.items.find((i) => i.id === 'bold');
      expect(boldItem?.isActive).toBe(true);

      editor.destroy();
    });

    it('executes formatting actions when item action is triggered', () => {
      const editor = createTestEditor();
      editor.commands.setTextSelection({ from: 1, to: 7 }); // "Normal"

      const sections = buildEditorContextMenuSections(editor);
      const boldItem = sections.find((s) => s.id === 'format')?.items.find((i) => i.id === 'bold');
      expect(boldItem).toBeDefined();

      boldItem?.action(editor);
      expect(editor.isActive('bold')).toBe(true);

      editor.destroy();
    });
  });

  describe('Table cell selection', () => {
    it('includes table section with full operations when cursor is inside a table cell', () => {
      const editor = createTestEditor();
      // Find position inside the table cell "Cell A"
      let cellPos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'tableCell' && cellPos === -1) {
          cellPos = pos + 2;
        }
      });
      expect(cellPos).toBeGreaterThan(0);

      editor.commands.setTextSelection(cellPos);
      expect(editor.isActive('table')).toBe(true);

      const sections = buildEditorContextMenuSections(editor);
      expect(sections.map((s) => s.id)).toEqual(['format', 'block', 'table']);

      const tableSection = sections.find((s) => s.id === 'table');
      expect(tableSection).toBeDefined();
      expect(tableSection?.titleKey).toBe('editor.contextMenu.tableSection');

      const expectedTableItemIds = [
        'addRowBefore',
        'addRowAfter',
        'deleteRow',
        'addColumnBefore',
        'addColumnAfter',
        'deleteColumn',
        'mergeCells',
        'splitCell',
        'toggleHeaderRow',
        'toggleHeaderColumn',
        'deleteTable',
      ];
      expect(tableSection?.items.map((i) => i.id)).toEqual(expectedTableItemIds);

      // Verify each item has labelKey and icon
      tableSection?.items.forEach((item) => {
        expect(item.labelKey).toBeTruthy();
        expect(item.icon).toBeTruthy();
        expect(typeof item.action).toBe('function');
      });

      editor.destroy();
    });

    it('executes table action such as addRowAfter correctly', () => {
      const editor = createTestEditor();
      let cellPos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'tableCell' && cellPos === -1) {
          cellPos = pos + 2;
        }
      });
      editor.commands.setTextSelection(cellPos);

      const sections = buildEditorContextMenuSections(editor);
      const addRowAfterItem = sections
        .find((s) => s.id === 'table')
        ?.items.find((i) => i.id === 'addRowAfter');
      expect(addRowAfterItem).toBeDefined();

      addRowAfterItem?.action(editor);
      expect(editor.isActive('table')).toBe(true);

      editor.destroy();
    });
  });

  describe('Locked legal block selection', () => {
    it('disables all items when cursor is inside a locked legal block', () => {
      const editor = createTestEditor({ unlocked: false });
      // Find position inside legal block
      let legalPos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'legalBlock') {
          legalPos = pos + 2;
        }
      });
      expect(legalPos).toBeGreaterThan(0);

      editor.commands.setTextSelection(legalPos);

      const sections = buildEditorContextMenuSections(editor, { isUnlocked: false });
      sections.forEach((section) => {
        section.items.forEach((item) => {
          expect(item.disabled).toBe(true);
        });
      });

      editor.destroy();
    });

    it('enables items when legal block is unlocked', () => {
      const editor = createTestEditor({ unlocked: true });
      let legalPos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'legalBlock') {
          legalPos = pos + 2;
        }
      });
      editor.commands.setTextSelection(legalPos);

      const sections = buildEditorContextMenuSections(editor, { isUnlocked: true });
      const boldItem = sections.find((s) => s.id === 'format')?.items.find((i) => i.id === 'bold');
      expect(boldItem?.disabled).toBe(false);

      editor.destroy();
    });
  });

  describe('Non-editable editor', () => {
    it('disables all items when editor is non-editable', () => {
      const editor = createTestEditor();
      editor.setEditable(false);
      editor.commands.setTextSelection(3);

      const sections = buildEditorContextMenuSections(editor);
      sections.forEach((section) => {
        section.items.forEach((item) => {
          expect(item.disabled).toBe(true);
        });
      });

      editor.destroy();
    });
  });
});
