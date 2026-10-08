// @vitest-environment happy-dom

import { render } from '@testing-library/react';
import { it, expect, describe, beforeEach } from 'vitest';

import { SettingsContext } from 'src/module/core/features/settings/context/settings-context';

import { PublicThemeScope } from './public-theme-scope';

describe('PublicThemeScope', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-color-scheme', 'dark');
  });

  it('enforces light color scheme on mount and restores previous mode on unmount', () => {
    const mockSettingsContext: any = {
      state: { mode: 'dark' },
    };

    const { unmount } = render(
      <SettingsContext.Provider value={mockSettingsContext}>
        <PublicThemeScope>
          <div>Public Document Content</div>
        </PublicThemeScope>
      </SettingsContext.Provider>
    );

    // Document root must be forced to light
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light');

    // On unmount, must restore settings mode ('dark')
    unmount();
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
  });
});
