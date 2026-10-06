import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { fDateTime } from 'src/shared/utils/format-time';

import { getQuotationHistory, type QuotationRevisionHistoryItem } from '../api/lifecycle';

export type HistoryPanelProps = {
  open: boolean;
  onClose: () => void;
  quotationId?: string;
  activePublishedRevisionId?: string | null;
  currentRevisionId?: string | null;
  history?: QuotationRevisionHistoryItem[];
  onSelectRevision?: (revision: QuotationRevisionHistoryItem) => void;
};

export function HistoryPanel({
  open,
  onClose,
  quotationId,
  activePublishedRevisionId,
  currentRevisionId,
  history: propHistory,
  onSelectRevision,
}: HistoryPanelProps) {
  const { t } = useTranslate('quotation');

  const {
    data: fetchedHistory,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quotation', 'history', quotationId],
    queryFn: () => getQuotationHistory(quotationId!),
    enabled: Boolean(quotationId) && open && !propHistory,
    staleTime: 10 * 1000,
  });

  // Sort descending by revision_number
  const items = useMemo(
    () =>
      [...(propHistory ?? fetchedHistory ?? [])].sort(
        (a, b) => b.revision_number - a.revision_number
      ),
    [propHistory, fetchedHistory]
  );

  const renderStatusBadge = (status: QuotationRevisionHistoryItem['publication_status']) => {
    switch (status) {
      case 'published':
        return (
          <Chip
            size="small"
            color="success"
            variant="filled"
            label={t('status_published', 'Diterbitkan')}
          />
        );
      case 'superseded':
        return (
          <Chip
            size="small"
            color="default"
            variant="outlined"
            label={t('status_superseded', 'Usang')}
          />
        );
      case 'draft':
      default:
        return (
          <Chip size="small" color="warning" variant="soft" label={t('status_draft', 'Draf')} />
        );
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Drawer Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:history-bold" width={24} />
          <Typography variant="h6">{t('history_title', 'Riwayat Revisi')}</Typography>
          {items.length > 0 && (
            <Chip size="small" variant="soft" color="default" label={items.length} />
          )}
        </Stack>
        <IconButton aria-label="close history panel" onClick={onClose} size="small">
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </Stack>

      <Divider />

      {/* Drawer Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Stack spacing={2} sx={{ py: 4 }}>
            <Alert severity="error">
              {error instanceof Error ? error.message : 'Gagal memuat riwayat revisi'}
            </Alert>
            <Button variant="outlined" color="inherit" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </Stack>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Iconify icon="solar:history-bold" width={48} sx={{ mb: 1, opacity: 0.4 }} />
            <Typography variant="body2">
              {t('history_empty', 'Belum ada riwayat revisi')}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => {
              const isCurrent = Boolean(currentRevisionId && item.id === currentRevisionId);
              const isActivePublished = Boolean(
                (activePublishedRevisionId && item.id === activePublishedRevisionId) ||
                (!activePublishedRevisionId && item.publication_status === 'published')
              );

              return (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: isCurrent ? 'primary.main' : 'divider',
                    bgcolor: isCurrent ? 'action.hover' : 'background.paper',
                    cursor: onSelectRevision ? 'pointer' : 'default',
                    transition: 'border-color 0.2s',
                    '&:hover': onSelectRevision ? { borderColor: 'primary.main' } : undefined,
                  }}
                  onClick={() => onSelectRevision?.(item)}
                >
                  <Stack spacing={1.5}>
                    {/* Top Row: Revision Number & Status Badge */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Revisi #{item.revision_number}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            size="small"
                            variant="soft"
                            color="primary"
                            label={t('current_revision', 'Saat Ini')}
                          />
                        )}
                      </Stack>
                      {renderStatusBadge(item.publication_status)}
                    </Stack>

                    {/* Active Published & Signed Badges */}
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      {isActivePublished && (
                        <Chip
                          size="small"
                          color="primary"
                          variant="filled"
                          icon={<Iconify icon="solar:check-circle-bold" />}
                          label={t('active_published', 'Publikasi Aktif')}
                        />
                      )}
                      {item.is_signed && (
                        <Chip
                          size="small"
                          color="success"
                          variant="soft"
                          icon={<Iconify icon="solar:pen-bold" />}
                          label={t('signed_badge', 'Ditandatangani')}
                        />
                      )}
                    </Stack>

                    {/* Modification Chips */}
                    {(item.legal_content_modified || item.commercial_content_modified) && (
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        {item.legal_content_modified && (
                          <Chip
                            size="small"
                            color="warning"
                            variant="soft"
                            icon={<Iconify icon="eva:alert-circle-fill" />}
                            label={t('editor.legalModifiedBadge', 'Legal Modified')}
                          />
                        )}
                        {item.commercial_content_modified && (
                          <Chip
                            size="small"
                            color="info"
                            variant="soft"
                            label={t('editor.commercialModifiedBadge', 'Commercial Modified')}
                          />
                        )}
                      </Stack>
                    )}

                    {/* Version Chips */}
                    {(item.rate_card_version ||
                      item.legal_template_version ||
                      item.prompt_version ||
                      item.safety_envelope_version) && (
                      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                        {item.rate_card_version && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Rate Card: v${item.rate_card_version}`}
                          />
                        )}
                        {item.legal_template_version && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Template: v${item.legal_template_version}`}
                          />
                        )}
                        {item.prompt_version && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Prompt: v${item.prompt_version}`}
                          />
                        )}
                        {item.safety_envelope_version && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Safety: v${item.safety_envelope_version}`}
                          />
                        )}
                      </Stack>
                    )}

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    {/* Timestamps */}
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Dibuat: {fDateTime(item.created_at)}
                      </Typography>
                      {item.published_at && (
                        <Typography variant="caption" color="text.secondary">
                          Dipublikasikan: {fDateTime(item.published_at)}
                        </Typography>
                      )}
                      {item.signed_at && (
                        <Typography variant="caption" color="text.secondary">
                          Ditandatangani: {fDateTime(item.signed_at)}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
