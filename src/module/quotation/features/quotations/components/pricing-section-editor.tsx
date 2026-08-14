import type { ProjectType } from '../types';

import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Field } from 'src/shared/ui/hook-form';

import { PricingItemEditor } from './pricing-item-editor';

type Props = {
  sectionIndex: number;
  projectType: ProjectType;
  onRemove: () => void;
};

export function PricingSectionEditor({ sectionIndex, projectType, onRemove }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items`,
  });

  const handleAddItem = () => {
    append({
      item_name: '',
      pricing_mode: projectType === 'product_based' ? 'unit' : 'resource',
      unit_price: 0,
      quantity: 1,
      employee_count: 1,
      duration: 1,
      billing_period: 'one_time',
      sort_order: fields.length,
    });
  };

  return (
    <Card sx={{ p: 3, mb: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6">
          {t('pricing.sections')} {sectionIndex + 1}
        </Typography>
        <IconButton color="error" onClick={onRemove}>
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Field.Text name={`sections.${sectionIndex}.section_name`} label={t('pricing.sectionName')} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Field.Select name={`sections.${sectionIndex}.section_type`} label={t('pricing.sectionType')}>
            <MenuItem value="package">{t('sectionTypes.package')}</MenuItem>
            <MenuItem value="service">{t('sectionTypes.service')}</MenuItem>
            <MenuItem value="phase">{t('sectionTypes.phase')}</MenuItem>
            <MenuItem value="resource_group">{t('sectionTypes.resource_group')}</MenuItem>
            <MenuItem value="other">{t('sectionTypes.other')}</MenuItem>
          </Field.Select>
        </Grid>
      </Grid>

      <Box sx={{ pl: { md: 2 } }}>
        <Stack spacing={3}>
          {fields.map((item, index) => (
            <PricingItemEditor
              key={item.id}
              nestIndex={sectionIndex}
              itemIndex={index}
              projectType={projectType}
              onRemove={() => remove(index)}
            />
          ))}
        </Stack>

        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddItem}
          sx={{ mt: 3 }}
        >
          {t('pricing.addItem')}
        </Button>
      </Box>
    </Card>
  );
}
