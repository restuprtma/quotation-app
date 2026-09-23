import { Node, mergeAttributes } from '@tiptap/core';

export const HEADER_FIELDS = [
  'quotation_number',
  'subject',
  'issue_date_header',
  'client_pic',
  'client_company',
] as const;

export type HeaderField = (typeof HEADER_FIELDS)[number];

export const FACT_LABELS: Record<string, string> = {
  quotation_number: 'No',
  subject: 'Perihal',
  issue_date_header: 'Tanggal',
  system_name: 'Sistem',
};

export const QuotationBrand = Node.create({
  name: 'quotationBrand',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-role="quotation-brand"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-role': 'quotation-brand' }, HTMLAttributes),
      ['img', { src: '/logo/venturo-logo.png', alt: 'Venturo — Expert Programmers' }],
    ];
  },
});

export const QuotationMetadataLayout = Node.create({
  name: 'quotationMetadataLayout',
  group: 'block',
  content: 'quotationMetadataColumn+',

  parseHTML() {
    return [{ tag: 'div[data-role="metadata-layout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-role': 'metadata-layout' }, HTMLAttributes), 0];
  },
});

export const QuotationMetadataColumn = Node.create({
  name: 'quotationMetadataColumn',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      role: {
        default: 'metadata-facts',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-role') || 'metadata-facts',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-role': (attributes.role as string) || 'metadata-facts',
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-role="metadata-facts"]', attrs: { role: 'metadata-facts' } },
      { tag: 'div[data-role="metadata-recipient"]', attrs: { role: 'metadata-recipient' } },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-role': (node.attrs.role as string) || 'metadata-facts' },
        HTMLAttributes
      ),
      0,
    ];
  },
});

export const QuotationMetadataRow = Node.create({
  name: 'quotationMetadataRow',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      field: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-field'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.field ? { 'data-field': attributes.field as string } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-role="metadata-row"]',
        contentElement: '[data-role="metadata-value"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const fieldKey = String(node.attrs.field ?? '');
    const labelText = FACT_LABELS[fieldKey] ?? fieldKey;
    return [
      'div',
      mergeAttributes({ 'data-role': 'metadata-row' }, HTMLAttributes),
      ['span', { 'data-role': 'metadata-label' }, labelText],
      ['span', { 'data-role': 'metadata-separator' }, ':'],
      ['span', { 'data-role': 'metadata-value' }, 0],
    ];
  },
});

export const QuotationRecipientHeading = Node.create({
  name: 'quotationRecipientHeading',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-role="recipient-heading"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-role': 'recipient-heading' }, HTMLAttributes), 0];
  },
});

export const QuotationRecipientLine = Node.create({
  name: 'quotationRecipientLine',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      field: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-field'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.field ? { 'data-field': attributes.field as string } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-role="recipient-line"]',
        contentElement: '[data-role="metadata-value"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const isPic = node.attrs.field === 'client_pic';
    return [
      'div',
      mergeAttributes({ 'data-role': 'recipient-line' }, HTMLAttributes),
      ...(isPic ? [['span', { 'data-role': 'recipient-prefix' }, 'Yth. ']] : []),
      ['span', { 'data-role': 'metadata-value' }, 0],
    ];
  },
});

export const QuotationHeaderExtensions = [
  QuotationBrand,
  QuotationMetadataLayout,
  QuotationMetadataColumn,
  QuotationMetadataRow,
  QuotationRecipientHeading,
  QuotationRecipientLine,
];
