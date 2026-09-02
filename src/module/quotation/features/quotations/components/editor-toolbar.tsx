import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import type { IconifyName } from 'src/shared/ui/iconify';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { EDITOR_ICONS } from './editor-icons';

type Props = {
  editor: Editor;
  isUnlocked?: boolean;
  onToggleUnlock?: () => void;
  onRestoreOfficial?: () => void;
  disabled?: boolean;
};

function ToolbarIcon({ icon }: { icon: IconifyName }) {
  return <Iconify icon={icon} width={18} />;
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

export function EditorToolbar({
  editor,
  isUnlocked = false,
  onToggleUnlock,
  onRestoreOfficial,
  disabled = false,
}: Props) {
  const { t } = useTranslate('quotation');

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
    const url = window.prompt(t('editor.toolbar.linkPrompt'), previousUrl || 'https://');
    if (url === null) return;
    if (!url.trim()) run(() => editor.chain().focus().unsetLink().run());
    else run(() => editor.chain().focus().setLink({ href: url.trim() }).run());
  };
  const alignments: {
    value: 'left' | 'center' | 'right' | 'justify';
    icon: IconifyName;
    label: string;
  }[] = [
    { value: 'left', icon: EDITOR_ICONS.alignLeft, label: t('editor.toolbar.alignLeft') },
    { value: 'center', icon: EDITOR_ICONS.alignCenter, label: t('editor.toolbar.alignCenter') },
    { value: 'right', icon: EDITOR_ICONS.alignRight, label: t('editor.toolbar.alignRight') },
    { value: 'justify', icon: EDITOR_ICONS.alignJustify, label: t('editor.toolbar.alignJustify') },
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
          label={t('editor.toolbar.undo')}
          disabled={disabled || !editor.can().undo()}
          onClick={() => run(() => editor.chain().focus().undo().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.undo} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.redo')}
          disabled={disabled || !editor.can().redo()}
          onClick={() => run(() => editor.chain().focus().redo().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.redo} />
        </ToolButton>
      </ToggleButtonGroup>
      <Select
        size="small"
        disabled={disabled}
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
        aria-label={t('editor.toolbar.textStyle')}
        sx={{ minWidth: 116, height: 36, mr: 0.5 }}
      >
        <MenuItem value="0">{t('editor.toolbar.paragraph')}</MenuItem>
        <MenuItem value="1">{t('editor.toolbar.heading1')}</MenuItem>
        <MenuItem value="2">{t('editor.toolbar.heading2')}</MenuItem>
        <MenuItem value="3">{t('editor.toolbar.heading3')}</MenuItem>
      </Select>
      <ToggleButtonGroup size="small">
        <ToolButton
          label={t('editor.toolbar.bold')}
          disabled={disabled}
          active={editor.isActive('bold')}
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.bold} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.italic')}
          disabled={disabled}
          active={editor.isActive('italic')}
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.italic} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.underline')}
          disabled={disabled}
          active={editor.isActive('underline')}
          onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.underline} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.strike')}
          disabled={disabled}
          active={editor.isActive('strike')}
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.strike} />
        </ToolButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        {alignments.map(({ value, icon, label }) => (
          <ToolButton
            key={value}
            disabled={disabled}
            label={label}
            active={editor.isActive({ textAlign: value })}
            onClick={() => run(() => editor.chain().focus().setTextAlign(value).run())}
          >
            <ToolbarIcon icon={icon} />
          </ToolButton>
        ))}
      </ToggleButtonGroup>
      <ToggleButtonGroup size="small">
        <ToolButton
          label={t('editor.toolbar.bulletList')}
          disabled={disabled}
          active={editor.isActive('bulletList')}
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.bulletList} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.orderedList')}
          disabled={disabled}
          active={editor.isActive('orderedList')}
          onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.orderedList} />
        </ToolButton>
        <ToolButton
          label={t('editor.table.insert')}
          disabled={disabled}
          onClick={() =>
            run(() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            )
          }
        >
          <ToolbarIcon icon={EDITOR_ICONS.insertTable} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.link')}
          disabled={disabled}
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <ToolbarIcon icon={EDITOR_ICONS.link} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.horizontalRule')}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.horizontalRule} />
        </ToolButton>
        <ToolButton
          label={t('editor.toolbar.clearFormatting')}
          disabled={disabled}
          onClick={() => run(() => editor.chain().focus().clearNodes().unsetAllMarks().run())}
        >
          <ToolbarIcon icon={EDITOR_ICONS.clearFormatting} />
        </ToolButton>
      </ToggleButtonGroup>

      {/* Legal Block Actions */}
      <ToggleButtonGroup size="small" sx={{ ml: 'auto' }}>
        {onToggleUnlock && (
          <ToolButton
            label={isUnlocked ? t('editor.lockLegal') : t('editor.unlockLegal')}
            active={isUnlocked}
            disabled={disabled}
            onClick={onToggleUnlock}
          >
            <ToolbarIcon
              icon={isUnlocked ? EDITOR_ICONS.legalUnlocked : EDITOR_ICONS.legalLocked}
            />
          </ToolButton>
        )}
        {onRestoreOfficial && (
          <ToolButton
            label={t('editor.restoreTemplate')}
            disabled={disabled}
            onClick={onRestoreOfficial}
          >
            <ToolbarIcon icon={EDITOR_ICONS.restoreTemplate} />
          </ToolButton>
        )}
      </ToggleButtonGroup>
    </Stack>
  );
}
