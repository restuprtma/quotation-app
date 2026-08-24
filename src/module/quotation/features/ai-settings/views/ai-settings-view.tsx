import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { ProviderSettingsForm } from '../components/provider-settings-form';
import { SkillEditor } from '../components/skill-editor';
import { RateCardSelector } from '../components/rate-card-selector';
import { LegalTemplateViewer } from '../components/legal-template-viewer';
import { useGetAISkills } from '../hooks/use-ai-skills';

export const AISettingsView = () => {
  const { data: skills } = useGetAISkills();
  
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>AI Settings</Typography>
      <ProviderSettingsForm />
      
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" gutterBottom>Skills</Typography>
      {skills?.map(skill => (
        <details key={skill.id} style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Edit Skill: {skill.command}
          </summary>
          <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
            <SkillEditor skillId={skill.id} />
          </div>
        </details>
      ))}
      {(!skills || skills.length === 0) && <Typography>No skills found.</Typography>}
      
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" gutterBottom>Assets (Read-Only)</Typography>
      <RateCardSelector />
      <LegalTemplateViewer />
    </Box>
  );
};
