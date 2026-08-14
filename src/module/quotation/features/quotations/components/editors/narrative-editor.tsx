import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Field } from 'src/shared/ui/hook-form';

export function NarrativeEditor() {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'narrative_data.scope',
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{t('narrative.title')}</Typography>

      <Field.Text
        name="narrative_data.introduction"
        label={t('narrative.introduction')}
        multiline
        rows={6}
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {t('narrative.scope')}
        </Typography>
        <Stack spacing={2}>
          {fields.map((field, index) => (
            <Stack key={field.id} direction="row" spacing={1} alignItems="flex-start">
              <Field.Text
                name={`narrative_data.scope.${index}`}
                placeholder={t('narrative.scope')}
                multiline
                rows={2}
                sx={{ flex: 1 }}
              />
              <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 0.5 }}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => append('')}
          sx={{ mt: 2 }}
        >
          {t('narrative.addScope')}
        </Button>
      </Box>
    </Stack>
  );
}
