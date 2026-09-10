import type { TalentOutsourcingFormValues } from './talent-outsourcing-form-model';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RHFTextField, RHFNumericField } from 'src/shared/ui/hook-form';

export function TalentCostEditor({ disabled = false }: { disabled?: boolean }) {
  const { control } = useFormContext<TalentOutsourcingFormValues>();
  const mode = useWatch({ control, name: 'talent_outsourcing.engagement_mode' });
  const groups = useFieldArray({ control, name: 'talent_outsourcing.cost_groups' as never });
  const squad = useFieldArray({ control, name: 'talent_outsourcing.squad_items' as never });
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Biaya personel</Typography>
      {mode === 'manpower_supply' ? (
        <>
          {groups.fields.map((group: any, gi) => (
            <Stack key={group.id} spacing={1}>
              <Typography fontWeight={700}>
                {gi ? 'Biaya Langsung Non Personil' : 'Biaya Langsung Personil'}
              </Typography>
              <RHFTextField
                name={`talent_outsourcing.cost_groups.${gi}.title`}
                label="Judul kelompok"
                disabled={disabled}
              />
              {(group.items || []).map((item: any, ii: number) => (
                <Stack key={item.id || ii} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <RHFTextField
                    name={`talent_outsourcing.cost_groups.${gi}.items.${ii}.name`}
                    label="Nama"
                    disabled={disabled}
                  />
                  <RHFNumericField
                    name={`talent_outsourcing.cost_groups.${gi}.items.${ii}.quantity`}
                    label="Jumlah"
                    disabled={disabled}
                  />
                  <RHFTextField
                    name={`talent_outsourcing.cost_groups.${gi}.items.${ii}.quantity_unit`}
                    label="Unit"
                    disabled={disabled}
                  />
                  <RHFNumericField
                    name={`talent_outsourcing.cost_groups.${gi}.items.${ii}.period_count`}
                    label="Periode"
                    disabled={disabled}
                  />
                  <RHFTextField
                    name={`talent_outsourcing.cost_groups.${gi}.items.${ii}.period_unit`}
                    label="Satuan periode"
                    disabled={disabled}
                  />
                  <RHFNumericField
                    name={`talent_outsourcing.cost_groups.${gi}.items.${ii}.unit_rate`}
                    label="Tarif IDR"
                    disabled={disabled}
                  />
                </Stack>
              ))}
            </Stack>
          ))}
          <Button
            variant="outlined"
            sx={{ minHeight: 44, alignSelf: 'start' }}
            onClick={() =>
              groups.append({
                category: 'non_personnel',
                title: 'Biaya Langsung Non Personil',
                items: [],
              } as never)
            }
            disabled={disabled || groups.fields.length >= 2}
          >
            Biaya Non Personil
          </Button>
        </>
      ) : (
        <>
          {squad.fields.map((row: any, index) => (
            <Stack key={row.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <RHFTextField
                name={`talent_outsourcing.squad_items.${index}.role`}
                label="Peran"
                disabled={disabled}
              />
              <RHFNumericField
                name={`talent_outsourcing.squad_items.${index}.monthly_rate`}
                label="Tarif bulanan"
                disabled={disabled}
              />
              <RHFNumericField
                name={`talent_outsourcing.squad_items.${index}.headcount`}
                label="Personel"
                disabled={disabled}
              />
              <RHFNumericField
                name={`talent_outsourcing.squad_items.${index}.period_months`}
                label="Bulan"
                disabled={disabled}
              />
            </Stack>
          ))}
          <Button
            variant="outlined"
            sx={{ minHeight: 44, alignSelf: 'start' }}
            onClick={() =>
              squad.append({ role: '', monthly_rate: 0, headcount: 1, period_months: 1 } as never)
            }
            disabled={disabled}
          >
            Personil
          </Button>
        </>
      )}
    </Stack>
  );
}
