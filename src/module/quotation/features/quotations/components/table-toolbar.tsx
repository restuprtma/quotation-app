import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import type { IconifyName } from 'src/shared/ui/iconify';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { EDITOR_ICONS } from './editor-icons';
import { findTable, isLegalUnlocked, isCellInLegalBlock } from './table-commands';

type Props = { editor: Editor };

function ToolbarIcon({ icon }: { icon: IconifyName }) {
  return <Iconify icon={icon} width={18} />;
}

function Action({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip title={label} arrow>
      <span>
        <ToggleButton
          size="small"
          value={label}
          aria-label={label}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
          sx={{ minWidth: 36, minHeight: 36, px: 0.75 }}
        >
          {children}
        </ToggleButton>
      </span>
    </Tooltip>
  );
}

export function TableToolbar({ editor }: Props) {
  const { t } = useTranslate('quotation');
  const [, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((tick) => tick + 1);
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor.isActive('table')) return null;

  const table = findTable(editor.state);
  const isCellLocked = table
    ? isCellInLegalBlock(editor.state.doc, table.start) && !isLegalUnlocked(editor)
    : false;
  const isBlocked = !editor.isEditable || isCellLocked;

  const command = (action: () => boolean) => action();

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={0.5}
      sx={{ px: 1, py: 0.75, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
    >
      <Action
        label={t('editor.table.addRowBefore')}
        disabled={isBlocked || !editor.can().addRowBefore()}
        onClick={() => command(() => editor.chain().focus().addRowBefore().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.addRowBefore} />
      </Action>
      <Action
        label={t('editor.table.addRowAfter')}
        disabled={isBlocked || !editor.can().addRowAfter()}
        onClick={() => command(() => editor.chain().focus().addRowAfter().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.addRowAfter} />
      </Action>
      <Action
        label={t('editor.table.deleteRow')}
        disabled={isBlocked || !editor.can().deleteRow()}
        onClick={() => command(() => editor.chain().focus().deleteRow().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.deleteRow} />
      </Action>
      <Action
        label={t('editor.table.addColumnBefore')}
        disabled={isBlocked || !editor.can().addColumnBefore()}
        onClick={() => command(() => editor.chain().focus().addColumnBefore().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.addColumnBefore} />
      </Action>
      <Action
        label={t('editor.table.addColumnAfter')}
        disabled={isBlocked || !editor.can().addColumnAfter()}
        onClick={() => command(() => editor.chain().focus().addColumnAfter().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.addColumnAfter} />
      </Action>
      <Action
        label={t('editor.table.deleteColumn')}
        disabled={isBlocked || !editor.can().deleteColumn()}
        onClick={() => command(() => editor.chain().focus().deleteColumn().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.deleteColumn} />
      </Action>
      <Action
        label={t('editor.table.toggleHeaderCell')}
        disabled={isBlocked || !editor.can().toggleHeaderCell()}
        onClick={() => command(() => editor.chain().focus().toggleHeaderCell().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.toggleHeaderCell} />
      </Action>
      <Action
        label={t('editor.table.mergeCells')}
        disabled={isBlocked || !editor.can().mergeCells()}
        onClick={() => command(() => editor.chain().focus().mergeCells().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.mergeCells} />
      </Action>
      <Action
        label={t('editor.table.splitCell')}
        disabled={isBlocked || !editor.can().splitCell()}
        onClick={() => command(() => editor.chain().focus().splitCell().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.splitCell} />
      </Action>
      <Action
        label={t('editor.table.toggleHeaderRow')}
        disabled={isBlocked || !editor.can().toggleHeaderRow()}
        onClick={() => command(() => editor.chain().focus().toggleHeaderRow().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.toggleHeaderRow} />
      </Action>
      <Action
        label={t('editor.table.toggleHeaderColumn')}
        disabled={isBlocked || !editor.can().toggleHeaderColumn()}
        onClick={() => command(() => editor.chain().focus().toggleHeaderColumn().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.toggleHeaderColumn} />
      </Action>
      <Action
        label={t('editor.table.delete')}
        disabled={isBlocked || !editor.can().deleteTable()}
        onClick={() => command(() => editor.chain().focus().deleteTable().run())}
      >
        <ToolbarIcon icon={EDITOR_ICONS.deleteTable} />
      </Action>
    </Stack>
  );
}
