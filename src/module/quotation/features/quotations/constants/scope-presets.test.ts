import { describe, it, expect } from 'vitest';
import {
  SOLUTION_TYPES,
  STANDARD_DEVELOPMENT_ACTIVITIES,
  SCOPE_PRESETS_BY_SOLUTION_TYPE,
} from './scope-presets';

describe('Quotation Form Constants and Presets', () => {
  it('defines 10 distinct solution types', () => {
    expect(SOLUTION_TYPES).toHaveLength(10);
    const values = new Set(SOLUTION_TYPES.map((t) => t.value));
    expect(values.size).toBe(10);
  });

  it('defines 7 standard development activities', () => {
    expect(STANDARD_DEVELOPMENT_ACTIVITIES).toHaveLength(7);
    const ids = new Set(STANDARD_DEVELOPMENT_ACTIVITIES.map((a) => a.id));
    expect(ids.size).toBe(7);
  });

  it('defines scope presets with non-empty mandatory items for every solution type', () => {
    for (const solType of SOLUTION_TYPES) {
      const preset = SCOPE_PRESETS_BY_SOLUTION_TYPE[solType.value];
      expect(preset, `Missing preset for ${solType.value}`).toBeDefined();
      expect(preset.mandatory.length, `Empty mandatory scope for ${solType.value}`).toBeGreaterThan(0);
    }
  });
});
