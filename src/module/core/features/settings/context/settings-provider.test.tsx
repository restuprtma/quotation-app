// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { it, expect, describe, beforeEach } from 'vitest';

import { themeConfig } from 'src/theme/theme-config';

import { SettingsProvider } from './settings-provider';
import { useSettingsContext } from './use-settings-context';
import { defaultSettings, SETTINGS_STORAGE_KEY } from '../settings-config';

function ConsumerComponent() {
  const { state } = useSettingsContext();
  return <div data-testid="mode-display">{state.mode}</div>;
}

describe('SettingsProvider version mismatch purge', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('purges legacy theme-mode and resets to default when stored version is outdated', () => {
    // Seed outdated settings and legacy dark mode in localStorage
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...defaultSettings,
        mode: 'dark',
        version: '7.6.1', // Old version
      })
    );
    localStorage.setItem(themeConfig.modeStorageKey, 'dark');

    render(
      <SettingsProvider defaultSettings={{ ...defaultSettings, version: '7.6.2', mode: 'light' }}>
        <ConsumerComponent />
      </SettingsProvider>
    );

    // Stored theme-mode must be removed
    expect(localStorage.getItem(themeConfig.modeStorageKey)).toBeNull();
    // Mode must be reset to light
    expect(screen.getByTestId('mode-display').textContent).toBe('light');
  });
});
