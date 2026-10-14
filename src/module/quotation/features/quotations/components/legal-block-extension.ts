import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import ListItem from '@tiptap/extension-list-item';
import TableCell from '@tiptap/extension-table-cell';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import TableHeader from '@tiptap/extension-table-header';
import { Mark, Node, Extension, mergeAttributes } from '@tiptap/core';

const MARKER_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const FIELD_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,127}$/i;
const SECTION_NUMBER_PATTERN = /^[1-9][0-9]{0,2}$/;
const COLUMN_WIDTH_PATTERN = /^(25|75)$/;
const INDEX_PATTERN = /^(0|[1-9][0-9]{0,5})$/;
const MONEY_VALUE_PATTERN = /^(0|[1-9][0-9]{0,14})$/;
const CLOUD_INDEX_PATTERN = /^(0|[1-9][0-9]{0,5})$/;
const CLOUD_FIELD_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,127}$/i;
const CLOUD_COMPONENT_PATTERN = /^(setup|monthly_service)$/;
const SECTION_VERSION_PATTERN = /^[1-9][0-9]{0,2}$/;
const MANAGED_PATTERN = /^true$/;

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
      'data-quotation-section': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-section'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-section'),
      },
      'data-section-version': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-section-version', SECTION_VERSION_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-section-version', SECTION_VERSION_PATTERN),
      },
      'data-managed': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-managed', MANAGED_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-managed', MANAGED_PATTERN),
      },
      'data-quotation-section-number': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-quotation-section-number', SECTION_NUMBER_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-section-number', SECTION_NUMBER_PATTERN),
      },
      'data-quotation-component': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-component'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-component'),
      },
      'data-template-code': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-template-code'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-template-code'),
      },
      // Talent Outsourcing documents use this to bind a rendered section to
      // the approved profile. It is deliberately a marker, not a catch-all
      // data-* escape hatch.
      'data-section-code': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-section-code'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-section-code'),
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
      { tag: 'section[data-quotation-section]', priority: 50 },
      { tag: 'header[data-quotation-section]', priority: 50 },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['section', HTMLAttributes, 0];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ManagedCommercialPluginKey,
        filterTransaction: (tr, state) => {
          if (!tr.docChanged || tr.getMeta('preventUpdate')) return true;
          const managedRanges: Array<{ from: number; to: number }> = [];
          state.doc.descendants((node, pos) => {
            if (node.attrs?.['data-managed'] === 'true') {
              managedRanges.push({ from: pos, to: pos + node.nodeSize });
            }
          });
          if (managedRanges.length === 0) return true;
          let touchesManaged = false;
          tr.steps.forEach((step) => {
            step.getMap().forEach((oldStart, oldEnd) => {
              if (managedRanges.some((range) => oldStart <= range.to && oldEnd >= range.from)) {
                touchesManaged = true;
              }
            });
          });
          return !touchesManaged;
        },
      }),
    ];
  },
});

/** Preserves data-field markers on metadata paragraphs and exclusion lists. */
export const QuotationFieldAttributesExtension = Extension.create({
  name: 'quotationFieldAttributes',

  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'orderedList',
          'bulletList',
          'listItem',
          'tableCell',
          'tableHeader',
        ],
        attributes: {
          'data-field': {
            default: null,
            parseHTML: (element: HTMLElement) => readMarker(element, 'data-field', FIELD_PATTERN),
            renderHTML: (attributes: Record<string, unknown>) =>
              renderMarker(attributes, 'data-field', FIELD_PATTERN),
          },
          'data-quotation-field': {
            default: null,
            parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-field'),
            renderHTML: (attributes: Record<string, unknown>) =>
              renderMarker(attributes, 'data-quotation-field'),
          },
          'data-quotation-component': {
            default: null,
            parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-component'),
            renderHTML: (attributes: Record<string, unknown>) =>
              renderMarker(attributes, 'data-quotation-component'),
          },
          'data-cloud-field': {
            default: null,
            parseHTML: (element: HTMLElement) =>
              readMarker(element, 'data-cloud-field', CLOUD_FIELD_PATTERN),
            renderHTML: (attributes: Record<string, unknown>) =>
              renderMarker(attributes, 'data-cloud-field', CLOUD_FIELD_PATTERN),
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
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-field', FIELD_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-field', FIELD_PATTERN),
      },
      'data-quotation-field': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-field'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-field'),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-field]' }, { tag: 'span[data-quotation-field]' }];
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
      'data-role': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-role'),
        renderHTML: (attributes: Record<string, unknown>) => renderMarker(attributes, 'data-role'),
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
      'data-component': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-component'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-component'),
      },
      'data-quotation-component': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-component'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-component'),
      },
      'data-payment-index': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-payment-index', /^[0-9]+$/),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-payment-index', /^[0-9]+$/),
      },
      'data-group-index': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-group-index', INDEX_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-group-index', INDEX_PATTERN),
      },
      'data-row-index': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-row-index', INDEX_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-row-index', INDEX_PATTERN),
      },
      'data-cloud-total-row': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-cloud-total-row'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-cloud-total-row'),
      },
      'data-cloud-setup-row': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-cloud-setup-row', CLOUD_INDEX_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-cloud-setup-row', CLOUD_INDEX_PATTERN),
      },
      'data-cloud-package-row': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-cloud-package-row', CLOUD_INDEX_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-cloud-package-row', CLOUD_INDEX_PATTERN),
      },
      'data-cloud-scope-row': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-cloud-scope-row', CLOUD_INDEX_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-cloud-scope-row', CLOUD_INDEX_PATTERN),
      },
      'data-cloud-payment-row': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-cloud-payment-row', CLOUD_INDEX_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-cloud-payment-row', CLOUD_INDEX_PATTERN),
      },
      'data-cloud-payment-component': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-cloud-payment-component', CLOUD_COMPONENT_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-cloud-payment-component', CLOUD_COMPONENT_PATTERN),
      },
    };
  },
});

/** Retains approved limitation identifiers on list items. */
export const QuotationListItemExtension = ListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-limitation-code': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-limitation-code'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-limitation-code'),
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
          parseHTML: (element: HTMLElement) => readMarker(element, 'data-field', FIELD_PATTERN),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-field', FIELD_PATTERN),
        },
        'data-quotation-field': {
          default: null,
          parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-field'),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-quotation-field'),
        },
        // Renderer-generated Talent monetary cells pair their whitelisted
        // data-field with an integer source-of-truth value.
        'data-value': {
          default: null,
          parseHTML: (element: HTMLElement) =>
            readMarker(element, 'data-value', MONEY_VALUE_PATTERN),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-value', MONEY_VALUE_PATTERN),
        },
        'data-cloud-package-field': {
          default: null,
          parseHTML: (element: HTMLElement) =>
            readMarker(element, 'data-cloud-package-field', CLOUD_FIELD_PATTERN),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-cloud-package-field', CLOUD_FIELD_PATTERN),
        },
        'data-cloud-field': {
          default: null,
          parseHTML: (element: HTMLElement) =>
            readMarker(element, 'data-cloud-field', CLOUD_FIELD_PATTERN),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-cloud-field', CLOUD_FIELD_PATTERN),
        },
        'data-cloud-scope-field': {
          default: null,
          parseHTML: (element: HTMLElement) =>
            readMarker(element, 'data-cloud-scope-field', CLOUD_FIELD_PATTERN),
          renderHTML: (attributes: Record<string, unknown>) =>
            renderMarker(attributes, 'data-cloud-scope-field', CLOUD_FIELD_PATTERN),
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
export const ManagedCommercialPluginKey = new PluginKey('managedCommercialLock');

export interface LegalBlockStorage {
  unlocked: boolean;
}

export const LegalBlockExtension = Node.create<LegalBlockOptions, LegalBlockStorage>({
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

  addStorage() {
    return {
      unlocked: this.options.unlocked ?? false,
    };
  },

  onCreate() {
    if (this.storage && this.options.unlocked !== undefined) {
      this.storage.unlocked = this.options.unlocked;
    }
  },

  addAttributes() {
    return {
      'data-block-type': {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const bt = readMarker(element, 'data-block-type');
          if (bt) return bt;
          if (element.hasAttribute('data-quotation-section')) {
            return null;
          }
          return 'legal';
        },
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-block-type'),
      },
      'data-quotation-section': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-quotation-section'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-section'),
      },
      'data-quotation-section-number': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-quotation-section-number', SECTION_NUMBER_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-quotation-section-number', SECTION_NUMBER_PATTERN),
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
      'data-section-code': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-section-code'),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-section-code'),
      },
      'data-section-version': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          readMarker(element, 'data-section-version', SECTION_VERSION_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-section-version', SECTION_VERSION_PATTERN),
      },
      'data-managed': {
        default: null,
        parseHTML: (element: HTMLElement) => readMarker(element, 'data-managed', MANAGED_PATTERN),
        renderHTML: (attributes: Record<string, unknown>) =>
          renderMarker(attributes, 'data-managed', MANAGED_PATTERN),
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
      {
        tag: 'section[data-block-type="rights"]',
        priority: 60,
      },
      {
        tag: 'div[data-block-type="rights"]',
        priority: 60,
      },
      {
        tag: 'section[data-block-type="limitations"]',
        priority: 60,
      },
      {
        tag: 'div[data-block-type="limitations"]',
        priority: 60,
      },
      {
        tag: 'section[data-quotation-section="legal"]',
        priority: 60,
      },
      {
        tag: 'div[data-quotation-section="legal"]',
        priority: 60,
      },
      {
        tag: 'section[data-quotation-section="rights"]',
        priority: 60,
      },
      {
        tag: 'div[data-quotation-section="rights"]',
        priority: 60,
      },
      {
        tag: 'section[data-quotation-section="limitations"]',
        priority: 60,
      },
      {
        tag: 'div[data-quotation-section="limitations"]',
        priority: 60,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const extraAttrs: Record<string, string> = {
      class: `qtr-legal-block ${this.options.unlocked ? 'qtr-legal-unlocked' : 'qtr-legal-locked'}`,
    };
    if (HTMLAttributes['data-block-type']) {
      extraAttrs['data-block-type'] = HTMLAttributes['data-block-type'] as string;
    } else if (!HTMLAttributes['data-quotation-section']) {
      extraAttrs['data-block-type'] = 'legal';
    }
    return ['section', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, extraAttrs), 0];
  },

  addCommands() {
    return {
      setLegalUnlocked:
        (unlocked: boolean) =>
        ({ tr, dispatch }) => {
          this.options.unlocked = unlocked;
          if (this.storage) {
            this.storage.unlocked = unlocked;
          }
          if (dispatch) {
            tr.setMeta(LegalBlockPluginKey, { unlocked });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { storage } = this;
    return [
      new Plugin({
        key: LegalBlockPluginKey,
        state: {
          init: () => ({ unlocked: this.options.unlocked }),
          apply: (tr, current) => {
            const meta = tr.getMeta(LegalBlockPluginKey);
            if (meta && typeof meta.unlocked === 'boolean') {
              return { unlocked: meta.unlocked };
            }
            return current;
          },
        },
        filterTransaction: (tr, state) => {
          // If extension option or storage or plugin state is unlocked, permit all transactions
          const pluginState = LegalBlockPluginKey.getState(state);
          if (this.options.unlocked || storage?.unlocked || pluginState?.unlocked) {
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

export const QuotationImageExtension = Node.create({
  name: 'quotationImage',
  inline: true,
  group: 'inline',
  draggable: false,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('src'),
        renderHTML: (attrs) => (attrs.src ? { src: attrs.src } : {}),
      },
      alt: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('alt'),
        renderHTML: (attrs) => (attrs.alt ? { alt: attrs.alt } : {}),
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style'),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },
});

export const QuotationSignatureBoxExtension = Node.create({
  name: 'quotationSignatureBox',
  group: 'block',
  content: 'inline*',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style'),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div.signature-stamp-box' },
      { tag: 'div.client-signature-box' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});

