import type { CustomDevelopmentFormValues } from './custom-development-form-model';

import { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatCustomDevelopmentCurrency } from './custom-development-preview';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function CustomDevelopmentMonthlyEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue, watch } = useFormContext<CustomDevelopmentFormValues>();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const monthlyItems = watch('custom_development.monthly_items') || [];
  const hasMonthly = monthlyItems.length > 0;

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'custom_development.monthly_items',
  });

  const {
    fields: noteFields,
    append: appendNote,
    remove: removeNote,
  } = useFieldArray({
    control,
    name: 'custom_development.monthly_notes' as any,
  });

  const handleToggleSwitch = () => {
    if (!hasMonthly) {
      appendItem({
        name: '',
        specification: '',
        unit_rate: 0,
        quantity: 1,
      });
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmClear = () => {
    setValue('custom_development.monthly_items', [], { shouldValidate: true });
    setValue('custom_development.monthly_notes', [], { shouldValidate: true });
    setConfirmDialogOpen(false);
  };

  const handleCancelClear = () => {
    setConfirmDialogOpen(false);
  };

  const handleAddItem = () => {
    appendItem({
      name: '',
      specification: '',
      unit_rate: 0,
      quantity: 1,
    });
  };

  const handleAddNote = () => {
    appendNote('');
  };

  const monthlyTotal = monthlyItems.reduce((acc, item) => {
    const rate = Number(item?.unit_rate) || 0;
    const qty = Number(item?.quantity) || 0;
    return acc + rate * qty;
  }, 0);

  return (
    <Card>
      <CardHeader
        title={t('customDevelopmentForm.monthlyTitle')}
        subheader={t('customDevelopmentForm.monthlySubtitle')}
        action={
          <FormControlLabel
            control={
              <Switch checked={hasMonthly} onChange={handleToggleSwitch} disabled={disabled} />
            }
            label={
              <Typography variant="subtitle2" fontWeight={600}>
                {t('customDevelopmentForm.monthly.enableSwitch')}
              </Typography>
            }
          />
        }
      />

      {hasMonthly && (
        <CardContent>
          <Stack spacing={3}>
            {/* Monthly Items */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('customDevelopmentForm.monthly.itemsTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddItem}
                disabled={disabled}
              >
                {t('customDevelopmentForm.monthly.addItem')}
              </Button>
            </Stack>

            <Stack spacing={2}>
              {itemFields.map((field, index) => {
                const item = monthlyItems[index] || {};
                const lineTotal = (Number(item.unit_rate) || 0) * (Number(item.quantity) || 0);

                return (
                  <Box
                    key={field.id}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 3.5 }}>
                        <RHFTextField
                          name={`custom_development.monthly_items.${index}.name`}
                          label={t('customDevelopmentForm.monthly.name')}
                          placeholder={t('customDevelopmentForm.monthly.namePlaceholder')}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3.5 }}>
                        <RHFTextField
                          name={`custom_development.monthly_items.${index}.specification`}
                          label={t('customDevelopmentForm.monthly.specification')}
                          placeholder={t('customDevelopmentForm.monthly.specificationPlaceholder')}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <RHFNumericField
                          name={`custom_development.monthly_items.${index}.unit_rate`}
                          label={t('customDevelopmentForm.monthly.unitRate')}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3, md: 1 }}>
                        <Controller
                          name={`custom_development.monthly_items.${index}.quantity`}
                          control={control}
                          render={({ field: qtyField, fieldState: { error } }) => (
                            <TextField
                              fullWidth
                              type="number"
                              label={t('customDevelopmentForm.monthly.quantity')}
                              value={qtyField.value ?? 1}
                              onChange={(e) =>
                                qtyField.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                              error={Boolean(error)}
                              helperText={error?.message}
                              disabled={disabled}
                              slotProps={{ htmlInput: { min: 1, max: 10000 } }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, sm: 4, md: 1.5 }}>
                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t('customDevelopmentForm.monthly.lineTotal')}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {formatCustomDevelopmentCurrency(lineTotal)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 1, md: 0.5 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          disabled={disabled || itemFields.length <= 1}
                          onClick={() => removeItem(index)}
                          aria-label={t('customDevelopmentForm.monthly.removeItem')}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Stack>

            <Divider sx={{ my: 1 }} />

            {/* Monthly Notes */}
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                sx={{ gap: 1 }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('customDevelopmentForm.monthly.notesTitle')}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleAddNote}
                  disabled={disabled}
                >
                  {t('customDevelopmentForm.monthly.addNote')}
                </Button>
              </Stack>

              <Alert severity="info" sx={{ py: 0.5 }}>
                {t('customDevelopmentForm.monthly.notesBanner')}
              </Alert>

              <Stack spacing={1.5}>
                {noteFields.map((field, index) => (
                  <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                    <RHFTextField
                      name={`custom_development.monthly_notes.${index}`}
                      placeholder={t('customDevelopmentForm.monthly.notePlaceholder')}
                      disabled={disabled}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeNote(index)}
                      disabled={disabled}
                      aria-label={t('customDevelopmentForm.monthly.removeNote')}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Divider sx={{ my: 1 }} />

            {/* Total Monthly */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('customDevelopmentForm.monthly.monthlyTotal')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="info.main">
                  {formatCustomDevelopmentCurrency(monthlyTotal)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      )}

      {/* Confirmation dialog for clearing monthly costs */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelClear}>
        <DialogTitle>{t('customDevelopmentForm.monthly.confirmClearTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customDevelopmentForm.monthly.confirmClearMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear} color="inherit">
            {t('customDevelopmentForm.monthly.cancelClear')}
          </Button>
          <Button onClick={handleConfirmClear} variant="contained" color="warning" autoFocus>
            {t('customDevelopmentForm.monthly.confirmClear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
