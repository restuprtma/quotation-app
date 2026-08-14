import type { ProjectType } from '../types';

import { useWatch, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Field, RHFNumericField } from 'src/shared/ui/hook-form';

type Props = {
  nestIndex: number;
  itemIndex: number;
  projectType: ProjectType;
  onRemove: () => void;
};

export function PricingItemEditor({ nestIndex, itemIndex, projectType, onRemove }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();

  const prefix = `sections.${nestIndex}.items.${itemIndex}`;

  const pricingMode = useWatch({
    control,
    name: `${prefix}.pricing_mode`,
  });

  const unitPrice = useWatch({ control, name: `${prefix}.unit_price` }) || 0;
  const quantity = useWatch({ control, name: `${prefix}.quantity` }) || 0;
  const employeeCount = useWatch({ control, name: `${prefix}.employee_count` }) || 0;
  const duration = useWatch({ control, name: `${prefix}.duration` }) || 0;

  // Calculate preview total
  let lineTotal = 0;
  if (pricingMode === 'unit') {
    lineTotal = unitPrice * quantity;
  } else if (pricingMode === 'resource') {
    lineTotal = unitPrice * employeeCount * duration;
  } else {
    lineTotal = unitPrice;
  }

  return (
    <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle2">
          {t('pricing.items')} {itemIndex + 1}
        </Typography>
        <IconButton size="small" color="error" onClick={onRemove}>
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text name={`${prefix}.item_name`} label={t('pricing.itemName')} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Field.Select name={`${prefix}.pricing_mode`} label={t('pricing.pricingMode')}>
            <MenuItem value="unit">{t('pricingModes.unit')}</MenuItem>
            <MenuItem value="resource">{t('pricingModes.resource')}</MenuItem>
            <MenuItem value="fixed">{t('pricingModes.fixed')}</MenuItem>
          </Field.Select>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Field.Select name={`${prefix}.billing_period`} label={t('pricing.billingPeriod')}>
            <MenuItem value="one_time">{t('billingPeriods.one_time')}</MenuItem>
            <MenuItem value="monthly">{t('billingPeriods.monthly')}</MenuItem>
            <MenuItem value="yearly">{t('billingPeriods.yearly')}</MenuItem>
            <MenuItem value="custom">{t('billingPeriods.custom')}</MenuItem>
          </Field.Select>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <RHFNumericField name={`${prefix}.unit_price`} label={t('pricing.unitPrice')} prefix="Rp" />
        </Grid>

        {pricingMode === 'unit' && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFNumericField name={`${prefix}.quantity`} label={t('pricing.quantity')} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Field.Text name={`${prefix}.unit_label`} label={t('pricing.unitLabel')} />
            </Grid>
          </>
        )}

        {pricingMode === 'resource' && (
          <>
            <Grid size={{ xs: 12, md: 3 }}>
              <RHFNumericField name={`${prefix}.employee_count`} label={t('pricing.employeeCount')} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <RHFNumericField name={`${prefix}.duration`} label={t('pricing.duration')} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Field.Text name={`${prefix}.duration_unit`} label={t('pricing.durationUnit')} />
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('pricing.lineTotal')} (Preview)
            </Typography>
            <Typography variant="subtitle1">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(lineTotal)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}
