import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import type { IconifyName } from 'src/shared/ui/iconify';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from 'src/shared/ui/iconify';

type Props = { editor: Editor };

function ToolbarIcon({ icon }: { icon: string }) {
  return <Iconify icon={icon as IconifyName} width={18} />;
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip title={label} arrow>
      <span>
        <ToggleButton
          value={label}
          size="small"
          selected={active}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
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

export function EditorToolbar({ editor }: Props) {
  const run = (command: () => boolean) => command();
  const setHeading = (value: string) => {
    const level = Number(value);
    if (level === 0) run(() => editor.chain().focus().setParagraph().run());
    else
      run(() =>
        editor
          .chain()
          .focus()
          .toggleHeading({ level: level as 1 | 2 | 3 })
          .run()
      );
  };
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl || 'https://');
    if (url === null) return;
    if (!url.trim()) run(() => editor.chain().focus().unsetLink().run());
    else run(() => editor.chain().focus().setLink({ href: url.trim() }).run());
  };
  const alignments = [
    ['left', 'solar:text-align-left-bold'],
    ['center', 'solar:text-align-center-bold'],
    ['right', 'solar:text-align-right-bold'],
    ['justify', 'solar:text-align-justify-bold'],
  ];

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={0.5}
      sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.neutral' }}
    >
      <ToggleButtonGroup size="small" sx={{ mr: 0.5 }}>
        <ToolButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => run(() => editor.chain().focus().undo().run())}
        >
          <ToolbarIcon icon="solar:undo-left-round-bold" />
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => run(() => editor.chain().focus().redo().run())}
        >
          <ToolbarIcon icon="solar:undo-right-round-bold" />
        </ToolButton>
      </ToggleButtonGroup>
      <Select
        size="small"
        value={
          editor.isActive('heading', { level: 1 })
            ? '1'
            : editor.isActive('heading', { level: 2 })
              ? '2'
              : editor.isActive('heading', { level: 3 })
                ? '3'
                : '0'
        }
        onChange={(event) => setHeading(event.target.value)}
        aria-label="Text style"
        sx={{ minWidth: 116, height: 36, mr: 0.5 }}
      >
        <MenuItem value="0">Paragraph</MenuItem>
        <MenuItem value="1">Heading 1</MenuItem>
        <MenuItem value="2">Heading 2</MenuItem>
        <MenuItem value="3">Heading 3</MenuItem>
      </Select>
      <ToggleButtonGroup size="small">
        <ToolButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        >
          <ToolbarIcon icon="solar:text-bold" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        >
          <ToolbarIcon icon="solar:text-italic" />
        </ToolButton>
        <ToolButton
          label="Underline"
          active={editor.isActive('underline')}
          onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
        >
          <ToolbarIcon icon="solar:text-underline" />
        </ToolButton>
        <ToolButton
          label="Strike"
          active={editor.isActive('strike')}
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <ToolbarIcon icon="solar:text-cross" />
        </ToolButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        {alignments.map(([alignment, icon]) => (
          <ToolButton
            key={alignment}
            label={`Align ${alignment}`}
            active={editor.isActive({ textAlign: alignment })}
            onClick={() => run(() => editor.chain().focus().setTextAlign(alignment).run())}
          >
            <ToolbarIcon icon={icon} />
          </ToolButton>
        ))}
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        <ToolButton
          label="Bulleted list"
          active={editor.isActive('bulletList')}
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          <ToolbarIcon icon="solar:list-bold" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          <ToolbarIcon icon="solar:list-check-bold" />
        </ToolButton>
        <ToolButton
          label="Insert table"
          onClick={() =>
            run(() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            )
          }
        >
          <ToolbarIcon icon="solar:table-bold" />
        </ToolButton>
        <ToolButton label="Link" active={editor.isActive('link')} onClick={setLink}>
          <ToolbarIcon icon="solar:link-bold" />
        </ToolButton>
        <ToolButton
          label="Horizontal rule"
          onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())}
        >
          <ToolbarIcon icon="solar:minus-circle-bold" />
        </ToolButton>
        <ToolButton
          label="Clear formatting"
          onClick={() => run(() => editor.chain().focus().clearNodes().unsetAllMarks().run())}
        >
          <ToolbarIcon icon="solar:eraser-bold" />
        </ToolButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
