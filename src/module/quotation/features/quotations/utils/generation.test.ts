import type { ActiveSkill } from '../types';

import { it, expect, describe } from 'vitest';

import { SENTINEL_SKILL_ID, resolveQuotationSkillId } from './generation';

describe('resolveQuotationSkillId', () => {
  const persistedSkill: ActiveSkill = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Persisted Skill',
    command: '/persisted',
    is_active: true,
  };

  const quotationSkill: ActiveSkill = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Quotation Master',
    command: '/quotation',
    is_active: true,
  };

  const otherSkill: ActiveSkill = {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Other Skill',
    command: '/other',
    is_active: true,
  };

  it('resolves selected persisted UUID when valid', () => {
    const result = resolveQuotationSkillId(persistedSkill, [quotationSkill]);
    expect(result).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('resolves active skill by matching /quotation command when selected has temporary cmd id', () => {
    const selected: ActiveSkill = {
      id: 'cmd-quotation',
      name: 'Temp Quotation',
      command: '/quotation',
      is_active: true,
    };
    const result = resolveQuotationSkillId(selected, [otherSkill, quotationSkill]);
    expect(result).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('resolves active skill matching /quotation command when selected is null', () => {
    const result = resolveQuotationSkillId(null, [otherSkill, quotationSkill]);
    expect(result).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('falls back to the first active skill when no command matches', () => {
    const selected: ActiveSkill = {
      id: 'cmd-unknown',
      name: 'Unknown',
      command: '/unknown',
      is_active: true,
    };
    const result = resolveQuotationSkillId(selected, [persistedSkill, otherSkill]);
    expect(result).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('falls back to sentinel UUID when active skills list is empty', () => {
    const result = resolveQuotationSkillId(null, []);
    expect(result).toBe(SENTINEL_SKILL_ID);
    expect(result).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('falls back to sentinel UUID when selected skill is sentinel and active skills list is empty', () => {
    const selected: ActiveSkill = {
      id: SENTINEL_SKILL_ID,
      name: 'Sentinel',
      command: '/quotation',
      is_active: false,
    };
    const result = resolveQuotationSkillId(selected, []);
    expect(result).toBe(SENTINEL_SKILL_ID);
  });
});
