import type { MeetingExtractionStatus } from '../types/meeting-extraction';

import { useMemo, useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

const FIELD_LABELS: Record<string, string> = {
  client_name: 'Nama klien',
  project_name: 'Nama proyek',
  scope: 'Ruang lingkup',
  duration: 'Durasi',
  team: 'Komposisi tim',
  team_size: 'Jumlah tim',
  payment: 'Jadwal pembayaran',
};

const STATUS_COPY: Record<string, string> = {
  queued: 'Menunggu pemrosesan quotation.',
  processing: 'Quotation sedang diproses.',
  waiting_rate_limit: 'Pemrosesan dijeda sementara.',
  failed: 'Pemrosesan quotation belum berhasil.',
  needs_input: 'Data tambahan diperlukan.',
  needs_review: 'Quotation perlu ditinjau.',
  completed: 'Quotation siap dibuka.',
};

const ERROR_COPY: Record<string, string> = {
  MEETING_NOTES_CHANGED: 'Catatan meeting berubah. Buat proses baru untuk melanjutkan.',
  AI_BUDGET_EXHAUSTED: 'Layanan AI sedang tidak tersedia. Coba lagi beberapa saat lagi.',
  EXTRACTION_RETRY_CONFLICT: 'Proses tidak dapat diulang saat ini. Coba lagi beberapa saat lagi.',
  NOT_FOUND: 'Proses quotation tidak ditemukan.',
  INVALID_REQUEST: 'Permintaan quotation tidak dapat diproses.',
  INTERNAL_ERROR: 'Quotation belum dapat diproses. Coba lagi.',
};

const noticeLabel = (field: string) => FIELD_LABELS[field] ?? 'Informasi quotation';

type MeetingExtractionProgressCardProps = {
  status: MeetingExtractionStatus;
  onRetry?: () => void;
  onStartNew?: () => void;
  onOpenEditor?: () => void;
  isRetrying?: boolean;
};

function retryDueAt(retryAfter: number | null | undefined): number | null {
  return typeof retryAfter === 'number' && retryAfter > 0 ? Date.now() + retryAfter * 1_000 : null;
}

export function MeetingExtractionProgressCard({
  status,
  onRetry,
  onStartNew,
  onOpenEditor,
  isRetrying = false,
}: MeetingExtractionProgressCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const retryAt = useMemo(
    () => retryDueAt(status.error?.retry_after),
    [status.error?.retry_after]
  );
  const retryBlocked = status.status === 'waiting_rate_limit' && retryAt !== null && now < retryAt;

  useEffect(() => {
    if (!retryBlocked || retryAt === null) return undefined;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [retryAt, retryBlocked]);

  const progress = status.progress.total > 0 ? (status.progress.completed / status.progress.total) * 100 : 0;
  const errorCopy = status.error ? (ERROR_COPY[status.error.code] ?? ERROR_COPY.INTERNAL_ERROR) : null;
  const canRetry = status.status === 'failed' && status.error?.retryable === true;
  const showRetry = (canRetry || status.status === 'waiting_rate_limit') && Boolean(onRetry);
  const needsAttention = status.status === 'needs_input' || status.status === 'needs_review';

  return (
    <Card variant="outlined" sx={{ maxWidth: 640, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Stack spacing={2} aria-live="polite">
        <Stack spacing={0.5}>
          <Typography variant="h5">Progres quotation</Typography>
          <Typography color="text.secondary">{STATUS_COPY[status.status] ?? 'Quotation sedang diproses.'}</Typography>
        </Stack>

        <Stack spacing={0.75}>
          <Typography variant="body2" color="text.secondary">
            {status.current_phase ? `Tahap: ${status.current_phase}` : 'Menyiapkan quotation'}
          </Typography>
          <Typography variant="body2">
            {status.progress.completed} dari {status.progress.total} tahap selesai
          </Typography>
          <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, progress))} />
        </Stack>

        {errorCopy && <Alert severity="error">{errorCopy}</Alert>}

        {status.status === 'waiting_rate_limit' && retryAt !== null && (
          <Alert severity="info">
            Coba lagi setelah {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(retryAt)}.
          </Alert>
        )}

        {needsAttention && (
          <Alert severity="warning">
            {status.needs_input.concat(status.warnings).map((notice) => noticeLabel(notice.field)).join(', ') ||
              'Informasi quotation'}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
          {showRetry && (
            <Button variant="contained" onClick={onRetry} disabled={retryBlocked || isRetrying}>
              Coba lagi
            </Button>
          )}
          {needsAttention && onStartNew && (
            <Button variant="contained" onClick={onStartNew}>
              Kembali lengkapi data
            </Button>
          )}
          {status.status === 'completed' && onOpenEditor && (
            <Button variant="contained" color="success" onClick={onOpenEditor}>
              Buka quotation
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
