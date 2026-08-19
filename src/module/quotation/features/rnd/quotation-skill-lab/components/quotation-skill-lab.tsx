import type { Editor as TiptapEditor } from '@tiptap/core';
import type { IconifyName } from 'src/shared/ui/iconify/register-icons';
import type { OperationId, RoundTripReport, RoundTripScenarioId } from '../types';

import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import { useRef, useState, useEffect } from 'react';
import TextAlign from '@tiptap/extension-text-align';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Editor, useEditor, EditorContent } from '@tiptap/react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Box, Chip, Paper, Stack } from '@mui/material';
import DialogContentText from '@mui/material/DialogContentText';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { createOperationState } from '../types';
import { compareRoundTrip } from '../utils/compare-dom';
import { RoundTripReportView } from './round-trip-report';
import { canonicalizeHTML } from '../utils/canonicalize-html';
import { ROUND_TRIP_FIXTURES, LEGAL_CANDIDATE_HTML } from '../fixtures/round-trip-fixtures';
import {
  LegalLock,
  isLegalLocked,
  setLegalLocked,
  QuotationSection,
  replaceLegalSection,
} from '../extensions/quotation-section';

const extensions = [
  StarterKit.configure({ link: false, underline: false }),
  Underline,
  Link.configure({ openOnClick: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  QuotationSection,
  LegalLock,
];

const LEGAL_WORD = 'kesiapan';
const LEGAL_REPLACEMENT = 'komitmen';

type ToolAction = {
  id: OperationId;
  icon: IconifyName;
  run: (editor: TiptapEditor) => boolean;
  canRun?: (editor: TiptapEditor) => boolean;
};

function cellWidthSignature(editor: TiptapEditor): string {
  const widths: unknown[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      const width = node.attrs.colwidth ?? node.attrs.style;
      if (width !== null && width !== undefined) widths.push(width);
    }
  });
  return JSON.stringify(widths);
}

function legalMarker(editor: TiptapEditor): string | null {
  const root = document.createElement('div');
  root.innerHTML = editor.getHTML();
  return (
    root.querySelector('section[data-block-type="legal"]')?.getAttribute('data-modified') ?? null
  );
}

function legalHTML(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = canonicalizeHTML(html);
  return root.querySelector('section[data-block-type="legal"]')?.outerHTML ?? '';
}

export function QuotationSkillLab() {
  const { t } = useTranslate('quotation-skill-lab');
  const [scenario, setScenario] = useState<RoundTripScenarioId>('simple');
  const [operations, setOperations] = useState(createOperationState);
  const [report, setReport] = useState<RoundTripReport | null>(null);
  const [recreatedHTML, setRecreatedHTML] = useState('');
  const [recreatedEditor, setRecreatedEditor] = useState<TiptapEditor | null>(null);
  const [legalLocked, setLegalLockedState] = useState(true);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const widthSignature = useRef('');
  const scenarioRef = useRef<RoundTripScenarioId>('simple');
  const verifierRef = useRef<TiptapEditor | null>(null);

  const editor = useEditor({
    extensions,
    content: ROUND_TRIP_FIXTURES.simple.html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'quotation-skill-editor',
        role: 'textbox',
        'aria-label': t('editor.sourceAriaLabel'),
      },
    },
    onCreate: ({ editor: createdEditor }) => {
      widthSignature.current = cellWidthSignature(createdEditor);
      setLegalLockedState(isLegalLocked(createdEditor));
    },
    onTransaction: ({ editor: currentEditor }) => {
      setLegalLockedState(isLegalLocked(currentEditor));
      const nextSignature = cellWidthSignature(currentEditor);
      if (scenarioRef.current === 'table-heavy' && widthSignature.current !== nextSignature) {
        setOperations((current) => ({ ...current, 'column-resized': true }));
      }
      widthSignature.current = nextSignature;
    },
  });

  useEffect(
    () => () => {
      verifierRef.current?.destroy();
      verifierRef.current = null;
    },
    []
  );

  const resetScenario = (nextScenario: RoundTripScenarioId = scenario) => {
    if (!editor) return;
    verifierRef.current?.destroy();
    verifierRef.current = null;
    setRecreatedEditor(null);
    setRecreatedHTML('');
    setReport(null);
    setOperations(createOperationState());
    setLegalLocked(editor, false);
    editor.commands.setContent(ROUND_TRIP_FIXTURES[nextScenario].html);
    setLegalLocked(editor, true);
    setLegalLockedState(true);
    widthSignature.current = cellWidthSignature(editor);
  };

  const selectScenario = (
    _event: React.MouseEvent<HTMLElement>,
    value: RoundTripScenarioId | null
  ) => {
    if (!value || value === scenario) return;
    scenarioRef.current = value;
    setScenario(value);
    resetScenario(value);
  };

  const complete = (id: OperationId, succeeded: boolean) => {
    if (succeeded) setOperations((current) => ({ ...current, [id]: true }));
  };

  const simpleActions: ToolAction[] = [
    {
      id: 'paragraph-edited',
      icon: 'solar:file-text-bold',
      run: (currentEditor) =>
        currentEditor.chain().focus().insertContent(t('editor.appendedText')).run(),
      canRun: (currentEditor) => currentEditor.isActive('paragraph'),
    },
    {
      id: 'heading-edited',
      icon: 'solar:pen-bold',
      run: (currentEditor) => currentEditor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'list-edited',
      icon: 'solar:list-bold',
      run: (currentEditor) => currentEditor.chain().focus().toggleBulletList().run(),
    },
  ];

  const tableActions: ToolAction[] = [
    {
      id: 'row-added',
      icon: 'solar:add-circle-bold',
      run: (item) => item.chain().focus().addRowAfter().run(),
      canRun: (item) => item.can().addRowAfter(),
    },
    {
      id: 'row-deleted',
      icon: 'solar:trash-bin-trash-bold',
      run: (item) => item.chain().focus().deleteRow().run(),
      canRun: (item) => item.can().deleteRow(),
    },
    {
      id: 'column-added',
      icon: 'solar:add-circle-bold',
      run: (item) => item.chain().focus().addColumnAfter().run(),
      canRun: (item) => item.can().addColumnAfter(),
    },
    {
      id: 'column-deleted',
      icon: 'solar:trash-bin-trash-bold',
      run: (item) => item.chain().focus().deleteColumn().run(),
      canRun: (item) => item.can().deleteColumn(),
    },
    {
      id: 'cell-merged',
      icon: 'solar:box-minimalistic-bold',
      run: (item) => item.chain().focus().mergeCells().run(),
      canRun: (item) => item.can().mergeCells(),
    },
    {
      id: 'cell-split',
      icon: 'solar:list-bold',
      run: (item) => item.chain().focus().splitCell().run(),
      canRun: (item) => item.can().splitCell(),
    },
  ];

  const confirmUnlock = () => {
    if (!editor) return;
    setLegalLocked(editor, false);
    const unlocked = !isLegalLocked(editor);
    setLegalLockedState(!unlocked);
    complete('legal-unlocked', unlocked);
    setUnlockDialogOpen(false);
  };

  const editLegalWord = () => {
    if (!editor || isLegalLocked(editor)) return;
    let from = -1;
    editor.state.doc.descendants((node, position) => {
      if (from >= 0 || !node.isText || !node.text?.includes(LEGAL_WORD)) return;
      from = position + node.text.indexOf(LEGAL_WORD);
    });
    if (from < 0) return;
    const succeeded = editor
      .chain()
      .focus()
      .setTextSelection({ from, to: from + LEGAL_WORD.length })
      .insertContent(LEGAL_REPLACEMENT)
      .run();
    complete('legal-edited', succeeded && legalMarker(editor) === 'true');
  };

  const restoreLegal = () => {
    if (!editor) return;
    replaceLegalSection(editor, LEGAL_CANDIDATE_HTML);
    const restored =
      legalHTML(editor.getHTML()) === legalHTML(LEGAL_CANDIDATE_HTML) &&
      legalMarker(editor) === 'false' &&
      isLegalLocked(editor);
    setLegalLockedState(isLegalLocked(editor));
    complete('legal-restored', restored);
  };

  const runRoundTrip = () => {
    if (!editor) return;
    verifierRef.current?.destroy();
    verifierRef.current = null;
    setRecreatedEditor(null);
    try {
      const sourceHTML = canonicalizeHTML(editor.getHTML());
      const verifier = new Editor({ extensions, content: sourceHTML, editable: false });
      const nextRecreatedHTML = canonicalizeHTML(verifier.getHTML());
      verifierRef.current = verifier;
      setRecreatedEditor(verifier);
      setRecreatedHTML(nextRecreatedHTML);
      setReport(compareRoundTrip(scenario, sourceHTML, nextRecreatedHTML, operations));
    } catch (error) {
      const detail = error instanceof Error ? error.message : t('errors.unknown');
      setReport({
        scenario,
        sourceHTML: canonicalizeHTML(editor.getHTML()),
        recreatedHTML: '',
        operations,
        invariants: [
          {
            id: 'editor_recreation',
            labelKey: 'report.invariants.editor_recreation',
            passed: false,
            detail,
          },
        ],
        passed: false,
      });
    }
  };

  const actions =
    scenario === 'simple' ? simpleActions : scenario === 'table-heavy' ? tableActions : [];

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">{t('title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
            >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={scenario}
                onChange={selectScenario}
                aria-label={t('scenarioSelector')}
                sx={{ overflowX: 'auto' }}
              >
                {(['simple', 'table-heavy', 'legal'] as const).map((item) => (
                  <ToggleButton key={item} value={item}>
                    {t(`scenarios.${item}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:restart-bold" />}
                  onClick={() => resetScenario()}
                >
                  {t('actions.reset')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:play-circle-bold" />}
                  onClick={runRoundTrip}
                >
                  {t('actions.run')}
                </Button>
              </Stack>
            </Stack>

            <Divider />

            <Stack
              direction="row"
              spacing={0.5}
              sx={{ minHeight: 40, overflowX: 'auto', alignItems: 'center' }}
            >
              {actions.map((action) => (
                <Tooltip key={action.id} title={t(`toolbar.${action.id}`)}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={!editor || (action.canRun ? !action.canRun(editor) : false)}
                      color={operations[action.id] ? 'success' : 'default'}
                      onClick={() => editor && complete(action.id, action.run(editor))}
                    >
                      <Iconify icon={action.icon} />
                    </IconButton>
                  </span>
                </Tooltip>
              ))}
              {scenario === 'table-heavy' && (
                <Typography
                  variant="caption"
                  sx={{
                    color: operations['column-resized'] ? 'success.main' : 'text.secondary',
                    whiteSpace: 'nowrap',
                    ml: 1,
                  }}
                >
                  {t('toolbar.column-resized')}
                </Typography>
              )}
              {scenario === 'legal' && (
                <>
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    icon={<Iconify icon="solar:lock-password-outline" />}
                    label={t(legalLocked ? 'legal.locked' : 'legal.unlocked')}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!legalLocked}
                    onClick={() => setUnlockDialogOpen(true)}
                  >
                    {t('legal.actions.unlock')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={legalLocked || operations['legal-edited']}
                    onClick={editLegalWord}
                  >
                    {t('legal.actions.editWord')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!operations['legal-edited']}
                    onClick={restoreLegal}
                  >
                    {t('legal.actions.restore')}
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Paper>

        {scenario === 'legal' && (
          <Alert severity="warning">
            <Typography variant="subtitle2">{t('legal.candidateStatus')}</Typography>
            {t('legal.pendingNotice')}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: 2,
          }}
        >
          <EditorPanel title={t('editor.source')} editor={editor} />
          <EditorPanel
            title={t('editor.recreated')}
            editor={recreatedEditor}
            emptyText={recreatedHTML ? undefined : t('editor.recreatedEmpty')}
          />
        </Box>

        <RoundTripReportView report={report} />
      </Stack>

      <Dialog
        open={unlockDialogOpen}
        onClose={() => setUnlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('legal.dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('legal.dialog.description')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlockDialogOpen(false)}>{t('legal.dialog.cancel')}</Button>
          <Button variant="contained" color="warning" onClick={confirmUnlock}>
            {t('legal.dialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EditorPanel({
  title,
  editor,
  emptyText,
}: {
  title: string;
  editor: TiptapEditor | null;
  emptyText?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderRadius: 1,
        '& .quotation-skill-editor, & .tiptap': {
          minHeight: 520,
          p: 3,
          outline: 'none',
          overflowX: 'auto',
        },
        '& table': { width: '100%', borderCollapse: 'collapse' },
        '& th, & td': {
          minWidth: 90,
          p: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          verticalAlign: 'top',
        },
        '& section': { mb: 3 },
        '& .selectedCell': { bgcolor: 'action.selected' },
        '& .column-resize-handle': { width: 3, bgcolor: 'primary.main' },
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.neutral',
        }}
      >
        {title}
      </Typography>
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <Typography variant="body2" sx={{ p: 3, color: 'text.secondary' }}>
          {emptyText}
        </Typography>
      )}
    </Paper>
  );
}
