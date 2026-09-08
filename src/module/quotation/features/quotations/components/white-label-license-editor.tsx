import type { WhiteLabelFormValues } from '../constants/white-label';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';
import { RHFNumericField } from 'src/shared/ui/hook-form/rhf-numeric-field';

import { licenseLineTotal } from '../constants/white-label';
import { formatWhiteLabelCurrency } from './white-label-preview';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function WhiteLabelLicenseEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<WhiteLabelFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'white_label.license_items',
  });

  const watchedItems =
    useWatch({
      control,
      name: 'white_label.license_items',
    }) || [];

  const licenseSubtotal = watchedItems.reduce((sum, item) => {
    const total = licenseLineTotal(item);
    return sum + (total ?? 0);
  }, 0);

  const handleAddLicense = () => {
    append({
      name: '',
      unit_rate: 0,
      quantity: 1,
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('whiteLabelForm.licenseTitle')}
        subheader={t('whiteLabelForm.licenseSubtitle')}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={handleAddLicense}
            disabled={disabled}
          >
            {t('whiteLabelForm.license.add')}
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {fields.map((field, index) => {
            const currentItem = watchedItems[index] || { unit_rate: 0, quantity: 1, name: '' };
            const lineTotal = licenseLineTotal(currentItem);

            return (
              <Card key={field.id} variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <RHFTextField
                      name={`white_label.license_items.${index}.name`}
                      label={t('whiteLabelForm.license.name')}
                      placeholder={t('whiteLabelForm.license.namePlaceholder')}
                      disabled={disabled}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <RHFNumericField
                      name={`white_label.license_items.${index}.unit_rate`}
                      label={t('whiteLabelForm.license.unitRate')}
                      prefix="Rp"
                      disabled={disabled}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 2 }}>
                    <RHFTextField
                      name={`white_label.license_items.${index}.quantity`}
                      label={t('whiteLabelForm.license.quantity')}
                      type="number"
                      disabled={disabled}
                      size="small"
                      slotProps={{
                        htmlInput: { min: 1, max: 1_000_000, step: 1 },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 2 }} sx={{ textAlign: 'right' }}>
                    <IconButton
                      color="error"
                      aria-label={t('whiteLabelForm.license.remove')}
                      onClick={() => remove(index)}
                      disabled={disabled || fields.length <= 1}
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

          <Box sx={{ pt: 1 }}>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('whiteLabelForm.license.subtotal')}:
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {formatWhiteLabelCurrency(licenseSubtotal)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
