import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import TableHeader from '@tiptap/extension-table-header';
import { Mark, Node, Extension, mergeAttributes } from '@tiptap/core';

const MARKER_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const SECTION_NUMBER_PATTERN = /^[1-9][0-9]{0,2}$/;
const COLUMN_WIDTH_PATTERN = /^(25|75)$/;

function readMarker(element: HTMLElement, name: string, pattern = MARKER_PATTERN): string | null {
  const value = element.getAttribute(name);
  return value && pattern.test(value) ? value : null;
}

function renderMarker(
  attributes: Record<string, unknown>,
  name: string,
  pattern = MARKER_PATTERN
): Record<string, string> {
  const value = attributes[name];
  return typeof value === 'string' && pattern.test(value) ? { [name]: value } : {};
}

/**
 * Preserves the server's section markers as real block nodes. StarterKit does
 * not know about section/header elements, so without this node those wrappers
 * are flattened and their data attributes disappear on the first save.
 */
export const QuotationSectionExtension = Node.create({
  name: 'quotationSection',

  group: 'block',

  content: 'block+',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      'data-block-type': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-block-type'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-block-type'),
      },
      'data-section-number': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-section-number', SECTION_NUMBER_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-section-number', SECTION_NUMBER_PATTERN),
      },
      'data-template-code': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-template-code'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-template-code'),
      },
      'data-modified': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-modified', /^(true|false)$/),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-modified', /^(true|false)$/),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'section[data-block-type]', priority: 50 },
      { tag: 'header[data-block-type]', priority: 50 },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['section', HTMLAttributes, 0];
  },
});

/** Preserves data-field markers on metadata paragraphs and exclusion lists. */
export const QuotationFieldAttributesExtension = Extension.create({
  name: 'quotationFieldAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'orderedList', 'bulletList', 'listItem'],
        attributes: {
          'data-field': {
            default: null,
            parseHTML: (element: HTMLElement) => readMarker(element, 'data-field'),
            renderHTML: (attributes: Record<string, unknown>) =>
              renderMarker(attributes, 'data-field'),
          },
        },
      },
    ];
  },
});

/** Keeps inline data-field markers (for example quotation_number) intact. */
export const QuotationFieldMark = Mark.create({
  name: 'quotationField',

  inclusive: false,

  addAttributes() {
    return {
      'data-field': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-field'),
        renderHTML: (attributes: Record<string, unknown>) => renderMarker(attributes, 'data-field'),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-field]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

/** Safe table attributes used by the official quotation template. */
export const QuotationTableExtension = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('class') === 'signature-table' ? 'signature-table' : null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.class === 'signature-table' ? { class: 'signature-table' } : {},
      },
    };
  },
});

/** Retains the role/field markers that identify official rows. */
export const QuotationTableRowExtension = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-role': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-role'),
        renderHTML: (attributes: Record<string, unknown>) => renderMarker(attributes, 'data-role'),
      },
      'data-field': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-field'),
        renderHTML: (attributes: Record<string, unknown>) => renderMarker(attributes, 'data-field'),
      },
    };
  },
});

function addQuotationCellAttributes<T extends typeof TableCell | typeof TableHeader>(
  extension: T
): T {
  return extension.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        // Tiptap's table-cell base extension reads text-align from inline
        // styles. Official HTML keeps layout in dedicated CSS, so only the
        // legacy semantic `align` attribute is accepted and no style is
        // serialized back to the server.
        align: {
          default: null,
          parseHTML: (element: HTMLElement) => {
            const value = element.getAttribute('align')?.toLowerCase();
            return value === 'left' || value === 'center' || value === 'right' ? value : null;
          },
          renderHTML: () => ({}),
        },
        'data-column-width': {
          default: null,
          parseHTML: (element: HTMLElement) =>
            readMarker(element, 'data-column-width', COLUMN_WIDTH_PATTERN),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-column-width', COLUMN_WIDTH_PATTERN),
        },
        'data-field': {
          default: null,
          parseHTML: (element: HTMLElement) => readMarker(element, 'data-field'),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-field'),
        },
      };
    },
  }) as T;
}

export const QuotationTableCellExtension = addQuotationCellAttributes(TableCell);
export const QuotationTableHeaderExtension = addQuotationCellAttributes(TableHeader);

export interface LegalBlockOptions {
  unlocked: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    legalBlock: {
      setLegalUnlocked: (unlocked: boolean) => ReturnType;
    };
  }
}

export const LegalBlockPluginKey = new PluginKey('legalBlockLock');

export const LegalBlockExtension = Node.create<LegalBlockOptions>({
  name: 'legalBlock',

  group: 'block',

  content: 'block+',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      unlocked: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-block-type': {
        default: 'legal',
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-block-type') || 'legal',
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-block-type'),
      },
      'data-template-code': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-template-code'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-template-code'),
      },
      'data-modified': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-modified', /^(true|false)$/),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-modified', /^(true|false)$/),
      },
      'data-section-number': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-section-number', SECTION_NUMBER_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-section-number', SECTION_NUMBER_PATTERN),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-block-type="legal"]',
        priority: 60,
      },
      {
        tag: 'div[data-block-type="legal"]',
        priority: 60,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'section',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-block-type': 'legal',
        class: `qtr-legal-block ${this.options.unlocked ? 'qtr-legal-unlocked' : 'qtr-legal-locked'}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setLegalUnlocked:
        (unlocked: boolean) =>
        ({ tr, dispatch }) => {
          this.options.unlocked = unlocked;
          if (dispatch) {
            tr.setMeta(LegalBlockPluginKey, { unlocked });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: LegalBlockPluginKey,
        filterTransaction: (tr, state) => {
          // If extension option is unlocked, permit all transactions
          if (this.options.unlocked) {
            return true;
          }

          // If transaction does not change document content, permit (selection, cursor, meta)
          if (!tr.docChanged) {
            return true;
          }

          // Check if transaction has meta override
          const meta = tr.getMeta(LegalBlockPluginKey);
          if (meta?.unlocked) {
            return true;
          }

          // Find all legal block ranges in current document
          const legalRanges: Array<{ from: number; to: number }> = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              legalRanges.push({ from: pos, to: pos + node.nodeSize });
            }
          });

          if (legalRanges.length === 0) {
            return true;
          }

          // Check if any step touches any legal block range
          let touchesLegal = false;
          tr.steps.forEach((step) => {
            const stepMap = step.getMap();
            stepMap.forEach((oldStart, oldEnd) => {
              for (const range of legalRanges) {
                if (oldStart <= range.to && oldEnd >= range.from) {
                  touchesLegal = true;
                  break;
                }
              }
            });
          });

          return !touchesLegal;
        },
      }),
    ];
  },
});
