import { it, expect, describe } from 'vitest';

import { allIconNames } from 'src/shared/ui/iconify';

import { EDITOR_ICONS } from './editor-icons';

describe('EDITOR_ICONS', () => {
  it('only references icons registered in the offline registry', () => {
    const unregistered = Object.entries(EDITOR_ICONS)
      .filter(([, iconName]) => !allIconNames.includes(iconName))
      .map(([key, iconName]) => `${key} -> ${iconName}`);

    expect(unregistered).toEqual([]);
  });

  it('has no duplicate icon names across distinct actions', () => {
    const rowActions = [
      EDITOR_ICONS.addRowBefore,
      EDITOR_ICONS.addRowAfter,
      EDITOR_ICONS.deleteRow,
    ];
    const columnActions = [
      EDITOR_ICONS.addColumnBefore,
      EDITOR_ICONS.addColumnAfter,
      EDITOR_ICONS.deleteColumn,
    ];
    const headerToggles = [
      EDITOR_ICONS.toggleHeaderRow,
      EDITOR_ICONS.toggleHeaderColumn,
      EDITOR_ICONS.toggleHeaderCell,
    ];

    expect(new Set(rowActions).size).toBe(rowActions.length);
    expect(new Set(columnActions).size).toBe(columnActions.length);
    expect(new Set(headerToggles).size).toBe(headerToggles.length);
  });
});
