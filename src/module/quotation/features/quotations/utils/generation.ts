import type { ActiveSkill } from '../types';

export const SENTINEL_SKILL_ID = '00000000-0000-0000-0000-000000000000';

export function resolveQuotationSkillId(
  selectedSkill: ActiveSkill | null | undefined,
  activeSkills: ActiveSkill[]
): string {
  if (
    selectedSkill?.id &&
    !selectedSkill.id.startsWith('cmd-') &&
    selectedSkill.id !== SENTINEL_SKILL_ID
  ) {
    return selectedSkill.id;
  }

  if (selectedSkill?.command) {
    const directMatch = activeSkills.find((s) => s.command === selectedSkill.command);
    if (directMatch) return directMatch.id;
  }

  const defaultMatch = activeSkills.find(
    (skill) => skill.command === '/quotation' || skill.command === 'quotation'
  );
  return defaultMatch?.id || activeSkills[0]?.id || SENTINEL_SKILL_ID;
}
