import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';

import { TableMap } from '@tiptap/pm/tables';

export interface TableQueryResult {
  node: Node;
  pos: number;
  start: number;
}

export interface TableDimensions {
  width: number;
  height: number;
}

/**
 * Checks if a cell or position inside the document is enclosed in a legalBlock node.
 */
export function isCellInLegalBlock(doc: Node, pos: number): boolean {
  if (pos < 0 || pos > doc.content.size) {
    return false;
  }

  const $pos = doc.resolve(pos);
  for (let d = $pos.depth; d > 0; d -= 1) {
    if ($pos.node(d).type.name === 'legalBlock') {
      return true;
    }
  }

  return false;
}

/**
 * Helper to check whether the legal block extension in the given editor is unlocked.
 */
export function isLegalUnlocked(editor: Editor): boolean {
  if ((editor.storage as any)?.legalBlock?.unlocked !== undefined) {
    return Boolean((editor.storage as any).legalBlock.unlocked);
  }

  const legalExt = editor.extensionManager?.extensions?.find((e) => e.name === 'legalBlock');
  if (legalExt?.options && 'unlocked' in legalExt.options) {
    return Boolean((legalExt.options as any).unlocked);
  }

  return false;
}

/**
 * Finds the table node, its start offset, and document position from given pos or current selection.
 */
export function findTable(state: EditorState, pos?: number): TableQueryResult | null {
  if (pos !== undefined) {
    if (pos < 0 || pos > state.doc.content.size) {
      return null;
    }

    const $pos = state.doc.resolve(pos);
    if ($pos.nodeAfter?.type.name === 'table') {
      return {
        node: $pos.nodeAfter,
        pos,
        start: pos + 1,
      };
    }

    for (let d = $pos.depth; d > 0; d -= 1) {
      if ($pos.node(d).type.name === 'table') {
        return {
          node: $pos.node(d),
          pos: $pos.before(d),
          start: $pos.start(d),
        };
      }
    }

    return null;
  }

  const { selection } = state;
  if ('node' in selection && (selection as any).node?.type.name === 'table') {
    return {
      node: (selection as any).node,
      pos: selection.from,
      start: selection.from + 1,
    };
  }

  const $pos = selection.$from;
  for (let d = $pos.depth; d > 0; d -= 1) {
    if ($pos.node(d).type.name === 'table') {
      return {
        node: $pos.node(d),
        pos: $pos.before(d),
        start: $pos.start(d),
      };
    }
  }

  let firstTable: TableQueryResult | null = null;
  state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'table' && !firstTable) {
      firstTable = {
        node,
        pos: nodePos,
        start: nodePos + 1,
      };
      return false;
    }
    return true;
  });

  return firstTable;
}

/**
 * Returns the column (width) and row (height) dimensions of the table.
 */
export function getTableDimensions(state: EditorState, pos?: number): TableDimensions | null {
  const table = findTable(state, pos);
  if (!table) {
    return null;
  }

  const map = TableMap.get(table.node);
  return {
    width: map.width,
    height: map.height,
  };
}

/**
 * Inserts a row at the given rowIndex (0-indexed).
 * If rowIndex < height, inserts row before target row.
 * If rowIndex === height, inserts row after last row (trailing).
 */
export function insertRowAt(editor: Editor, rowIndex: number, tablePos?: number): boolean {
  const table = findTable(editor.state, tablePos);
  if (!table) {
    return false;
  }

  if (isCellInLegalBlock(editor.state.doc, table.start) && !isLegalUnlocked(editor)) {
    return false;
  }

  const map = TableMap.get(table.node);
  if (rowIndex < 0 || rowIndex > map.height || map.height === 0) {
    return false;
  }

  if (rowIndex < map.height) {
    const cellOffset = map.map[rowIndex * map.width];
    const targetPos = table.start + cellOffset;
    return editor.chain().setCellSelection({ anchorCell: targetPos }).addRowBefore().run();
  }

  const cellOffset = map.map[(map.height - 1) * map.width];
  const targetPos = table.start + cellOffset;
  return editor.chain().setCellSelection({ anchorCell: targetPos }).addRowAfter().run();
}

/**
 * Inserts a column at the given colIndex (0-indexed).
 * If colIndex < width, inserts column before target column.
 * If colIndex === width, inserts column after last column (trailing).
 */
export function insertColumnAt(editor: Editor, colIndex: number, tablePos?: number): boolean {
  const table = findTable(editor.state, tablePos);
  if (!table) {
    return false;
  }

  if (isCellInLegalBlock(editor.state.doc, table.start) && !isLegalUnlocked(editor)) {
    return false;
  }

  const map = TableMap.get(table.node);
  if (colIndex < 0 || colIndex > map.width || map.width === 0) {
    return false;
  }

  if (colIndex < map.width) {
    const cellOffset = map.map[colIndex];
    const targetPos = table.start + cellOffset;
    return editor.chain().setCellSelection({ anchorCell: targetPos }).addColumnBefore().run();
  }

  const cellOffset = map.map[colIndex - 1];
  const targetPos = table.start + cellOffset;
  return editor.chain().setCellSelection({ anchorCell: targetPos }).addColumnAfter().run();
}

/**
 * Deletes the row at the given rowIndex (0-indexed).
 */
export function deleteRowAt(editor: Editor, rowIndex: number, tablePos?: number): boolean {
  const table = findTable(editor.state, tablePos);
  if (!table) {
    return false;
  }

  if (isCellInLegalBlock(editor.state.doc, table.start) && !isLegalUnlocked(editor)) {
    return false;
  }

  const map = TableMap.get(table.node);
  if (rowIndex < 0 || rowIndex >= map.height) {
    return false;
  }

  const cellOffset = map.map[rowIndex * map.width];
  const targetPos = table.start + cellOffset;
  return editor.chain().setCellSelection({ anchorCell: targetPos }).deleteRow().run();
}

/**
 * Deletes the column at the given colIndex (0-indexed).
 */
export function deleteColumnAt(editor: Editor, colIndex: number, tablePos?: number): boolean {
  const table = findTable(editor.state, tablePos);
  if (!table) {
    return false;
  }

  if (isCellInLegalBlock(editor.state.doc, table.start) && !isLegalUnlocked(editor)) {
    return false;
  }

  const map = TableMap.get(table.node);
  if (colIndex < 0 || colIndex >= map.width) {
    return false;
  }

  const cellOffset = map.map[colIndex];
  const targetPos = table.start + cellOffset;
  return editor.chain().setCellSelection({ anchorCell: targetPos }).deleteColumn().run();
}
