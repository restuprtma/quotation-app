import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';

import { useQuotation } from '../hooks/use-quotation';
import { BlueprintRenderer } from './blueprint-renderer';
import { formatDate, formatCurrency } from '../utils/format';
import { QuotationStatusLabel } from './quotation-status-label';

type Props = {
  open: boolean;
  id: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onCreateContract?: (id: string) => void;
};

export function QuotationDetailDialog({ open, id, onClose, onEdit, onCreateContract }: Props) {
  const { t } = useTranslate('quotation');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const { data, loading, error } = useQuotation(open ? id : null);
  const [activeError, setActiveError] = useState<string | null>(null);

  useEffect(() => setActiveError(error), [error]);

  const revision = data?.revision;
  const valueOrEmpty = (value?: string | null) => value || t('detail.empty');

  return (
    <>
      <MotionDialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{data?.quotation_number ?? t('detail.title')}</Box>
          {data && <QuotationStatusLabel status={data.status} />}
          <IconButton size="small" onClick={onClose}>
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loading && (
            <Stack spacing={2}>
              <Skeleton height={50} />
              <Skeleton height={100} />
              <Skeleton height={150} />
            </Stack>
          )}
          {!loading && data && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Info label={t('detail.client')} value={data.client_name ?? data.client_id} />
                <Info
                  label={t('detail.projectType')}
                  value={t(`projectTypes.${data.project_type}`)}
                />
                <Info
                  label={t('detail.budget')}
                  value={revision ? formatCurrency(revision.budget) : t('detail.empty')}
                />
                <Info
                  label={t('detail.revision')}
                  value={t('table.revisionValue', { number: data.current_revision })}
                />
                <Info label={t('detail.createdAt')} value={formatDate(data.created_at)} />
              </Grid>
              <Content
                title={t('detail.description')}
                value={valueOrEmpty(revision?.project_description)}
              />
              <Content title={t('detail.scope')} value={valueOrEmpty(revision?.scope_of_work)} />
              <Grid container spacing={2}>
                <Info
                  label={t('detail.maintenance')}
                  value={valueOrEmpty(revision?.maintenance_info)}
                />
                <Info label={t('detail.hosting')} value={valueOrEmpty(revision?.hosting_info)} />
              </Grid>
              <Content title={t('detail.notes')} value={valueOrEmpty(revision?.notes)} />
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  {t('blueprint.title')}
                </Typography>
                <BlueprintRenderer blueprint={revision?.blueprint_data} />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {data?.status === 'signed' && onCreateContract && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => onCreateContract(data.id)}
            >
              {t('buttons.createContract')}
            </Button>
          )}
          {data && (
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => onEdit(data.id)}
            >
              {t('buttons.edit')}
            </Button>
          )}
          <Button variant="contained" color="inherit" onClick={onClose}>
            {tCommon('actions.close')}
          </Button>
        </DialogActions>
      </MotionDialog>
      <ErrorDialog
        open={!!activeError}
        message={activeError ?? ''}
        onClose={() => setActiveError(null)}
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  );
}

function Content({ title, value }: { title: string; value: string }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
        {value}
      </Typography>
    </Box>
  );
}
