import React from 'react';
import { useGetAISkills, useUpdateAISkill } from '../hooks/use-ai-skills';
import { useForm, Controller } from 'react-hook-form';
import { AISkillResponse } from '../types';

export const SkillEditor = ({ skillId }: { skillId: string }) => {
  const { data: skills, isLoading } = useGetAISkills();
  const updateSkill = useUpdateAISkill();
  const skill = skills?.find(s => s.id === skillId);

  const { control, handleSubmit } = useForm<Partial<AISkillResponse>>({
    values: skill ? {
      tone: skill.tone,
      domain_vocabulary: skill.domain_vocabulary,
      content_instruction: skill.content_instruction,
      section_emphasis: skill.section_emphasis,
    } : undefined
  });

  if (isLoading) return <div>Loading Skill...</div>;
  if (!skill) return <div>Skill not found.</div>;

  const onSubmit = (data: Partial<AISkillResponse>) => {
    updateSkill.mutate({ id: skillId, data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h4>Edit Skill: {skill.command}</h4>
      <p><em>Safety rules and constraints are managed by the system and cannot be edited.</em></p>
      
      <Controller name="tone" control={control} render={({ field }) => <textarea {...field} placeholder="Tone" />} />
      <Controller name="domain_vocabulary" control={control} render={({ field }) => <textarea {...field} placeholder="Domain Vocabulary" />} />
      <Controller name="content_instruction" control={control} render={({ field }) => <textarea {...field} placeholder="Content Instruction" />} />
      <Controller name="section_emphasis" control={control} render={({ field }) => <textarea {...field} placeholder="Section Emphasis" />} />
      
      <button type="submit" disabled={updateSkill.isPending}>Update Skill</button>
    </form>
  );
};
