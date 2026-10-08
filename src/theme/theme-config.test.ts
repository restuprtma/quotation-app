import { it, expect, describe } from 'vitest';

import { themeConfig } from './theme-config';
import { defaultSettings } from '../module/core/features/settings/settings-config';

describe('theme-config', () => {
  it('should have defaultMode configured as light', () => {
    expect(themeConfig.defaultMode).toBe('light');
  });

  it('should have defaultSettings.mode configured as light', () => {
    expect(defaultSettings.mode).toBe('light');
  });
});
