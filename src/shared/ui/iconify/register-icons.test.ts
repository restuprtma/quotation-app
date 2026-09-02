import { getIcon } from '@iconify/react';
import { it, expect, describe, beforeAll } from 'vitest';

import { registerIcons } from './register-icons';

describe('registerIcons', () => {
  beforeAll(() => {
    registerIcons();
  });

  it('registers solar icons with a 24x24 viewBox', () => {
    const icon = getIcon('solar:text-bold');
    expect(icon).toBeTruthy();
    expect(icon?.width).toBe(24);
    expect(icon?.height).toBe(24);
  });

  it('registers carbon icons with a 32x32 viewBox', () => {
    const icon = getIcon('carbon:menu');
    expect(icon?.width).toBe(32);
    expect(icon?.height).toBe(32);
  });

  it('registers phosphor icons with a 256x256 viewBox', () => {
    const icon = getIcon('ph:table-bold');
    expect(icon).toBeTruthy();
    expect(icon?.width).toBe(256);
    expect(icon?.height).toBe(256);
  });

  it.skip('registers mdi icons with a 24x24 viewBox (unskipped in Task 2)', () => {
    const icon = getIcon('mdi:table-row-plus-after');
    expect(icon).toBeTruthy();
    expect(icon?.width).toBe(24);
    expect(icon?.height).toBe(24);
  });
});
