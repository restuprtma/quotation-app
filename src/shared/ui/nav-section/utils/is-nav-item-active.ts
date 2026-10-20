import type { NavItemDataProps } from '../types';

import { isActiveLink } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

export function hasActiveDescendant(pathname: string, items?: NavItemDataProps[]): boolean {
  if (!items?.length) return false;
  return items.some((item) => isNavItemActive(pathname, item));
}

export function isNavItemActive(pathname: string, item: NavItemDataProps): boolean {
  // Quotation root item should not match rate cards or AI settings sub-routes,
  // which are distinct top-level sibling sections in the dashboard sidebar.
  if (item.path === '/quotation') {
    if (
      pathname === '/quotation/rate-cards' ||
      pathname.startsWith('/quotation/rate-cards/') ||
      pathname === '/quotation/ai-settings' ||
      pathname.startsWith('/quotation/ai-settings/')
    ) {
      return false;
    }
  }

  const deep = item.deepMatch ?? !!item.children;

  return isActiveLink(pathname, item.path, deep) || hasActiveDescendant(pathname, item.children);
}
