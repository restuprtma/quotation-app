import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Field } from 'src/shared/ui/hook-form';

export function BlueprintEditor() {
  const { t } = useTranslate('quotation');

  return (
    <Stack spacing={4}>
      <Typography variant="h6">{t('blueprint.title')}</Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Field.Text name="blueprint_data.title" label="Blueprint Title" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Field.Text name="blueprint_data.summary" label="Blueprint Summary" multiline rows={4} />
        </Grid>
      </Grid>

      <Divider />

      <StringListEditor name="blueprint_data.assumptions" label="Assumptions" />
      <StringListEditor name="blueprint_data.rules" label="Rules" />
      <StringListEditor name="blueprint_data.edge_cases" label="Edge Cases" />
      <StringListEditor name="blueprint_data.outputs" label="Outputs" />

    </Stack>
  );
}

function StringListEditor({ name, label }: { name: string; label: string }) {
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
        Add {label}
      </Button>
    </Box>
  );
}
