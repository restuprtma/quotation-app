import type { AISkillResponse } from '../types';

import React from 'react';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';

import { Box, Stack, Alert, Button, TextField, Typography } from '@mui/material';

import { useGetAISkills, useUpdateAISkill } from '../hooks/use-ai-skills';

export const SkillEditor = ({ skillId }: { skillId: string }) => {
  const { data: skills, isLoading } = useGetAISkills();
  const updateSkill = useUpdateAISkill();
  const skill = skills?.find((s) => s.id === skillId);

  const { control, handleSubmit } = useForm<Partial<AISkillResponse>>({
    values: skill
      ? {
          tone: skill.tone,
          domain_vocabulary: skill.domain_vocabulary,
          content_instruction: skill.content_instruction,
          section_emphasis: skill.section_emphasis,
        }
      : undefined,
  });

  if (isLoading || !skill)
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography color="text.secondary">Loading Skill...</Typography>
      </Box>
    );

  const onSubmit = (data: Partial<AISkillResponse>) => {
    updateSkill.mutate({ id: skillId, data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3.5}>
        <Alert
          severity="info"
          icon={<Icon icon="eva:shield-outline" width={24} />}
          sx={{ borderRadius: 1.5 }}
        >
          Safety rules and constraints are automatically managed by the system and cannot be edited.
        </Alert>

        <Box>
          <Typography
            variant="subtitle2"
            fontWeight="600"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Icon icon="eva:message-circle-outline" width={18} /> Tone
          </Typography>
          <Controller
            name="tone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                placeholder="e.g. Professional and concise"
                multiline
                minRows={2}
                fullWidth
                variant="outlined"
              />
            )}
          />
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            fontWeight="600"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Icon icon="eva:book-outline" width={18} /> Domain Vocabulary
          </Typography>
          <Controller
            name="domain_vocabulary"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                placeholder="e.g. SLA, MSA, Enterprise"
                multiline
                minRows={2}
                fullWidth
                variant="outlined"
              />
            )}
          />
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            fontWeight="600"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Icon icon="eva:clipboard-outline" width={18} /> Content Instruction
          </Typography>
          <Controller
            name="content_instruction"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                placeholder="Specific instructions for what to include..."
                multiline
                minRows={3}
                fullWidth
                variant="outlined"
              />
            )}
          />
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            fontWeight="600"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Icon icon="eva:star-outline" width={18} /> Section Emphasis
          </Typography>
          <Controller
            name="section_emphasis"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                placeholder="Which sections to highlight..."
                multiline
                minRows={2}
                fullWidth
                variant="outlined"
              />
            )}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={updateSkill.isPending}
            startIcon={<Icon icon="eva:save-outline" />}
            disableElevation
          >
            Update Skill
          </Button>
        </Box>
      </Stack>
    </form>
  );
};
