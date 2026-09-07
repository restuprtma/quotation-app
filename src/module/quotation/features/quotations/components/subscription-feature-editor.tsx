import type { SubscriptionSaaSFormValues } from '../constants/subscription-saas';

import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function SubscriptionFeatureEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<SubscriptionSaaSFormValues>();

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'subscription_saas.feature_groups',
  });

  const handleAddGroup = () => {
    appendGroup({
      name: `Modul ${groupFields.length + 1}`,
      features: ['Fitur Utama'],
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('subscriptionSaaSForm.featuresTitle')}
        subheader={t('subscriptionSaaSForm.featuresSubtitle')}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={handleAddGroup}
            disabled={disabled}
          >
            {t('subscriptionSaaSForm.features.addGroup')}
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={2.5}>
          {groupFields.length === 0 && (
            <Alert severity="warning">
              Layout <strong>Development & Maintenance</strong> membutuhkan minimal 1 grup fitur. Klik tombol <strong>{t('subscriptionSaaSForm.features.addGroup')}</strong> di atas untuk menambahkan modul.
            </Alert>
          )}

          {groupFields.map((field, groupIndex) => (
            <Card
              key={field.id}
              variant="outlined"
              sx={{ p: 2.5, bgcolor: 'background.neutral' }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <RHFTextField
                    name={`subscription_saas.feature_groups.${groupIndex}.name`}
                    label={t('subscriptionSaaSForm.features.groupName')}
                    placeholder={t('subscriptionSaaSForm.features.groupNamePlaceholder')}
                    disabled={disabled}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    color="error"
                    aria-label={t('subscriptionSaaSForm.features.removeGroup')}
                    onClick={() => removeGroup(groupIndex)}
                    disabled={disabled || groupFields.length <= 1}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>

                {/* Nested Features List */}
                <Controller
                  name={`subscription_saas.feature_groups.${groupIndex}.features`}
                  control={control}
                  render={({ field: subField, fieldState: { error } }) => {
                    const features: string[] = Array.isArray(subField.value) ? subField.value : [];

                    const handleAddFeature = () => {
                      subField.onChange([...features, '']);
                    };

                    const handleUpdateFeature = (fIndex: number, val: string) => {
                      const next = [...features];
                      next[fIndex] = val;
                      subField.onChange(next);
                    };

                    const handleRemoveFeature = (fIndex: number) => {
                      subField.onChange(features.filter((_, i) => i !== fIndex));
                    };

                    return (
                      <Stack spacing={1.5} sx={{ pl: { xs: 0, sm: 2 } }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          Fitur dalam modul:
                        </Typography>

                        {error && (
                          <Typography variant="caption" color="error">
                            {error.message || 'Minimal 1 fitur diperlukan per grup'}
                          </Typography>
                        )}

                        {features.map((feature, featureIndex) => (
                          <Stack
                            key={featureIndex}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <TextField
                              fullWidth
                              size="small"
                              value={feature}
                              placeholder={t('subscriptionSaaSForm.features.featurePlaceholder')}
                              disabled={disabled}
                              onChange={(e) =>
                                handleUpdateFeature(featureIndex, e.target.value)
                              }
                            />
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={t('subscriptionSaaSForm.features.removeFeature')}
                              onClick={() => handleRemoveFeature(featureIndex)}
                              disabled={disabled || features.length <= 1}
                            >
                              <Iconify icon="eva:close-fill" width={18} />
                            </IconButton>
                          </Stack>
                        ))}

                        <Box sx={{ pt: 0.5 }}>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Iconify icon="solar:add-circle-linear" />}
                            onClick={handleAddFeature}
                            disabled={disabled}
                          >
                            {t('subscriptionSaaSForm.features.addFeature')}
                          </Button>
                        </Box>
                      </Stack>
                    );
                  }}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
