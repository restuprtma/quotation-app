import type { Editor } from '@tiptap/core';
import type { GripItem } from './table-grip-geometry';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { EDITOR_ICONS } from './editor-icons';
import { calculateTableGripPositions } from './table-grip-geometry';
import {
  findTable,
  insertRowAt,
  deleteRowAt,
  insertColumnAt,
  deleteColumnAt,
  isLegalUnlocked,
  isCellInLegalBlock,
} from './table-commands';

export type TableGripOverlayProps = {
  editor: Editor;
  containerRef?: React.RefObject<HTMLElement | null>;
  isUnlocked?: boolean;
};

function getActiveTableElement(editor: Editor): HTMLTableElement | null {
  if (typeof document === 'undefined') return null;
  const table = findTable(editor.state);
  if (!table) return null;

  try {
    const nodeDom = editor.view.nodeDOM(table.pos);
    if (nodeDom instanceof HTMLTableElement) return nodeDom;
    if (nodeDom instanceof HTMLElement) {
      const inside = nodeDom.querySelector('table');
      if (inside) return inside;
    }

    const domAt = editor.view.domAtPos(table.start);
    const parent = domAt.node instanceof HTMLElement ? domAt.node : domAt.node.parentElement;
    const tableFromDom = parent?.closest('table');
    if (tableFromDom) return tableFromDom;
  } catch {
    // fallback to querying editor dom
  }

  return (editor.view.dom?.querySelector('table') as HTMLTableElement | null) ?? null;
}

export function TableGripOverlay({ editor, containerRef, isUnlocked }: TableGripOverlayProps) {
  const { t } = useTranslate('quotation');
  const [grips, setGrips] = useState<GripItem[]>([]);

  const updatePositions = useCallback(() => {
    if (!editor.isActive('table')) {
      setGrips([]);
      return;
    }

    const tableEl = getActiveTableElement(editor);
    if (!tableEl) {
      setGrips([]);
      return;
    }

    const containerEl =
      containerRef?.current ??
      (editor.view.dom.parentElement as HTMLElement | null) ??
      editor.view.dom;
    if (!containerEl) {
      setGrips([]);
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const tableRect = tableEl.getBoundingClientRect();

    const rowEls = Array.from(tableEl.querySelectorAll('tr'));
    const rowRects = rowEls.map((tr) => tr.getBoundingClientRect());

    const colEls = Array.from(rowEls[0]?.querySelectorAll('th, td') || []);
    const colRects = colEls.map((cell) => cell.getBoundingClientRect());

    const calculated = calculateTableGripPositions({
      containerRect,
      tableRect,
      rowRects,
      colRects,
    });

    setGrips(calculated);
  }, [editor, containerRef]);

  useEffect(() => {
    updatePositions();

    const onEditorChange = () => {
      updatePositions();
    };

    editor.on('selectionUpdate', onEditorChange);
    editor.on('transaction', onEditorChange);
    editor.on('update', onEditorChange);

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);

    return () => {
      editor.off('selectionUpdate', onEditorChange);
      editor.off('transaction', onEditorChange);
      editor.off('update', onEditorChange);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [editor, updatePositions]);

  if (!editor.isActive('table') || grips.length === 0) {
    return null;
  }

  const table = findTable(editor.state);
  const isCellLocked = table
    ? isCellInLegalBlock(editor.state.doc, table.start) &&
      (isUnlocked !== undefined ? !isUnlocked : !isLegalUnlocked(editor))
    : false;
  const isBlocked = !editor.isEditable || isCellLocked;

  const handleGripClick = (e: React.MouseEvent, grip: GripItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBlocked) return;

    if (grip.type === 'row') {
      if (grip.action === 'add') {
        insertRowAt(editor, grip.index);
      } else {
        deleteRowAt(editor, grip.index);
      }
    } else if (grip.action === 'add') {
      insertColumnAt(editor, grip.index);
    } else {
      deleteColumnAt(editor, grip.index);
    }
  };

  const getTooltipTitle = (grip: GripItem) => {
    if (grip.type === 'row') {
      return grip.action === 'add' ? t('editor.table.gripAddRow') : t('editor.table.gripDeleteRow');
    }
    return grip.action === 'add'
      ? t('editor.table.gripAddColumn')
      : t('editor.table.gripDeleteColumn');
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {grips.map((grip) => {
        const isCol = grip.type === 'column';
        const isAdd = grip.action === 'add';
        const label = getTooltipTitle(grip);
        const icon = isAdd ? EDITOR_ICONS.gripAdd : EDITOR_ICONS.gripRemove;

        // Visual offset: col grips float slightly above table top, row grips slightly left of table left
        const posX = isCol ? grip.x : grip.x - 14;
        const posY = isCol ? grip.y - 14 : grip.y;

        return (
          <Tooltip key={`${grip.type}-${grip.action}-${grip.index}`} title={label} arrow>
            <span>
              <IconButton
                size="small"
                disabled={isBlocked}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => handleGripClick(e, grip)}
                sx={{
                  position: 'absolute',
                  left: posX,
                  top: posY,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'auto',
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  minHeight: 20,
                  p: 0,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: isAdd ? 'primary.main' : 'text.secondary',
                  boxShadow: 1,
                  borderRadius: '50%',
                  transition: (theme) =>
                    theme.transitions.create(
                      ['background-color', 'border-color', 'transform', 'color'],
                      {
                        duration: theme.transitions.duration.shorter,
                      }
                    ),
                  '&:hover': {
                    bgcolor: isAdd ? 'primary.lighter' : 'error.lighter',
                    borderColor: isAdd ? 'primary.main' : 'error.main',
                    color: isAdd ? 'primary.main' : 'error.main',
                    transform: 'translate(-50%, -50%) scale(1.15)',
                    zIndex: 11,
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    borderColor: 'divider',
                    color: 'action.disabled',
                    pointerEvents: 'none',
                  },
                }}
              >
                <Iconify icon={icon} width={13} />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
}
