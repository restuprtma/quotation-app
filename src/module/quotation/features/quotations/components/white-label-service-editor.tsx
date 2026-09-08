import type { WhiteLabelFormValues } from '../constants/white-label';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatWhiteLabelCurrency } from './white-label-preview';
import { FTE_OPTIONS, hostingLineTotal, maintenanceLineTotal } from '../constants/white-label';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function WhiteLabelServiceEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<WhiteLabelFormValues>();

  const {
    fields: maintenanceFields,
    append: appendMaintenance,
    remove: removeMaintenance,
  } = useFieldArray({
    control,
    name: 'white_label.maintenance_items',
  });

  const {
    fields: hostingFields,
    append: appendHosting,
    remove: removeHosting,
  } = useFieldArray({
    control,
    name: 'white_label.hosting_items',
  });

  const watchedMaintenance =
    useWatch({
      control,
      name: 'white_label.maintenance_items',
    }) || [];

  const watchedHosting =
    useWatch({
      control,
      name: 'white_label.hosting_items',
    }) || [];

  const maintenanceSubtotal = watchedMaintenance.reduce((sum, item) => {
    const total = maintenanceLineTotal(item);
    return sum + (total ?? 0);
  }, 0);

  const hostingSubtotal = watchedHosting.reduce((sum, item) => {
    const total = hostingLineTotal(item);
    return sum + (total ?? 0);
  }, 0);

  const combinedSubtotal = maintenanceSubtotal + hostingSubtotal;

  const handleAddMaintenance = () => {
    appendMaintenance({
      name: '',
      monthly_rate: 0,
      fte_quarters: 2, // 0,5 FTE default
      period_months: 3,
    });
  };

  const handleAddHosting = () => {
    appendHosting({
      name: '',
      monthly_rate: 0,
      quantity: 1,
      period_months: 3,
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('whiteLabelForm.serviceTitle')}
        subheader={t('whiteLabelForm.serviceSubtitle')}
      />
      <CardContent>
        <Stack spacing={3}>
          <Alert severity="info">{t('whiteLabelForm.service.helper')}</Alert>

          {/* Maintenance Section */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('whiteLabelForm.service.maintenanceTitle')}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddMaintenance}
                disabled={disabled}
              >
                {t('whiteLabelForm.service.addMaintenance')}
              </Button>
            </Stack>

            {maintenanceFields.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                Tidak ada item maintenance support.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {maintenanceFields.map((field, index) => {
                  const currentItem = watchedMaintenance[index] || {
                    name: '',
                    monthly_rate: 0,
                    fte_quarters: 2,
                    period_months: 1,
                  };
                  const lineTotal = maintenanceLineTotal(currentItem);

                  return (
                    <Card
                      key={field.id}
                      variant="outlined"
                      sx={{ p: 2, bgcolor: 'background.neutral' }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <RHFTextField
                            name={`white_label.maintenance_items.${index}.name`}
                            label={t('whiteLabelForm.service.maintenanceName')}
                            placeholder={t('whiteLabelForm.service.maintenanceNamePlaceholder')}
                            disabled={disabled}
                            size="small"
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                          <RHFNumericField
                            name={`white_label.maintenance_items.${index}.monthly_rate`}
                            label={t('whiteLabelForm.service.monthlyRate')}
                            prefix="Rp"
                            disabled={disabled}
                            size="small"
                          />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 2 }}>
                          <RHFSelect
                            name={`white_label.maintenance_items.${index}.fte_quarters`}
                            label={t('whiteLabelForm.service.fte')}
                            disabled={disabled}
                            size="small"
                          >
                            {FTE_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </RHFSelect>
                        </Grid>

                        <Grid size={{ xs: 4, sm: 2 }}>
                          <RHFTextField
                            name={`white_label.maintenance_items.${index}.period_months`}
                            label={t('whiteLabelForm.service.periodMonths')}
                            type="number"
                            disabled={disabled}
                            size="small"
                            slotProps={{
                              htmlInput: { min: 1, max: 120, step: 1 },
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right' }}>
                          <IconButton
                            color="error"
                            aria-label={t('whiteLabelForm.service.removeMaintenance')}
                            onClick={() => removeMaintenance(index)}
                            disabled={disabled}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              {t('whiteLabelForm.license.lineTotal')}:
                            </Typography>
                            <Typography variant="caption" fontWeight={700}>
                              {lineTotal !== null
                                ? formatWhiteLabelCurrency(lineTotal)
                                : 'Kalkulasi tidak valid'}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Hosting Section */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('whiteLabelForm.service.hostingTitle')}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddHosting}
                disabled={disabled}
              >
                {t('whiteLabelForm.service.addHosting')}
              </Button>
            </Stack>

            {hostingFields.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                Tidak ada item hosting atau infrastruktur.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {hostingFields.map((field, index) => {
                  const currentItem = watchedHosting[index] || {
                    name: '',
                    monthly_rate: 0,
                    quantity: 1,
                    period_months: 1,
                  };
                  const lineTotal = hostingLineTotal(currentItem);

                  return (
                    <Card
                      key={field.id}
                      variant="outlined"
                      sx={{ p: 2, bgcolor: 'background.neutral' }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <RHFTextField
                            name={`white_label.hosting_items.${index}.name`}
                            label={t('whiteLabelForm.service.hostingName')}
                            placeholder={t('whiteLabelForm.service.hostingNamePlaceholder')}
                            disabled={disabled}
                            size="small"
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                          <RHFNumericField
                            name={`white_label.hosting_items.${index}.monthly_rate`}
                            label={t('whiteLabelForm.service.monthlyRate')}
                            prefix="Rp"
                            disabled={disabled}
                            size="small"
                          />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 2 }}>
                          <RHFTextField
                            name={`white_label.hosting_items.${index}.quantity`}
                            label={t('whiteLabelForm.service.hostingQuantity')}
                            type="number"
                            disabled={disabled}
                            size="small"
                            slotProps={{
                              htmlInput: { min: 1, max: 1_000_000, step: 1 },
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 4, sm: 2 }}>
                          <RHFTextField
                            name={`white_label.hosting_items.${index}.period_months`}
                            label={t('whiteLabelForm.service.periodMonths')}
                            type="number"
                            disabled={disabled}
                            size="small"
                            slotProps={{
                              htmlInput: { min: 1, max: 120, step: 1 },
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right' }}>
                          <IconButton
                            color="error"
                            aria-label={t('whiteLabelForm.service.removeHosting')}
                            onClick={() => removeHosting(index)}
                            disabled={disabled}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              {t('whiteLabelForm.license.lineTotal')}:
                            </Typography>
                            <Typography variant="caption" fontWeight={700}>
                              {lineTotal !== null
                                ? formatWhiteLabelCurrency(lineTotal)
                                : 'Kalkulasi tidak valid'}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Combined Subtotals Footer */}
          {(maintenanceFields.length > 0 || hostingFields.length > 0) && (
            <Box sx={{ pt: 1 }}>
              <Stack spacing={0.5} alignItems="flex-end">
                {maintenanceFields.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {t('whiteLabelForm.service.subtotalMaintenance')}:{' '}
                    {formatWhiteLabelCurrency(maintenanceSubtotal)}
                  </Typography>
                )}
                {hostingFields.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {t('whiteLabelForm.service.subtotalHosting')}:{' '}
                    {formatWhiteLabelCurrency(hostingSubtotal)}
                  </Typography>
                )}
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('whiteLabelForm.service.subtotalCombined')}:{' '}
                  {formatWhiteLabelCurrency(combinedSubtotal)}
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
