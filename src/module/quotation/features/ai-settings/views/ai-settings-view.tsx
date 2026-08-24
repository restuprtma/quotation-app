import React from 'react';
import { ProviderSettingsForm } from '../components/provider-settings-form';
import { SkillEditor } from '../components/skill-editor';
import { RateCardSelector } from '../components/rate-card-selector';
import { LegalTemplateViewer } from '../components/legal-template-viewer';
import { useGetAISkills } from '../hooks/use-ai-skills';

export const AISettingsView = () => {
  const { data: skills } = useGetAISkills();
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>AI Settings</h2>
      <ProviderSettingsForm />
      
      <hr style={{ margin: '2rem 0' }} />
      <h3>Skills</h3>
      {skills?.map(skill => (
        <div key={skill.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <SkillEditor skillId={skill.id} />
        </div>
      ))}
      {(!skills || skills.length === 0) && <p>No skills found.</p>}
      
      <hr style={{ margin: '2rem 0' }} />
      <h3>Assets (Read-Only)</h3>
      <RateCardSelector />
      <LegalTemplateViewer />
    </div>
  );
};
