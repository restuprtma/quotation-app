import type { IconifyName } from 'src/shared/ui/iconify';

/**
 * Every icon the quotation editor renders, in one typed place.
 *
 * `satisfies Record<string, IconifyName>` makes the typechecker reject any name
 * that is not registered in `src/shared/ui/iconify/icon-sets.ts`, which is what
 * stops unregistered names from silently rendering as blank icons that only show
 * their tooltip on hover.
 */
export const EDITOR_ICONS = {
  // history
  undo: 'solar:undo-left-round-bold',
  redo: 'solar:undo-right-round-bold',
  // block type
  paragraph: 'mdi:format-paragraph',
  heading1: 'mdi:format-header-1',
  heading2: 'mdi:format-header-2',
  heading3: 'mdi:format-header-3',
  // inline marks
  bold: 'solar:text-bold',
  italic: 'solar:text-italic-bold',
  underline: 'solar:text-underline-bold',
  strike: 'solar:text-cross-bold',
  // alignment
  alignLeft: 'ic:round-format-align-left',
  alignCenter: 'ic:round-format-align-center',
  alignRight: 'ic:round-format-align-right',
  alignJustify: 'ic:round-format-align-justify',
  // lists and blocks
  bulletList: 'mdi:format-list-bulleted',
  orderedList: 'mdi:format-list-numbered',
  link: 'solar:link-bold',
  horizontalRule: 'mdi:minus',
  clearFormatting: 'mdi:format-clear',
  // table
  insertTable: 'mdi:table-plus',
  deleteTable: 'mdi:table-remove',
  addRowBefore: 'mdi:table-row-plus-before',
  addRowAfter: 'mdi:table-row-plus-after',
  deleteRow: 'mdi:table-row-remove',
  addColumnBefore: 'mdi:table-column-plus-before',
  addColumnAfter: 'mdi:table-column-plus-after',
  deleteColumn: 'mdi:table-column-remove',
  mergeCells: 'mdi:table-merge-cells',
  splitCell: 'mdi:table-split-cell',
  toggleHeaderRow: 'mdi:table-row',
  toggleHeaderColumn: 'mdi:table-column',
  toggleHeaderCell: 'mdi:table-headers-eye',
  // grips
  gripAdd: 'mdi:plus',
  gripRemove: 'mdi:minus',
  // legal block
  legalLocked: 'solar:lock-keyhole-bold',
  legalUnlocked: 'solar:lock-unlocked-bold',
  restoreTemplate: 'solar:restart-bold',
} as const satisfies Record<string, IconifyName>;

export type EditorIconKey = keyof typeof EDITOR_ICONS;
