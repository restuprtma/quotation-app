import type { Editor } from '@tiptap/core';

import React from 'react';

import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { buildEditorContextMenuSections } from './editor-context-menu-model';

export type ContextMenuPosition = { top: number; left: number } | { x: number; y: number };

export type EditorContextMenuProps = {
  editor: Editor;
  anchorPosition?: ContextMenuPosition | null;
  position?: ContextMenuPosition | null;
  onClose: () => void;
  isUnlocked?: boolean;
};

export function EditorContextMenu({
  editor,
  anchorPosition,
  position,
  onClose,
  isUnlocked = false,
}: EditorContextMenuProps) {
  const { t } = useTranslate('quotation');

  const rawPos = anchorPosition ?? position;
  const resolvedAnchorPosition = rawPos
    ? 'top' in rawPos
      ? { top: rawPos.top, left: rawPos.left }
      : { top: rawPos.y, left: rawPos.x }
    : undefined;

  const sections = buildEditorContextMenuSections(editor, { isUnlocked });

  return (
    <Menu
      open={Boolean(resolvedAnchorPosition)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={resolvedAnchorPosition}
      slotProps={{
        paper: {
          sx: {
            minWidth: 200,
            maxHeight: 480,
          },
        },
      }}
    >
      {sections.map((section, sIdx) => (
        <React.Fragment key={section.id}>
          {sIdx > 0 && <Divider sx={{ my: 0.5 }} />}
          <ListSubheader
            disableSticky
            sx={{
              px: 1.5,
              py: 0.5,
              typography: 'overline',
              color: 'text.secondary',
              lineHeight: 1.5,
            }}
          >
            {t(section.titleKey)}
          </ListSubheader>
          {section.items.map((item) => (
            <MenuItem
              key={item.id}
              selected={Boolean(item.isActive)}
              disabled={Boolean(item.disabled)}
              onClick={() => {
                item.action(editor);
                onClose();
              }}
              sx={{
                py: 0.75,
                px: 1.5,
                typography: 'body2',
              }}
            >
              <ListItemIcon
                sx={{ minWidth: 28, color: item.isActive ? 'primary.main' : 'inherit' }}
              >
                <Iconify icon={item.icon} width={18} />
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                primaryTypographyProps={{ typography: 'body2' }}
              />
            </MenuItem>
          ))}
        </React.Fragment>
      ))}
    </Menu>
  );
}
