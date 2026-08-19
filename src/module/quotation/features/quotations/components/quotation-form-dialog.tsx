import type { Quotation } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';

type Props = {
  open: boolean;
  mode: 'new' | 'edit';
  id: string | null;
  onClose: () => void;
  onSaved: (quotation: Quotation) => void;
};

export function QuotationFormDialog({ open, mode, id, onClose, onSaved }: Props) {
  const { t } = useTranslate('quotation');
  const theme = useTheme();
  const isEditing = mode === 'edit';

  return (
    <MotionDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      transitionDuration={{
        enter: theme.transitions.duration.shortest,
        exit: theme.transitions.duration.shortest - 80,
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
        <Box sx={{ flex: 1 }}>{isEditing ? t('form.editTitle') : t('form.newTitle')}</Box>
        <IconButton size="small" onClick={onClose}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Iconify icon="solar:lock-password-outline" width={64} sx={{ color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary">
            Legacy Feature Removed
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Creation and editing of legacy quotations are disabled. Please wait until Phase 7 for
            the new structured editor.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button type="button" variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </MotionDialog>
  );
}
