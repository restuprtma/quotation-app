import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TableMap } from '@tiptap/pm/tables';
import { it, expect, describe } from 'vitest';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

import { LegalBlockExtension } from './legal-block-extension';
import {
  findTable,
  insertRowAt,
  deleteRowAt,
  insertColumnAt,
  deleteColumnAt,
  getTableDimensions,
  isCellInLegalBlock,
} from './table-commands';

describe('table-commands', () => {
  const createTableContent = () => ({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Intro paragraph' }],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h1' }] }],
              },
              {
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h2' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'c' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'd' }] }],
              },
            ],
          },
        ],
      },
    ],
  });

  const createLegalTableContent = () => ({
    type: 'doc',
    content: [
      {
        type: 'legalBlock',
        attrs: { 'data-block-type': 'legal' },
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h1' }] }],
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h2' }] }],
                  },
                ],
              },
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableCell',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
                  },
                  {
                    type: 'tableCell',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  function createTestEditor(options?: { unlocked?: boolean; content?: any }) {
    const editor = new Editor({
      extensions: [
        StarterKit,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        LegalBlockExtension.configure({ unlocked: options?.unlocked ?? false }),
      ],
      content: options?.content ?? createTableContent(),
    });

    const stateWithPlugins = editor.state.reconfigure({
      plugins: editor.extensionManager.plugins,
    });
    editor.view.updateState(stateWithPlugins);

    return editor;
  }

  function getTableMatrix(editor: Editor): string[][] {
    let tablePos: number | undefined;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'table' && tablePos === undefined) {
        tablePos = pos;
      }
    });

    if (tablePos === undefined) return [];

    const table = findTable(editor.state, tablePos);
    if (!table) return [];

    const map = TableMap.get(table.node);
    const matrix: string[][] = [];

    for (let r = 0; r < map.height; r += 1) {
      const row: string[] = [];
      for (let c = 0; c < map.width; c += 1) {
        const cellPos = table.start + map.map[r * map.width + c];
        const cellNode = editor.state.doc.nodeAt(cellPos);
        row.push(cellNode?.textContent ?? '');
      }
      matrix.push(row);
    }

    return matrix;
  }

  describe('findTable and getTableDimensions', () => {
    it('locates table and returns dimensions by pos and selection', () => {
      const editor = createTestEditor();

      let tablePos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table') tablePos = pos;
      });
      expect(tablePos).toBeGreaterThanOrEqual(0);

      const found = findTable(editor.state, tablePos);
      expect(found).not.toBeNull();
      expect(found?.node.type.name).toBe('table');
      expect(found?.pos).toBe(tablePos);

      const dimensions = getTableDimensions(editor.state, tablePos);
      expect(dimensions).toEqual({ width: 2, height: 3 });

      editor.destroy();
    });

    it('returns null when querying position outside table', () => {
      const editor = createTestEditor();
      const found = findTable(editor.state, 0); // intro paragraph pos
      expect(found).toBeNull();

      const dimensions = getTableDimensions(editor.state, 0);
      expect(dimensions).toBeNull();

      editor.destroy();
    });
  });

  describe('isCellInLegalBlock', () => {
    it('detects when cell is inside legal block', () => {
      const editor = createTestEditor({ content: createLegalTableContent() });

      let tablePos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table') tablePos = pos;
      });

      const inLegal = isCellInLegalBlock(editor.state.doc, tablePos + 2);
      expect(inLegal).toBe(true);

      editor.destroy();
    });

    it('returns false when cell is outside legal block', () => {
      const editor = createTestEditor({ content: createTableContent() });

      let tablePos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table') tablePos = pos;
      });

      const inLegal = isCellInLegalBlock(editor.state.doc, tablePos + 2);
      expect(inLegal).toBe(false);

      editor.destroy();
    });
  });

  describe('insertRowAt', () => {
    it('inserts a row at index 0 (top header row)', () => {
      const editor = createTestEditor();

      const success = insertRowAt(editor, 0);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['', ''],
        ['h1', 'h2'],
        ['a', 'b'],
        ['c', 'd'],
      ]);

      const dims = getTableDimensions(editor.state);
      expect(dims).toEqual({ width: 2, height: 4 });

      editor.destroy();
    });

    it('inserts a row at index 1 (middle row)', () => {
      const editor = createTestEditor();

      const success = insertRowAt(editor, 1);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['h1', 'h2'],
        ['', ''],
        ['a', 'b'],
        ['c', 'd'],
      ]);

      editor.destroy();
    });

    it('inserts a row at index 3 (trailing row at end)', () => {
      const editor = createTestEditor();

      const success = insertRowAt(editor, 3);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['h1', 'h2'],
        ['a', 'b'],
        ['c', 'd'],
        ['', ''],
      ]);

      editor.destroy();
    });

    it('returns false and leaves document unchanged when rowIndex is out of bounds', () => {
      const editor = createTestEditor();
      const beforeJson = JSON.stringify(editor.getJSON());

      expect(insertRowAt(editor, -1)).toBe(false);
      expect(insertRowAt(editor, 99)).toBe(false);

      const afterJson = JSON.stringify(editor.getJSON());
      expect(afterJson).toBe(beforeJson);

      editor.destroy();
    });
  });

  describe('insertColumnAt', () => {
    it('inserts a column at index 0 (left column)', () => {
      const editor = createTestEditor();

      const success = insertColumnAt(editor, 0);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['', 'h1', 'h2'],
        ['', 'a', 'b'],
        ['', 'c', 'd'],
      ]);

      const dims = getTableDimensions(editor.state);
      expect(dims).toEqual({ width: 3, height: 3 });

      editor.destroy();
    });

    it('inserts a column at index 1 (middle column)', () => {
      const editor = createTestEditor();

      const success = insertColumnAt(editor, 1);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['h1', '', 'h2'],
        ['a', '', 'b'],
        ['c', '', 'd'],
      ]);

      editor.destroy();
    });

    it('inserts a column at index 2 (trailing column at right)', () => {
      const editor = createTestEditor();

      const success = insertColumnAt(editor, 2);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['h1', 'h2', ''],
        ['a', 'b', ''],
        ['c', 'd', ''],
      ]);

      editor.destroy();
    });

    it('returns false and leaves document unchanged when colIndex is out of bounds', () => {
      const editor = createTestEditor();
      const beforeJson = JSON.stringify(editor.getJSON());

      expect(insertColumnAt(editor, -1)).toBe(false);
      expect(insertColumnAt(editor, 99)).toBe(false);

      const afterJson = JSON.stringify(editor.getJSON());
      expect(afterJson).toBe(beforeJson);

      editor.destroy();
    });
  });

  describe('deleteRowAt', () => {
    it('deletes row at index 1', () => {
      const editor = createTestEditor();

      const success = deleteRowAt(editor, 1);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([
        ['h1', 'h2'],
        ['c', 'd'],
      ]);

      const dims = getTableDimensions(editor.state);
      expect(dims).toEqual({ width: 2, height: 2 });

      editor.destroy();
    });

    it('returns false and leaves document unchanged when rowIndex is out of bounds', () => {
      const editor = createTestEditor();
      const beforeJson = JSON.stringify(editor.getJSON());

      expect(deleteRowAt(editor, -1)).toBe(false);
      expect(deleteRowAt(editor, 3)).toBe(false);

      const afterJson = JSON.stringify(editor.getJSON());
      expect(afterJson).toBe(beforeJson);

      editor.destroy();
    });
  });

  describe('deleteColumnAt', () => {
    it('deletes column at index 0', () => {
      const editor = createTestEditor();

      const success = deleteColumnAt(editor, 0);
      expect(success).toBe(true);

      const matrix = getTableMatrix(editor);
      expect(matrix).toEqual([['h2'], ['b'], ['d']]);

      const dims = getTableDimensions(editor.state);
      expect(dims).toEqual({ width: 1, height: 3 });

      editor.destroy();
    });

    it('returns false and leaves document unchanged when colIndex is out of bounds', () => {
      const editor = createTestEditor();
      const beforeJson = JSON.stringify(editor.getJSON());

      expect(deleteColumnAt(editor, -1)).toBe(false);
      expect(deleteColumnAt(editor, 2)).toBe(false);

      const afterJson = JSON.stringify(editor.getJSON());
      expect(afterJson).toBe(beforeJson);

      editor.destroy();
    });
  });

  describe('Legal block protection', () => {
    it('rejects row/column insert and delete operations when legalBlock is locked', () => {
      const editor = createTestEditor({
        unlocked: false,
        content: createLegalTableContent(),
      });
      const beforeJson = JSON.stringify(editor.getJSON());

      expect(insertRowAt(editor, 0)).toBe(false);
      expect(insertRowAt(editor, 2)).toBe(false);
      expect(insertColumnAt(editor, 0)).toBe(false);
      expect(insertColumnAt(editor, 2)).toBe(false);
      expect(deleteRowAt(editor, 0)).toBe(false);
      expect(deleteColumnAt(editor, 0)).toBe(false);

      const afterJson = JSON.stringify(editor.getJSON());
      expect(afterJson).toBe(beforeJson);

      editor.destroy();
    });

    it('permits table operations when legalBlock is unlocked', () => {
      const editor = createTestEditor({
        unlocked: true,
        content: createLegalTableContent(),
      });

      const success = insertRowAt(editor, 0);
      expect(success).toBe(true);

      const dims = getTableDimensions(editor.state);
      expect(dims).toEqual({ width: 2, height: 3 });

      editor.destroy();
    });
  });
});
