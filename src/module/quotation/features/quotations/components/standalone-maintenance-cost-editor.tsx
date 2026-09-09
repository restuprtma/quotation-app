import type { StandaloneMaintenanceFormValues } from '../constants/standalone-maintenance';

import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatStandaloneMaintenanceCurrency } from './standalone-maintenance-preview';
import { retainerLineTotal, FTE_QUARTER_OPTIONS } from '../constants/standalone-maintenance';

// ----------------------------------------------------------------------

type Props = {
  mode: 'retainer' | 'hourly_task';
  disabled?: boolean;
};

export function StandaloneMaintenanceCostEditor({ mode, disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, watch } = useFormContext<StandaloneMaintenanceFormValues>();

  const {
    fields: retainerFields,
    append: appendRetainer,
    remove: removeRetainer,
  } = useFieldArray({
    control,
    name: 'standalone_maintenance.retainer_items',
  });

  const {
    fields: hourlyFields,
    append: appendHourly,
    remove: removeHourly,
  } = useFieldArray({
    control,
    name: 'standalone_maintenance.hourly_cost_items',
  });

  const watchedRetainerItems = watch('standalone_maintenance.retainer_items') || [];

  const handleAddRetainer = () => {
    appendRetainer({
      name: '',
      monthly_rate: 0,
      fte_quarters: 4,
      period_months: 1,
    });
  };

  const handleAddHourly = () => {
    appendHourly({
      name: '',
      display_monthly_rate: 0,
      headcount: 1,
      hours_half_units: 2,
      quoted_line_total: 0,
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('standaloneMaintenanceForm.costTitle')}
        subheader={t('standaloneMaintenanceForm.costSubtitle')}
      />
      <CardContent>
        {mode === 'retainer' ? (
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('standaloneMaintenanceForm.cost.retainerItemsTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddRetainer}
                disabled={disabled}
                aria-label={t('standaloneMaintenanceForm.cost.addRetainerItem')}
                sx={{ minHeight: 44, px: 2 }}
              >
                {t('standaloneMaintenanceForm.cost.addRetainerItem')}
              </Button>
            </Stack>

            <Stack spacing={2.5}>
              {retainerFields.map((field, index) => {
                const currentItem = watchedRetainerItems[index] || {
                  monthly_rate: 0,
                  fte_quarters: 4,
                  period_months: 1,
                };
                const lineTotal = retainerLineTotal({
                  name: currentItem.name || '',
                  monthly_rate: Number(currentItem.monthly_rate) || 0,
                  fte_quarters: Number(currentItem.fte_quarters) || 4,
                  period_months: Number(currentItem.period_months) || 1,
                });

                return (
                  <Box
                    key={field.id}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 3 }}>
                        <RHFTextField
                          name={`standalone_maintenance.retainer_items.${index}.name`}
                          label={t('standaloneMaintenanceForm.cost.roleName')}
                          placeholder={t('standaloneMaintenanceForm.cost.roleNamePlaceholder')}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <RHFNumericField
                          name={`standalone_maintenance.retainer_items.${index}.monthly_rate`}
                          label={t('standaloneMaintenanceForm.cost.monthlyRate')}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <Controller
                          name={`standalone_maintenance.retainer_items.${index}.fte_quarters`}
                          control={control}
                          render={({ field: fteField, fieldState: { error } }) => (
                            <TextField
                              select
                              fullWidth
                              label={t('standaloneMaintenanceForm.cost.fte')}
                              value={fteField.value ?? 4}
                              onChange={(e) => fteField.onChange(Number(e.target.value))}
                              error={Boolean(error)}
                              helperText={error?.message}
                              disabled={disabled}
                            >
                              {FTE_QUARTER_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                        <Controller
                          name={`standalone_maintenance.retainer_items.${index}.period_months`}
                          control={control}
                          render={({ field: periodField, fieldState: { error } }) => (
                            <TextField
                              fullWidth
                              type="number"
                              label={t('standaloneMaintenanceForm.cost.periodMonths')}
                              value={periodField.value ?? 1}
                              onChange={(e) =>
                                periodField.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                              error={Boolean(error)}
                              helperText={error?.message}
                              disabled={disabled}
                              slotProps={{ htmlInput: { min: 1, max: 60 } }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, sm: 10, md: 2 }}>
                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t('standaloneMaintenanceForm.cost.lineTotal')}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {lineTotal !== null
                              ? formatStandaloneMaintenanceCurrency(lineTotal)
                              : '-'}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 2, md: 0.5 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={t('standaloneMaintenanceForm.cost.remove')}
                          disabled={disabled || retainerFields.length <= 1}
                          onClick={() => removeRetainer(index)}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Alert severity="info" sx={{ mb: 1 }}>
              {t('standaloneMaintenanceForm.cost.hourlyRateHelper')}
            </Alert>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('standaloneMaintenanceForm.cost.hourlyItemsTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddHourly}
                disabled={disabled}
                aria-label={t('standaloneMaintenanceForm.cost.addHourlyItem')}
                sx={{ minHeight: 44, px: 2 }}
              >
                {t('standaloneMaintenanceForm.cost.addHourlyItem')}
              </Button>
            </Stack>

            <Stack spacing={2.5}>
              {hourlyFields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 3 }}>
                      <RHFTextField
                        name={`standalone_maintenance.hourly_cost_items.${index}.name`}
                        label={t('standaloneMaintenanceForm.cost.roleName')}
                        placeholder={t('standaloneMaintenanceForm.cost.roleNamePlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                      <RHFNumericField
                        name={`standalone_maintenance.hourly_cost_items.${index}.display_monthly_rate`}
                        label={t('standaloneMaintenanceForm.cost.displayMonthlyRate')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                      <Controller
                        name={`standalone_maintenance.hourly_cost_items.${index}.headcount`}
                        control={control}
                        render={({ field: headField, fieldState: { error } }) => (
                          <TextField
                            fullWidth
                            type="number"
                            label={t('standaloneMaintenanceForm.cost.headcount')}
                            value={headField.value ?? 1}
                            onChange={(e) =>
                              headField.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                            }
                            error={Boolean(error)}
                            helperText={error?.message}
                            disabled={disabled}
                            slotProps={{ htmlInput: { min: 1, max: 100 } }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                      <Controller
                        name={`standalone_maintenance.hourly_cost_items.${index}.hours_half_units`}
                        control={control}
                        render={({ field: hoursField, fieldState: { error } }) => {
                          const hoursVal = Number(hoursField.value) > 0 ? hoursField.value / 2 : '';
                          return (
                            <TextField
                              fullWidth
                              type="number"
                              label={t('standaloneMaintenanceForm.cost.hours')}
                              value={hoursVal}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!Number.isNaN(val) && val > 0) {
                                  hoursField.onChange(Math.round(val * 2));
                                } else {
                                  hoursField.onChange(0);
                                }
                              }}
                              error={Boolean(error)}
                              helperText={error?.message}
                              disabled={disabled}
                              slotProps={{ htmlInput: { step: 0.5, min: 0.5, max: 1000 } }}
                            />
                          );
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 10, sm: 6, md: 2.5 }}>
                      <RHFNumericField
                        name={`standalone_maintenance.hourly_cost_items.${index}.quoted_line_total`}
                        label={t('standaloneMaintenanceForm.cost.quotedLineTotal')}
                        disabled={disabled}
                      />
                    </Grid>

                    <Grid size={{ xs: 2, sm: 2, md: 1 }} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        aria-label={t('standaloneMaintenanceForm.cost.remove')}
                        disabled={disabled || hourlyFields.length <= 1}
                        onClick={() => removeHourly(index)}
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
