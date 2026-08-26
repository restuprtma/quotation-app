import type { ActiveTabId, OpenQuestion, CrossReference, BlueprintBundle } from '../types';

import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { OpenQuestionDialog } from './open-question-dialog';
import { CrossReferenceDialog } from './cross-reference-dialog';
import { validateBlueprintBundle } from '../utils/live-cross-validator';

// ----------------------------------------------------------------------

type Props = {
  bundle: BlueprintBundle;
  onUpdateBundle: (updatedBundle: BlueprintBundle) => void;
  onNavigateTab?: (tabIndex: ActiveTabId) => void;
};

export function BundleReport({ bundle, onUpdateBundle, onNavigateTab }: Props) {
  const theme = useTheme();

  // Dialog states for Open Questions
  const [oqDialogOpen, setOqDialogOpen] = useState(false);
  const [selectedOq, setSelectedOq] = useState<OpenQuestion | null>(null);
  const [oqFilterStatus, setOqFilterStatus] = useState<string>('all');

  // Dialog states for Cross References
  const [xrefDialogOpen, setXrefDialogOpen] = useState(false);
  const [selectedXref, setSelectedXref] = useState<CrossReference | null>(null);

  // Dialog state for Assumptions
  const [assumptionDialogOpen, setAssumptionDialogOpen] = useState(false);
  const [assumptionInput, setAssumptionInput] = useState('');
  const [editingAssumptionIdx, setEditingAssumptionIdx] = useState<number | null>(null);

  // Issues Filter
  const [issueFilterSeverity, setIssueFilterSeverity] = useState<'all' | 'blocking' | 'warning'>(
    'all'
  );

  // Run validation
  const validationReport = useMemo(() => validateBlueprintBundle(bundle), [bundle]);

  // Open Questions handlers
  const handleOpenAddOq = () => {
    setSelectedOq(null);
    setOqDialogOpen(true);
  };

  const handleOpenEditOq = (oq: OpenQuestion) => {
    setSelectedOq(oq);
    setOqDialogOpen(true);
  };

  const handleSaveOq = (oq: OpenQuestion) => {
    const exists = bundle.open_questions.some((item) => item.id === oq.id);
    const updated = exists
      ? bundle.open_questions.map((item) => (item.id === oq.id ? oq : item))
      : [...bundle.open_questions, oq];
    onUpdateBundle({ ...bundle, open_questions: updated });
  };

  const handleDeleteOq = (oqId: string) => {
    const updated = bundle.open_questions.filter((item) => item.id !== oqId);
    onUpdateBundle({ ...bundle, open_questions: updated });
  };

  // Cross Reference handlers
  const handleOpenAddXref = () => {
    setSelectedXref(null);
    setXrefDialogOpen(true);
  };

  const handleOpenEditXref = (xref: CrossReference) => {
    setSelectedXref(xref);
    setXrefDialogOpen(true);
  };

  const handleSaveXref = (xref: CrossReference) => {
    const exists = bundle.cross_references.some((item) => item.id === xref.id);
    const updated = exists
      ? bundle.cross_references.map((item) => (item.id === xref.id ? xref : item))
      : [...bundle.cross_references, xref];
    onUpdateBundle({ ...bundle, cross_references: updated });
  };

  const handleDeleteXref = (xrefId: string) => {
    const updated = bundle.cross_references.filter((item) => item.id !== xrefId);
    onUpdateBundle({ ...bundle, cross_references: updated });
  };

  // Assumptions handlers
  const handleOpenAddAssumption = () => {
    setEditingAssumptionIdx(null);
    setAssumptionInput('');
    setAssumptionDialogOpen(true);
  };

  const handleOpenEditAssumption = (idx: number, text: string) => {
    setEditingAssumptionIdx(idx);
    setAssumptionInput(text);
    setAssumptionDialogOpen(true);
  };

  const handleSaveAssumption = () => {
    if (!assumptionInput.trim()) return;
    const updated = [...bundle.assumptions];
    if (editingAssumptionIdx !== null) {
      updated[editingAssumptionIdx] = assumptionInput.trim();
    } else {
      updated.push(assumptionInput.trim());
    }
    onUpdateBundle({ ...bundle, assumptions: updated });
    setAssumptionDialogOpen(false);
  };

  const handleDeleteAssumption = (idx: number) => {
    const updated = bundle.assumptions.filter((_, i) => i !== idx);
    onUpdateBundle({ ...bundle, assumptions: updated });
  };

  // Filtered issues
  const filteredIssues = useMemo(() => {
    if (issueFilterSeverity === 'all') return validationReport.issues;
    return validationReport.issues.filter((i) => i.severity === issueFilterSeverity);
  }, [validationReport.issues, issueFilterSeverity]);

  // Filtered Open Questions
  const filteredQuestions = useMemo(() => {
    if (oqFilterStatus === 'all') return bundle.open_questions;
    return bundle.open_questions.filter((q) => q.status === oqFilterStatus);
  }, [bundle.open_questions, oqFilterStatus]);

  // Relation chip color helper
  const getRelationColor = (rel: string) => {
    switch (rel) {
      case 'implements':
        return 'primary';
      case 'transitions_on':
        return 'info';
      case 'interacts_with':
        return 'success';
      case 'deploys_to':
        return 'warning';
      case 'depends_on':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* 1. Publication Readiness Banner */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          background:
            validationReport.readiness.status === 'blocked'
              ? `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0.9)} 0%, ${theme.palette.error.main} 100%)`
              : validationReport.readiness.status === 'full_ready'
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.dark, 0.9)} 0%, ${theme.palette.success.main} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.info.dark, 0.9)} 0%, ${theme.palette.info.main} 100%)`,
          color: '#fff',
          boxShadow: theme.customShadows?.z12 || 4,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Icon
                icon={
                  validationReport.readiness.status === 'blocked'
                    ? 'solar:shield-warning-bold'
                    : validationReport.readiness.status === 'full_ready'
                      ? 'solar:shield-check-bold'
                      : 'solar:info-circle-bold'
                }
                width={32}
              />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {validationReport.readiness.label}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 720 }}>
              {validationReport.readiness.description}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={`${validationReport.blockingCount} Blocking Errors`}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontWeight: 700,
              }}
            />
            <Chip
              label={`${validationReport.warningCount} Warnings`}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontWeight: 700,
              }}
            />
          </Stack>
        </Stack>
      </Card>

      {/* 2. Matrix Status 5-Seksi Table */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Matriks Status & Kesiapan 5 Seksi Blueprint"
          subheader="Ringkasan jumlah entitas dan hasil validasi per seksi"
          sx={{ pb: 1 }}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nama Seksi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status Kelengkapan</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Jumlah Entitas
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Validasi Struktural</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {validationReport.sectionStatuses.map((sec) => (
                <TableRow key={sec.key} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {sec.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        sec.lifecycleStatus === 'completed'
                          ? 'Completed (Lengkap)'
                          : sec.lifecycleStatus === 'partial'
                            ? 'Partial (Ada Isu)'
                            : 'Belum Tersedia'
                      }
                      size="small"
                      color={
                        sec.lifecycleStatus === 'completed'
                          ? 'success'
                          : sec.lifecycleStatus === 'partial'
                            ? 'warning'
                            : 'default'
                      }
                      variant="soft"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {sec.entityCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {sec.blockingCount === 0 && sec.warningCount === 0 ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Icon
                          icon="solar:check-circle-bold"
                          color={theme.palette.success.main}
                          width={18}
                        />
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                          Valid (0 Isu)
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        {sec.blockingCount > 0 && (
                          <Chip
                            label={`${sec.blockingCount} Error`}
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                        {sec.warningCount > 0 && (
                          <Chip
                            label={`${sec.warningCount} Warning`}
                            size="small"
                            color="warning"
                            variant="filled"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {onNavigateTab && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onNavigateTab(sec.tabIndex as ActiveTabId)}
                        startIcon={<Icon icon="solar:arrow-right-up-linear" />}
                        sx={{ fontSize: '0.75rem', py: 0.2 }}
                      >
                        Buka Tab
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 3. Live Cross-Validation Issues Panel */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Temuan Validasi Struktural & Semantik ({validationReport.issues.length})</span>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={issueFilterSeverity === 'all' ? 'contained' : 'outlined'}
                onClick={() => setIssueFilterSeverity('all')}
              >
                Semua ({validationReport.issues.length})
              </Button>
              <Button
                size="small"
                color="error"
                variant={issueFilterSeverity === 'blocking' ? 'contained' : 'outlined'}
                onClick={() => setIssueFilterSeverity('blocking')}
              >
                Blocking ({validationReport.blockingCount})
              </Button>
              <Button
                size="small"
                color="warning"
                variant={issueFilterSeverity === 'warning' ? 'contained' : 'outlined'}
                onClick={() => setIssueFilterSeverity('warning')}
              >
                Warning ({validationReport.warningCount})
              </Button>
            </Stack>
          }
          sx={{ pb: 1 }}
        />
        <CardContent>
          {filteredIssues.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Icon icon="solar:check-circle-bold" width={48} color={theme.palette.success.main} />
              <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                Semua Validasi Lolos!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tidak ditemukan blocking error maupun semantic warning pada bundle ini.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {filteredIssues.map((issue) => (
                <Box
                  key={issue.id}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor:
                      issue.severity === 'blocking'
                        ? alpha(theme.palette.error.main, 0.4)
                        : alpha(theme.palette.warning.main, 0.4),
                    backgroundColor:
                      issue.severity === 'blocking'
                        ? alpha(theme.palette.error.main, 0.04)
                        : alpha(theme.palette.warning.main, 0.04),
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Icon
                      icon={
                        issue.severity === 'blocking'
                          ? 'solar:danger-triangle-bold'
                          : 'solar:shield-warning-bold'
                      }
                      width={22}
                      color={
                        issue.severity === 'blocking'
                          ? theme.palette.error.main
                          : theme.palette.warning.main
                      }
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Chip
                          label={issue.code}
                          size="small"
                          color={issue.severity === 'blocking' ? 'error' : 'warning'}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                        />
                        <Chip
                          label={issue.section.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {issue.title}
                        </Typography>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {issue.message}
                      </Typography>

                      {issue.affectedEntityIds && issue.affectedEntityIds.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          flexWrap="wrap"
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                            Entitas Terkait:
                          </Typography>
                          {issue.affectedEntityIds.map((id) => (
                            <Chip
                              key={id}
                              label={id}
                              size="small"
                              variant="soft"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          ))}
                        </Stack>
                      )}

                      {issue.suggestion && (
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Icon
                            icon="solar:lightbulb-bolt-bold"
                            width={16}
                            color={theme.palette.info.main}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: 'info.main', fontWeight: 600 }}
                          >
                            Saran: {issue.suggestion}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* 4. Assumptions & Open Questions Tracker */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ mb: 3 }}>
        {/* Left: Assumptions */}
        <Card sx={{ flex: 1 }}>
          <CardHeader
            title={`Asumsi Teknis Desain (${bundle.assumptions.length})`}
            subheader="Premis dan batasan infrastruktur yang diasumsikan berlaku"
            action={
              <Button
                size="small"
                variant="outlined"
                startIcon={<Icon icon="solar:add-circle-bold" />}
                onClick={handleOpenAddAssumption}
              >
                Tambah
              </Button>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            {bundle.assumptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Belum ada asumsi teknis yang tercatat.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {bundle.assumptions.map((asm, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      backgroundColor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ flex: 1, mr: 1 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: 'primary.main', mt: 0.3 }}
                      >
                        #{idx + 1}
                      </Typography>
                      <Typography variant="body2">{asm}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => handleOpenEditAssumption(idx, asm)}
                      >
                        <Icon icon="solar:pen-bold" width={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAssumption(idx)}
                      >
                        <Icon icon="solar:trash-bin-minimalistic-bold" width={14} />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Right: Open Questions */}
        <Card sx={{ flex: 1.2 }}>
          <CardHeader
            title={`Open Questions & Decision Tracker (${bundle.open_questions.length})`}
            subheader="Pertanyaan arsitektural yang membutuhkan konfirmasi stakeholder"
            action={
              <Button
                size="small"
                variant="contained"
                startIcon={<Icon icon="solar:add-circle-bold" />}
                onClick={handleOpenAddOq}
              >
                Tambah
              </Button>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            {/* Status filters */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {['all', 'open', 'answered', 'deferred'].map((st) => (
                <Button
                  key={st}
                  size="small"
                  variant={oqFilterStatus === st ? 'contained' : 'outlined'}
                  color={st === 'open' ? 'warning' : st === 'answered' ? 'success' : 'inherit'}
                  onClick={() => setOqFilterStatus(st)}
                  sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                >
                  {st}
                </Button>
              ))}
            </Stack>

            {filteredQuestions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Tidak ada pertanyaan dengan filter ini.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {filteredQuestions.map((oq) => (
                  <Box
                    key={oq.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 0.8 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={oq.status.toUpperCase()}
                          size="small"
                          color={
                            oq.status === 'open'
                              ? 'warning'
                              : oq.status === 'answered'
                                ? 'success'
                                : 'default'
                          }
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                        <Chip
                          label={oq.target_section}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {oq.id}
                        </Typography>
                      </Stack>

                      <IconButton size="small" color="inherit" onClick={() => handleOpenEditOq(oq)}>
                        <Icon icon="solar:pen-bold" width={14} />
                      </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {oq.question}
                    </Typography>

                    {oq.impact && (
                      <Typography variant="caption" color="text.secondary">
                        <strong>Dampak:</strong> {oq.impact}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* 5. Cross-References Traceability Matrix */}
      <Card>
        <CardHeader
          title={`Cross-References & Traceability Matrix (${bundle.cross_references.length})`}
          subheader="Matriks pemetaan relasi antar seksi (Journey -> Architecture -> State Machine -> WBS)"
          action={
            <Button
              size="small"
              variant="contained"
              startIcon={<Icon icon="solar:link-circle-bold" />}
              onClick={handleOpenAddXref}
            >
              Tambah X-Ref
            </Button>
          }
          sx={{ pb: 1 }}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Source Ref (Asal)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Relasi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Target Ref (Tujuan)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Deskripsi</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bundle.cross_references.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Belum ada cross-reference yang terdefinisi.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bundle.cross_references.map((xref) => (
                  <TableRow key={xref.id} hover>
                    <TableCell>
                      <Chip
                        label={xref.source_ref}
                        size="small"
                        variant="soft"
                        color="primary"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={xref.relation_type}
                        size="small"
                        color={getRelationColor(xref.relation_type) as any}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={xref.target_ref}
                        size="small"
                        variant="soft"
                        color="info"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        {xref.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={() => handleOpenEditXref(xref)}
                        >
                          <Icon icon="solar:pen-bold" width={14} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteXref(xref.id)}
                        >
                          <Icon icon="solar:trash-bin-minimalistic-bold" width={14} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Modals */}
      <OpenQuestionDialog
        open={oqDialogOpen}
        questionData={selectedOq}
        onClose={() => setOqDialogOpen(false)}
        onSave={handleSaveOq}
        onDelete={handleDeleteOq}
      />

      <CrossReferenceDialog
        open={xrefDialogOpen}
        xrefData={selectedXref}
        onClose={() => setXrefDialogOpen(false)}
        onSave={handleSaveXref}
        onDelete={handleDeleteXref}
      />

      {/* Assumption Dialog Modal */}
      <Dialog
        open={assumptionDialogOpen}
        onClose={() => setAssumptionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAssumptionIdx !== null ? 'Edit Asumsi Teknis' : 'Tambah Asumsi Teknis'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Asumsi Teknis"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={assumptionInput}
            onChange={(e) => setAssumptionInput(e.target.value)}
            placeholder="Ketik asumsi teknis perancangan..."
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setAssumptionDialogOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" onClick={handleSaveAssumption}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
