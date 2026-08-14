import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Field } from 'src/shared/ui/hook-form';

export function ProjectDetailEditor() {
  const { t } = useTranslate('quotation');

  return (
    <Stack spacing={4}>
      <Typography variant="h6">{t('details.projectTitle')}</Typography>

      <StringListEditor name="product_detail_data.goals" label={t('details.goals')} addButton={t('details.addGoal')} />
      <StringListEditor name="product_detail_data.deliverables" label={t('details.deliverables')} addButton={t('details.addDeliverable')} />
    </Stack>
  );
}

function StringListEditor({ name, label, addButton }: { name: string; label: string; addButton: string }) {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        {label}
      </Typography>
      <Stack spacing={1.5}>
        {fields.map((field, index) => (
          <Stack key={field.id} direction="row" spacing={1} alignItems="flex-start">
            <Field.Text
              name={`${name}.${index}`}
              placeholder={label}
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
        {addButton}
      </Button>
    </Box>
  );
}
