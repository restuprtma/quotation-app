import type { TalentOutsourcingFormValues } from './talent-outsourcing-form-model';

import { useFieldArray, useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { RHFTextField } from 'src/shared/ui/hook-form';

export function TalentScopeEditor({ disabled = false }: { disabled?: boolean }) {
  const { control } = useFormContext<TalentOutsourcingFormValues>();
  const fields = useFieldArray({ control, name: 'talent_outsourcing.scope_blocks' });
  return (
    <Stack spacing={1}>
      <Typography variant="h6">Lingkup pekerjaan & timeline</Typography>
      {fields.fields.map((field, index) => (
        <Accordion key={field.id} defaultExpanded>
          <AccordionSummary>Scope {index + 1}</AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <RHFTextField
                name={`talent_outsourcing.scope_blocks.${index}.title`}
                label="Judul"
                disabled={disabled}
              />
              <RHFTextField
                name={`talent_outsourcing.scope_blocks.${index}.description`}
                label="Deskripsi"
                multiline
                minRows={4}
                helperText="Maksimum 20.000 karakter"
                disabled={disabled}
              />
              <RHFTextField
                name={`talent_outsourcing.scope_blocks.${index}.timeline`}
                label="Timeline"
                disabled={disabled}
              />
              <RHFTextField
                name={`talent_outsourcing.scope_blocks.${index}.responsibilities.0`}
                label="Tanggung jawab"
                disabled={disabled}
              />
              <RHFTextField
                name={`talent_outsourcing.scope_blocks.${index}.qualifications.0`}
                label="Kualifikasi"
                disabled={disabled}
              />
              <RHFTextField
                name={`talent_outsourcing.scope_blocks.${index}.deliverables.0`}
                label="Deliverable"
                disabled={disabled}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
      <Button
        variant="outlined"
        sx={{ minHeight: 44, alignSelf: 'start' }}
        onClick={() =>
          fields.append({
            title: '',
            description: '',
            responsibilities: [],
            qualifications: [],
            deliverables: [],
            timeline: '',
          })
        }
        disabled={disabled}
      >
        Tambah scope
      </Button>
    </Stack>
  );
}
