import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

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
        parseHTML: (element) => element.getAttribute('data-block-type') || 'legal',
        renderHTML: (attributes) => ({
          'data-block-type': attributes['data-block-type'] || 'legal',
        }),
      },
      'data-template-code': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-template-code'),
        renderHTML: (attributes) => {
          if (!attributes['data-template-code']) return {};
          return { 'data-template-code': attributes['data-template-code'] };
        },
      },
      'data-modified': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-modified'),
        renderHTML: (attributes) => {
          if (!attributes['data-modified']) return {};
          return { 'data-modified': attributes['data-modified'] };
        },
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
    const extension = this;

    return [
      new Plugin({
        key: LegalBlockPluginKey,
        filterTransaction(tr, state) {
          // If extension option is unlocked, permit all transactions
          if (extension.options.unlocked) {
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
            if (node.type.name === extension.name) {
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
