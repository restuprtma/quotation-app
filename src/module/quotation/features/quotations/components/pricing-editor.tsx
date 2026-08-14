import type { ProjectType, PricingSection } from '../types';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { PricingSectionEditor } from './pricing-section-editor';

type Props = {
  projectType: ProjectType;
};

export function PricingEditor({ projectType }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sections',
  });

  const allSections = useWatch({
    control,
    name: 'sections',
  }) as PricingSection[] | undefined;

  let oneTimeTotal = 0;
  let recurringTotal = 0;

  if (allSections) {
    allSections.forEach((section) => {
      section.items?.forEach((item) => {
        let lineTotal = 0;
        if (item.pricing_mode === 'unit') {
          lineTotal = (item.unit_price || 0) * (item.quantity || 0);
        } else if (item.pricing_mode === 'resource') {
          lineTotal = (item.unit_price || 0) * (item.employee_count || 0) * (item.duration || 0);
        } else {
          lineTotal = item.unit_price || 0;
        }

        if (item.billing_period === 'one_time') {
          oneTimeTotal += lineTotal;
        } else {
          recurringTotal += lineTotal;
        }
      });
    });
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);

  const handleAddSection = () => {
    append({
      section_name: '',
      section_type: projectType === 'product_based' ? 'package' : 'phase',
      sort_order: fields.length,
      items: [],
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      {fields.map((section, index) => (
        <PricingSectionEditor
          key={section.id}
          sectionIndex={index}
          projectType={projectType}
          onRemove={() => remove(index)}
        />
      ))}

      <Button
        variant="contained"
        color="inherit"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={handleAddSection}
        sx={{ mb: 4 }}
      >
        {t('pricing.addSection')}
      </Button>

      {fields.length > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="flex-end"
          sx={{ pt: 3, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}
        >
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('pricing.oneTimeTotal')}
            </Typography>
            <Typography variant="h6">{formatCurrency(oneTimeTotal)}</Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('pricing.recurringTotal')}
            </Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(recurringTotal)}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
