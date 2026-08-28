import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import type { IconifyName } from 'src/shared/ui/iconify';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';

import { Iconify } from 'src/shared/ui/iconify';

type Props = { editor: Editor };

function ToolbarIcon({ icon }: { icon: string }) {
  return <Iconify icon={icon as IconifyName} width={18} />;
}

function Action({
  label,
  onClick,
  children,
}: {
  label: string;
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
  const [isTableActive, setIsTableActive] = useState(editor.isActive('table'));
  useEffect(() => {
    const update = () => setIsTableActive(editor.isActive('table'));
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    update();
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);
  if (!isTableActive) return null;
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
        label="Add row before"
        onClick={() => command(() => editor.chain().focus().addRowBefore().run())}
      >
        <ToolbarIcon icon="solar:add-circle-bold" />
      </Action>
      <Action
        label="Add row after"
        onClick={() => command(() => editor.chain().focus().addRowAfter().run())}
      >
        <ToolbarIcon icon="solar:add-circle-bold" />
      </Action>
      <Action
        label="Delete row"
        onClick={() => command(() => editor.chain().focus().deleteRow().run())}
      >
        <ToolbarIcon icon="solar:minus-circle-bold" />
      </Action>
      <Action
        label="Add column after"
        onClick={() => command(() => editor.chain().focus().addColumnAfter().run())}
      >
        <ToolbarIcon icon="solar:widget-add-bold" />
      </Action>
      <Action
        label="Add column before"
        onClick={() => command(() => editor.chain().focus().addColumnBefore().run())}
      >
        <ToolbarIcon icon="solar:widget-add-bold" />
      </Action>
      <Action
        label="Delete column"
        onClick={() => command(() => editor.chain().focus().deleteColumn().run())}
      >
        <ToolbarIcon icon="solar:widget-remove-bold" />
      </Action>
      <Action
        label="Toggle header cell"
        onClick={() => command(() => editor.chain().focus().toggleHeaderCell().run())}
      >
        <ToolbarIcon icon="solar:table-bold" />
      </Action>
      <Action
        label="Merge cells"
        onClick={() => command(() => editor.chain().focus().mergeCells().run())}
      >
        <ToolbarIcon icon="solar:transfer-horizontal-bold" />
      </Action>
      <Action
        label="Split cell"
        onClick={() => command(() => editor.chain().focus().splitCell().run())}
      >
        <ToolbarIcon icon="solar:transfer-vertical-bold" />
      </Action>
      <Action
        label="Toggle header row"
        onClick={() => command(() => editor.chain().focus().toggleHeaderRow().run())}
      >
        <ToolbarIcon icon="solar:table-bold" />
      </Action>
      <Action
        label="Toggle header column"
        onClick={() => command(() => editor.chain().focus().toggleHeaderColumn().run())}
      >
        <ToolbarIcon icon="solar:table-bold" />
      </Action>
      <Action
        label="Delete table"
        onClick={() => command(() => editor.chain().focus().deleteTable().run())}
      >
        <ToolbarIcon icon="solar:trash-bin-trash-bold" />
      </Action>
    </Stack>
  );
}
