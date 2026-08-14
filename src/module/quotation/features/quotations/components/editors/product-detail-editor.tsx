import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Field } from 'src/shared/ui/hook-form';

export function ProductDetailEditor() {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'product_detail_data.modules',
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{t('details.productTitle')}</Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {t('details.modules')}
        </Typography>

        <Stack spacing={3}>
          {fields.map((field, index) => (
            <Card key={field.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  {t('details.modules')} {index + 1}
                </Typography>
                <IconButton color="error" size="small" onClick={() => remove(index)}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>
              
              <Field.Text
                name={`product_detail_data.modules.${index}.name`}
                label={t('details.moduleName')}
                sx={{ mb: 2 }}
              />

              <FeatureListEditor nestIndex={index} />
            </Card>
          ))}
        </Stack>

        <Button
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => append({ name: '', features: [] })}
          sx={{ mt: 2 }}
        >
          {t('details.addModule')}
        </Button>
      </Box>
    </Stack>
  );
}

function FeatureListEditor({ nestIndex }: { nestIndex: number }) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `product_detail_data.modules.${nestIndex}.features`,
  });

  return (
    <Box sx={{ pl: 2, borderLeft: (theme) => `2px solid ${theme.palette.divider}` }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('details.features')}
      </Typography>
      <Stack spacing={1.5}>
        {fields.map((field, index) => (
          <Stack key={field.id} direction="row" spacing={1} alignItems="center">
            <Field.Text
              name={`product_detail_data.modules.${nestIndex}.features.${index}`}
              placeholder={t('details.features')}
              size="small"
              sx={{ flex: 1 }}
            />
            <IconButton color="error" size="small" onClick={() => remove(index)}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button
        size="small"
        color="inherit"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => append('')}
        sx={{ mt: 1 }}
      >
        {t('details.addFeature')}
      </Button>
    </Box>
  );
}
