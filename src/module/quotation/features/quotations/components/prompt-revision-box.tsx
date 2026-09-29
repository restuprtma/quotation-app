import type { PromptNarrativeTarget } from '../types/prompt-first';

import { useId, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

export type PromptRevisionBoxCopy = {
  title: string;
  instruction: string;
  target: string;
  scope: string;
  timeline: string;
  narrative: string;
  preview: string;
  commercialPreview: string;
  submit: string;
  submitting: string;
  required: string;
};

type Props = {
  copy: PromptRevisionBoxCopy;
  pending: boolean;
  onSubmit: (instruction: string, target: PromptNarrativeTarget) => Promise<unknown> | unknown;
};

const targetLabels: Record<
  PromptNarrativeTarget,
  keyof Pick<PromptRevisionBoxCopy, 'scope' | 'timeline' | 'narrative'>
> = {
  scope: 'scope',
  timeline: 'timeline',
  narrative: 'narrative',
};

export function PromptRevisionBox({ copy, pending, onSubmit }: Props) {
  const instructionID = useId();
  const targetID = useId();
  const [instruction, setInstruction] = useState('');
  const [target, setTarget] = useState<PromptNarrativeTarget>('scope');
  const [error, setError] = useState('');

  const submit = async () => {
    const value = instruction.trim();
    if (!value) {
      setError(copy.required);
      return;
    }
    setError('');
    try {
      await onSubmit(value, target);
      setInstruction('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.required);
    }
  };

  return (
    <Card
      component="section"
      variant="outlined"
      sx={{ p: 2, minWidth: 0 }}
      aria-labelledby={`${instructionID}-title`}
    >
      <Stack spacing={1.5}>
        <Typography id={`${instructionID}-title`} variant="subtitle2">
          {copy.title}
        </Typography>
        <TextField
          id={instructionID}
          label={copy.instruction}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          disabled={pending}
          multiline
          minRows={2}
          error={Boolean(error)}
          aria-describedby={error ? `${instructionID}-error` : undefined}
        />
        <FormControl size="small" fullWidth disabled={pending}>
          <InputLabel id={`${targetID}-label`}>{copy.target}</InputLabel>
          <Select
            labelId={`${targetID}-label`}
            id={targetID}
            label={copy.target}
            value={target}
            onChange={(event) => setTarget(event.target.value as PromptNarrativeTarget)}
          >
            <MenuItem value="scope">{copy.scope}</MenuItem>
            <MenuItem value="timeline">{copy.timeline}</MenuItem>
            <MenuItem value="narrative">{copy.narrative}</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ color: 'text.secondary', typography: 'caption' }}>
          {copy.preview.replace('{{target}}', copy[targetLabels[target]])}
        </Box>
        <Box sx={{ color: 'text.secondary', typography: 'caption' }}>{copy.commercialPreview}</Box>
        {error && (
          <Alert id={`${instructionID}-error`} severity="error" role="alert">
            {error}
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={() => {
            void submit();
          }}
          disabled={pending}
        >
          {pending ? copy.submitting : copy.submit}
        </Button>
      </Stack>
    </Card>
  );
}
