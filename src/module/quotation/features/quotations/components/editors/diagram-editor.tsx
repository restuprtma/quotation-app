import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/shared/ui/iconify';
import { Field } from 'src/shared/ui/hook-form';

export function DiagramEditor() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'blueprint_data.diagrams',
  });

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Diagrams</Typography>
      
      <Stack spacing={3}>
        {fields.map((field, index) => (
          <Card key={field.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Diagram {index + 1}</Typography>
              <IconButton color="error" size="small" onClick={() => remove(index)}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
            
            <Stack spacing={2}>
              <Field.Select name={`blueprint_data.diagrams.${index}.type`} label="Diagram Type">
                <MenuItem value="journey">Journey</MenuItem>
                <MenuItem value="architecture">Architecture</MenuItem>
                <MenuItem value="state_machine">State Machine</MenuItem>
                <MenuItem value="workflow">Workflow</MenuItem>
                <MenuItem value="timeline">Timeline</MenuItem>
                <MenuItem value="comparison">Comparison</MenuItem>
              </Field.Select>

              <Field.Text name={`blueprint_data.diagrams.${index}.title`} label="Title" />
              <Field.Text name={`blueprint_data.diagrams.${index}.description`} label="Description" multiline rows={2} />
              
              {/* For now, just a raw JSON editor for the nested data since full visual builders for 6 diagram types is huge */}
              <Typography variant="caption" color="text.secondary">
                For detailed node/edge editing, switch to raw data mode or use the AI generator.
              </Typography>
            </Stack>
          </Card>
        ))}
      </Stack>

      <Button
        size="small"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => append({ type: 'workflow', title: 'New Diagram' })}
        sx={{ mt: 2 }}
      >
        Add Diagram
      </Button>
    </Box>
  );
}
