import type { SectionType, SectionStatus, ProviderSection, BlueprintSectionStatus } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/shared/ui/iconify';

export interface SectionMeta {
  type: SectionType;
  label: string;
  description: string;
  isProvider: boolean;
}

export const CANONICAL_SECTIONS: SectionMeta[] = [
  {
    type: 'context',
    label: 'Konteks & Lingkup',
    description: 'Ekstraksi kebutuhan, aktor, tujuan bisnis, dan batasan operasional',
    isProvider: false,
  },
  {
    type: 'journey',
    label: 'User Journey',
    description: 'Pemetaan skenario alur pengguna, touchpoint, dan interaksi sistem',
    isProvider: true,
  },
  {
    type: 'architecture',
    label: 'Arsitektur Sistem',
    description: 'Struktur komponen, modul, layer, basis data, dan integrasi teknis',
    isProvider: true,
  },
  {
    type: 'state_machine',
    label: 'State Machine',
    description: 'Definisi state entitas, event transisi, guard, dan siklus hidup',
    isProvider: true,
  },
  {
    type: 'workflow',
    label: 'Workflow Bisnis',
    description: 'Alur proses bisnis, percabangan keputusan, dan aturan operasional',
    isProvider: true,
  },
  {
    type: 'wbs',
    label: 'Work Breakdown Structure (WBS)',
    description: 'Dekomposisi deliverable, estimasi modul, dan milestone pengerjaan',
    isProvider: true,
  },
  {
    type: 'cross_validation',
    label: 'Validasi Silang',
    description: 'Pemeriksaan konsistensi, kelengkapan, dan integritas antar-section',
    isProvider: false,
  },
];

export interface SectionStatusListProps {
  sections?: BlueprintSectionStatus[];
  onRetry?: (section: ProviderSection) => void;
  onOpenManual?: (section: ProviderSection) => void;
  onOpenEditor?: (section: ProviderSection) => void;
  isRetrying?: boolean;
  disabled?: boolean;
}

export function SectionStatusList({
  sections = [],
  onRetry,
  onOpenManual,
  onOpenEditor,
  isRetrying = false,
  disabled = false,
}: SectionStatusListProps) {
  // Map sections by type for O(1) lookup
  const sectionMap = new Map<SectionType, BlueprintSectionStatus>();
  sections.forEach((sec) => {
    sectionMap.set(sec.type, sec);
  });

  const completedCount = CANONICAL_SECTIONS.filter((meta) => {
    const sec = sectionMap.get(meta.type);
    return sec?.status === 'completed' || sec?.status === 'validated';
  }).length;

  const totalCount = CANONICAL_SECTIONS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime())
        ? null
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return null;
    }
  };

  const getStatusDisplay = (meta: SectionMeta, index: number, section?: BlueprintSectionStatus) => {
    const status: SectionStatus = section?.status ?? 'pending';

    switch (status) {
      case 'validated':
      case 'completed':
        return {
          chip: (
            <Chip
              size="small"
              icon={<Iconify icon="solar:check-circle-bold" width={16} />}
              label="Selesai"
              color="success"
              variant="soft"
            />
          ),
          hint: 'Tahap berhasil diselesaikan',
        };

      case 'manual_edit':
        return {
          chip: (
            <Chip
              size="small"
              icon={<Iconify icon="solar:pen-new-square-bold" width={16} />}
              label="Draft Manual"
              color="warning"
              variant="soft"
            />
          ),
          hint: 'Tersimpan sebagai draft manual BA',
        };

      case 'in_progress':
        return {
          chip: (
            <Chip
              size="small"
              icon={<CircularProgress size={12} color="inherit" />}
              label="Sedang Diproses"
              color="info"
              variant="soft"
            />
          ),
          hint: 'Sedang digenerasi oleh AI...',
        };

      case 'failed':
        return {
          chip: (
            <Chip
              size="small"
              icon={<Iconify icon="solar:danger-circle-bold" width={16} />}
              label="Gagal"
              color="error"
              variant="soft"
            />
          ),
          hint: section?.error_code
            ? `Error: ${section.error_code}`
            : 'Terjadi kegagalan pada tahap ini',
        };

      case 'skipped':
        return {
          chip: (
            <Chip
              size="small"
              icon={<Iconify icon="solar:minus-circle-bold" width={16} />}
              label="Dilewati"
              color="default"
              variant="soft"
            />
          ),
          hint: 'Tahap dilewati',
        };

      case 'pending':
      default: {
        // Check if all previous stages are completed
        const isPreviousCompleted = CANONICAL_SECTIONS.slice(0, index).every((prevMeta) => {
          const prevSec = sectionMap.get(prevMeta.type);
          return prevSec?.status === 'completed' || prevSec?.status === 'validated';
        });

        if (!isPreviousCompleted && index > 0) {
          return {
            chip: (
              <Chip
                size="small"
                icon={<Iconify icon="solar:clock-circle-outline" width={16} />}
                label="Menunggu"
                color="default"
                variant="outlined"
              />
            ),
            hint: 'Menunggu tahap sebelumnya',
          };
        }

        return {
          chip: (
            <Chip
              size="small"
              icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
              label="Siap Diproses"
              color="default"
              variant="soft"
            />
          ),
          hint: 'Siap untuk diproses',
        };
      }
    }
  };

  return (
    <Card aria-live="polite" aria-atomic="false">
      <CardHeader
        title="Status Tahapan Pipeline Blueprint"
        subheader={`${completedCount} dari ${totalCount} tahap selesai (${progressPercent}%)`}
        action={
          <Box sx={{ width: 140, pt: 1, pr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              color={completedCount === totalCount ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 1 }}
              aria-label={`Kemajuan generasi blueprint: ${progressPercent}%`}
            />
          </Box>
        }
      />

      <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48, textAlign: 'center' }}>#</TableCell>
              <TableCell>Tahapan</TableCell>
              <TableCell sx={{ width: 150 }}>Status</TableCell>
              <TableCell sx={{ width: 140 }}>Percobaan & Waktu</TableCell>
              <TableCell sx={{ width: 220, textAlign: 'right' }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CANONICAL_SECTIONS.map((meta, index) => {
              const sec = sectionMap.get(meta.type);
              const status: SectionStatus = sec?.status ?? 'pending';
              const { chip, hint } = getStatusDisplay(meta, index, sec);
              const attempts = sec?.attempts ?? 0;
              const isFailed = status === 'failed';
              const canRetry = meta.isProvider && isFailed && attempts < 3;
              const canManual = meta.isProvider && isFailed;

              const startedTime = formatTimestamp(sec?.started_at);
              const completedTime = formatTimestamp(sec?.completed_at);
              const updatedTime = formatTimestamp(sec?.updated_at);

              return (
                <TableRow key={meta.type} hover>
                  {/* Step Number */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {index + 1}
                    </Typography>
                  </TableCell>

                  {/* Section Label & Description */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">{meta.label}</Typography>
                        {sec?.error_code && (
                          <Tooltip title={`Error Code: ${sec.error_code}`}>
                            <Chip
                              size="small"
                              label={sec.error_code}
                              color="error"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {hint || meta.description}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Status Chip */}
                  <TableCell>{chip}</TableCell>

                  {/* Attempts & Timestamps */}
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="caption" color="text.primary" fontWeight={500}>
                        Percobaan: {attempts}/3
                      </Typography>
                      {completedTime ? (
                        <Typography variant="caption" color="text.secondary">
                          Selesai: {completedTime}
                        </Typography>
                      ) : startedTime ? (
                        <Typography variant="caption" color="text.secondary">
                          Mulai: {startedTime}
                        </Typography>
                      ) : updatedTime ? (
                        <Typography variant="caption" color="text.secondary">
                          Update: {updatedTime}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>

                  {/* Actions */}
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      {canRetry && onRetry && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          disabled={disabled || isRetrying}
                          startIcon={<Iconify icon="solar:restart-bold" width={14} />}
                          onClick={() => onRetry(meta.type as ProviderSection)}
                          aria-label={`Coba Lagi tahap ${meta.label}`}
                          sx={{ minHeight: 40 }}
                        >
                          Coba Lagi
                        </Button>
                      )}

                      {meta.isProvider && onOpenEditor && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          disabled={disabled}
                          startIcon={<Iconify icon="solar:pen-new-square-bold" width={14} />}
                          onClick={() => onOpenEditor(meta.type as ProviderSection)}
                          aria-label={`Edit Visual tahap ${meta.label}`}
                          sx={{ minHeight: 40 }}
                        >
                          Edit Visual
                        </Button>
                      )}

                      {canManual && onOpenManual && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          disabled={disabled}
                          startIcon={<Iconify icon="solar:pen-new-square-bold" width={14} />}
                          onClick={() => onOpenManual(meta.type as ProviderSection)}
                          aria-label={`Lengkapi Manual tahap ${meta.label}`}
                          sx={{ minHeight: 40 }}
                        >
                          Lengkapi Manual
                        </Button>
                      )}

                      {meta.isProvider &&
                        (status === 'completed' ||
                          status === 'validated' ||
                          status === 'manual_edit') &&
                        onOpenManual &&
                        !onOpenEditor && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            disabled={disabled}
                            onClick={() => onOpenManual(meta.type as ProviderSection)}
                            aria-label={`Koreksi tahap ${meta.label}`}
                            sx={{ minHeight: 40 }}
                          >
                            Koreksi
                          </Button>
                        )}

                      {!canRetry &&
                        !canManual &&
                        !(
                          meta.isProvider &&
                          (status === 'completed' ||
                            status === 'validated' ||
                            status === 'manual_edit') &&
                          onOpenManual
                        ) && (
                          <Typography variant="caption" color="text.disabled">
                            {status === 'completed' || status === 'validated'
                              ? 'Tervalidasi'
                              : status === 'manual_edit'
                                ? 'Draft'
                                : '-'}
                          </Typography>
                        )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
