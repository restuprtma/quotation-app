import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RegenerateDialog({ open, loading, onClose, onConfirm }: Props) {
  const { t } = useTranslate('quotation');

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:refresh-fill" width={24} sx={{ color: 'info.main' }} />
          <Typography variant="h6">{t('editor.dialog.regenerateTitle')}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <DialogContentText color="text.secondary" sx={{ typography: 'body2' }}>
          {t('editor.dialog.regenerateWarning')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
          {t('editor.dialog.regenerateCancel')}
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="eva:refresh-fill" />
            )
          }
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? t('editor.regenerating') : t('editor.dialog.regenerateConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
