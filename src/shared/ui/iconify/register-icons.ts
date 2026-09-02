import type { IconifyJSON } from '@iconify/react';

import { addCollection } from '@iconify/react';

import allIcons from './icon-sets';

// ----------------------------------------------------------------------

export const iconSets = Object.entries(allIcons).reduce((acc, [key, value]) => {
  const [prefix, iconName] = key.split(':');
  const existingPrefix = acc.find((item) => item.prefix === prefix);

  if (existingPrefix) {
    existingPrefix.icons[iconName] = value;
  } else {
    acc.push({
      prefix,
      icons: {
        [iconName]: value,
      },
    });
  }

  return acc;
}, [] as IconifyJSON[]);

export const allIconNames = Object.keys(allIcons) as IconifyName[];

export type IconifyName = keyof typeof allIcons;

// ----------------------------------------------------------------------

/**
 * Native viewBox size per icon collection. Icon bodies are authored against the
 * collection's own grid - Phosphor uses 256, Carbon uses 32, most others use 24.
 * Rendering a 256-grid body inside a 24 viewBox only shows its top-left corner,
 * which reads as a blank icon.
 */
const PREFIX_VIEW_BOX_SIZE: Record<string, number> = {
  carbon: 32,
  ph: 256,
};

const DEFAULT_VIEW_BOX_SIZE = 24;

let areIconsRegistered = false;

export function registerIcons() {
  if (areIconsRegistered) {
    return;
  }

  iconSets.forEach((iconSet) => {
    const size = PREFIX_VIEW_BOX_SIZE[iconSet.prefix] ?? DEFAULT_VIEW_BOX_SIZE;

    addCollection({ ...iconSet, width: size, height: size });
  });

  areIconsRegistered = true;
}
