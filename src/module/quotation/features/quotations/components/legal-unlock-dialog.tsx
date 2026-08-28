import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LegalUnlockDialog({ open, onClose, onConfirm }: Props) {
  const { t } = useTranslate('quotation');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:alert-triangle-fill" width={24} sx={{ color: 'warning.main' }} />
          <Typography variant="h6">{t('editor.dialog.unlockTitle')}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <DialogContentText color="text.secondary" sx={{ typography: 'body2' }}>
          {t('editor.dialog.unlockWarning')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('editor.dialog.unlockCancel')}
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<Iconify icon="eva:unlock-fill" />}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {t('editor.dialog.unlockConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
