import type { CustomDevelopmentFormValues } from './custom-development-form-model';

import { useWatch, Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { formatCustomDevelopmentCurrency } from './custom-development-preview';
import {
  CUSTOM_DEVELOPMENT_TABLE_MODE_OPTIONS,
  calculateCustomDevelopmentDraftTotals,
} from '../constants/custom-development';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function CustomDevelopmentCostEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue, watch } = useFormContext<CustomDevelopmentFormValues>();

  const customDev = useWatch({ control, name: 'custom_development' });
  const tableMode = customDev?.development_table_mode || 'monthly_period';

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'custom_development.development_groups',
  });

  const handleTableModeChange = (newMode: 'monthly_period' | 'daily_period' | 'fixed_days') => {
    setValue('custom_development.development_table_mode', newMode, { shouldValidate: true });
  };

  const handleAddGroup = () => {
    appendGroup({
      title: '',
      items: [
        {
          name: '',
          display_rate: null,
          headcount: 1,
          period_label: '1',
          quoted_line_total: 0,
        },
      ],
    });
  };

  const draftTotals = calculateCustomDevelopmentDraftTotals({
    development_groups: (customDev?.development_groups || []).filter(Boolean).map((g) => ({
      title: g.title || '',
      items: (g.items || []).filter(Boolean).map((item) => ({
        name: item.name || '',
        display_rate: item.display_rate ?? null,
        headcount: Number(item.headcount) || 1,
        period_label: item.period_label || '',
        quoted_line_total:
          item.quoted_line_total !== null && item.quoted_line_total !== undefined
            ? Number(item.quoted_line_total)
            : null,
      })),
    })),
    discount_amount: Number(customDev?.discount_amount) || 0,
    monthly_items: (customDev?.monthly_items || []).filter(Boolean).map((m) => ({
      name: m.name || '',
      specification: m.specification || '',
      unit_rate: Number(m.unit_rate) || 0,
      quantity: Number(m.quantity) || 1,
    })),
    payment_schedule: (customDev?.payment_schedule || []).filter(Boolean).map((p) => ({
      work_period: p.work_period || '',
      terms: p.terms || '',
      invoice_date_label: p.invoice_date_label || '',
      due_date_label: p.due_date_label || '',
      component: p.component || 'development',
      nominal: Number(p.nominal) || 0,
    })),
  });

  const rateHeader =
    tableMode === 'fixed_days' ? null : t('customDevelopmentForm.cost.rateMonthly');

  const periodHeader =
    tableMode === 'fixed_days'
      ? t('customDevelopmentForm.cost.periodDays')
      : tableMode === 'daily_period'
        ? t('customDevelopmentForm.cost.periodDay')
        : t('customDevelopmentForm.cost.periodMonth');

  return (
    <Card>
      <CardHeader
        title={t('customDevelopmentForm.costTitle')}
        subheader={t('customDevelopmentForm.costSubtitle')}
        action={
          <Box sx={{ minWidth: 200 }}>
            <TextField
              select
              fullWidth
              size="small"
              label={t('customDevelopmentForm.cost.tableMode')}
              value={tableMode}
              onChange={(e) =>
                handleTableModeChange(
                  e.target.value as 'monthly_period' | 'daily_period' | 'fixed_days'
                )
              }
              disabled={disabled}
            >
              {CUSTOM_DEVELOPMENT_TABLE_MODE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        }
      />
      <CardContent>
        <Stack spacing={3}>
          {/* Groups list */}
          {groupFields.map((groupField, groupIndex) => (
            <CostGroupSection
              key={groupField.id}
              groupIndex={groupIndex}
              control={control}
              disabled={disabled}
              tableMode={tableMode}
              rateHeader={rateHeader}
              periodHeader={periodHeader}
              canRemoveGroup={groupFields.length > 1}
              onRemoveGroup={() => removeGroup(groupIndex)}
              setValue={setValue}
              watch={watch}
            />
          ))}

          {/* Add Group Button */}
          <Box>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddGroup}
              disabled={disabled}
            >
              {t('customDevelopmentForm.cost.addGroup')}
            </Button>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Discount Configuration */}
          <Stack spacing={2} sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
            <FormControlLabel
              control={
                <Controller
                  name="custom_development.show_discount_row"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={disabled}
                    />
                  )}
                />
              }
              label={
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('customDevelopmentForm.cost.showDiscountRow')}
                </Typography>
              }
            />

            {Boolean(customDev?.show_discount_row) && (
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="custom_development.discount_label"
                    label={t('customDevelopmentForm.cost.discountLabel')}
                    disabled={disabled}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFNumericField
                    name="custom_development.discount_amount"
                    label={t('customDevelopmentForm.cost.discountAmount')}
                    disabled={disabled}
                  />
                </Grid>
              </Grid>
            )}
          </Stack>

          {/* Summary Box */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('customDevelopmentForm.cost.subtotal')}
                </Typography>
                <Typography variant="subtitle2">
                  {formatCustomDevelopmentCurrency(draftTotals.development_subtotal)}
                </Typography>
              </Stack>

              {draftTotals.discount_amount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t('customDevelopmentForm.cost.discountAmount')}:
                  </Typography>
                  <Typography variant="subtitle2" color="error.main">
                    - {formatCustomDevelopmentCurrency(draftTotals.discount_amount)}
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ my: 0.5 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('customDevelopmentForm.cost.totalInvestment')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  {formatCustomDevelopmentCurrency(draftTotals.total_investment)}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

type GroupSectionProps = {
  groupIndex: number;
  control: any;
  disabled: boolean;
  tableMode: 'monthly_period' | 'daily_period' | 'fixed_days';
  rateHeader: string | null;
  periodHeader: string;
  canRemoveGroup: boolean;
  onRemoveGroup: () => void;
  setValue: any;
  watch: any;
};

function CostGroupSection({
  groupIndex,
  control,
  disabled,
  tableMode,
  rateHeader,
  periodHeader,
  canRemoveGroup,
  onRemoveGroup,
  setValue,
  watch,
}: GroupSectionProps) {
  const { t } = useTranslate('quotation');

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `custom_development.development_groups.${groupIndex}.items`,
  });

  const watchedItems = watch(`custom_development.development_groups.${groupIndex}.items`) || [];

  const handleAddItem = () => {
    appendItem({
      name: '',
      display_rate: null,
      headcount: 1,
      period_label: '1',
      quoted_line_total: 0,
    });
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <RHFTextField
              name={`custom_development.development_groups.${groupIndex}.title`}
              label={t('customDevelopmentForm.cost.groupTitle')}
              placeholder={t('customDevelopmentForm.cost.groupTitlePlaceholder')}
              disabled={disabled}
            />
          </Box>
          <Button
            color="error"
            size="small"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveGroup}
            disabled={disabled || !canRemoveGroup}
          >
            {t('customDevelopmentForm.cost.removeGroup')}
          </Button>
        </Stack>

        {/* Items */}
        <Stack spacing={2}>
          {itemFields.map((itemField, itemIndex) => {
            const currentItem = watchedItems[itemIndex] || {};
            const hasExplicitTotal =
              currentItem.quoted_line_total !== null && currentItem.quoted_line_total !== undefined;

            return (
              <Box
                key={itemField.id}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'background.neutral',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Name */}
                  <Grid size={{ xs: 12, md: tableMode === 'fixed_days' ? 4 : 3 }}>
                    <RHFTextField
                      name={`custom_development.development_groups.${groupIndex}.items.${itemIndex}.name`}
                      label={t('customDevelopmentForm.cost.name')}
                      placeholder={t('customDevelopmentForm.cost.namePlaceholder')}
                      disabled={disabled}
                    />
                  </Grid>

                  {/* Display Rate (only when not fixed_days) */}
                  {tableMode !== 'fixed_days' && (
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                      <Controller
                        name={`custom_development.development_groups.${groupIndex}.items.${itemIndex}.display_rate`}
                        control={control}
                        render={({ field, fieldState: { error } }) => {
                          const numVal =
                            typeof field.value === 'number' && field.value > 0
                              ? new Intl.NumberFormat('id-ID').format(field.value)
                              : '';
                          return (
                            <TextField
                              fullWidth
                              label={rateHeader}
                              placeholder="0"
                              value={numVal}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                field.onChange(raw ? Number(raw) : null);
                              }}
                              onBlur={field.onBlur}
                              disabled={disabled}
                              error={Boolean(error)}
                              helperText={error?.message}
                              slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { inputMode: 'numeric', autoComplete: 'off' },
                              }}
                            />
                          );
                        }}
                      />
                    </Grid>
                  )}

                  {/* Headcount */}
                  <Grid size={{ xs: 6, sm: 3, md: tableMode === 'fixed_days' ? 2 : 1.5 }}>
                    <Controller
                      name={`custom_development.development_groups.${groupIndex}.items.${itemIndex}.headcount`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          fullWidth
                          type="number"
                          label={t('customDevelopmentForm.cost.headcount')}
                          value={field.value ?? 1}
                          onChange={(e) =>
                            field.onChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          error={Boolean(error)}
                          helperText={error?.message}
                          disabled={disabled}
                          slotProps={{ htmlInput: { min: 1, max: 100 } }}
                        />
                      )}
                    />
                  </Grid>

                  {/* Period Label */}
                  <Grid size={{ xs: 6, sm: 3, md: tableMode === 'fixed_days' ? 2 : 1.5 }}>
                    <RHFTextField
                      name={`custom_development.development_groups.${groupIndex}.items.${itemIndex}.period_label`}
                      label={periodHeader}
                      placeholder={t('customDevelopmentForm.cost.periodLabelPlaceholder')}
                      disabled={disabled}
                    />
                  </Grid>

                  {/* Quoted Line Total or Included Toggle */}
                  <Grid size={{ xs: 10, sm: 10, md: tableMode === 'fixed_days' ? 3.5 : 3 }}>
                    <Stack spacing={0.5}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={hasExplicitTotal}
                            disabled={disabled}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setValue(
                                  `custom_development.development_groups.${groupIndex}.items.${itemIndex}.quoted_line_total`,
                                  0,
                                  { shouldValidate: true }
                                );
                              } else {
                                setValue(
                                  `custom_development.development_groups.${groupIndex}.items.${itemIndex}.quoted_line_total`,
                                  null,
                                  { shouldValidate: true }
                                );
                              }
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" color="text.secondary">
                            {t('customDevelopmentForm.cost.hasExplicitTotal')}
                          </Typography>
                        }
                      />

                      {hasExplicitTotal ? (
                        <RHFNumericField
                          name={`custom_development.development_groups.${groupIndex}.items.${itemIndex}.quoted_line_total`}
                          label={t('customDevelopmentForm.cost.quotedLineTotal')}
                          disabled={disabled}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label={t('customDevelopmentForm.cost.includedResource')}
                          variant="outlined"
                          color="default"
                          sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                        />
                      )}
                    </Stack>
                  </Grid>

                  {/* Delete Item Button */}
                  <Grid size={{ xs: 2, sm: 2, md: 0.5 }} sx={{ textAlign: 'right' }}>
                    <IconButton
                      color="error"
                      disabled={disabled || itemFields.length <= 1}
                      onClick={() => removeItem(itemIndex)}
                      aria-label={t('customDevelopmentForm.cost.removeItem')}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </Stack>

        <Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={handleAddItem}
            disabled={disabled}
          >
            {t('customDevelopmentForm.cost.addItem')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
