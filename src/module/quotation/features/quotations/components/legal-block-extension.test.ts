import { it, describe } from 'vitest';
import { Editor } from '@tiptap/core';
import assert from 'node:assert/strict';
import StarterKit from '@tiptap/starter-kit';
import { Selection } from '@tiptap/pm/state';

import {
  LegalBlockExtension,
  QuotationTableExtension,
  QuotationSectionExtension,
} from './legal-block-extension';

describe('LegalBlockExtension', () => {
  const initialContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Opening paragraph before legal block' }],
      },
      {
        type: 'legalBlock',
        attrs: { 'data-block-type': 'legal' },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Official legal terms and conditions.' }],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Closing paragraph after legal block' }],
      },
    ],
  };

  function createTestEditor(options: { unlocked: boolean }) {
    const editor = new Editor({
      extensions: [StarterKit, LegalBlockExtension.configure({ unlocked: options.unlocked })],
      content: initialContent,
    });
    // In headless test mode without DOM mount, activate plugins on editor state
    const stateWithPlugins = editor.state.reconfigure({
      plugins: editor.extensionManager.plugins,
    });
    editor.view.updateState(stateWithPlugins);
    return editor;
  }

  it('rejects text insertion inside legal block when locked', () => {
    const editor = createTestEditor({ unlocked: false });

    let legalPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock') {
        legalPos = pos + 2; // inside the inner paragraph text
      }
    });
    assert.ok(legalPos > 0, 'legalBlock node must be found in doc');

    const jsonBefore = JSON.stringify(editor.getJSON());

    // Attempt to insert text inside legal block
    const tr = editor.state.tr.insertText('TAMPERED ', legalPos);
    (editor as any).dispatchTransaction(tr);

    const jsonAfter = JSON.stringify(editor.getJSON());
    assert.equal(jsonAfter, jsonBefore, 'Content inside legal block must NOT change when locked');
    assert.ok(!jsonAfter.includes('TAMPERED'), 'Document must not contain tampered text');

    editor.destroy();
  });

  it('allows text insertion outside legal block when locked', () => {
    const editor = createTestEditor({ unlocked: false });

    const jsonBefore = JSON.stringify(editor.getJSON());

    // Insert text in the first paragraph (pos = 1)
    const tr = editor.state.tr.insertText('EDITED ', 1);
    (editor as any).dispatchTransaction(tr);

    const jsonAfter = JSON.stringify(editor.getJSON());
    assert.notEqual(jsonAfter, jsonBefore, 'Content outside legal block must change when edited');
    assert.ok(
      jsonAfter.includes('EDITED Opening paragraph'),
      'Document must contain edited opening text'
    );

    editor.destroy();
  });

  it('allows text insertion inside legal block when unlocked', () => {
    const editor = createTestEditor({ unlocked: true });

    let legalPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock') {
        legalPos = pos + 2;
      }
    });
    assert.ok(legalPos > 0, 'legalBlock node must be found in doc');

    const tr = editor.state.tr.insertText('UNLOCKED_EDIT ', legalPos);
    (editor as any).dispatchTransaction(tr);

    const jsonAfter = JSON.stringify(editor.getJSON());
    assert.ok(
      jsonAfter.includes('UNLOCKED_EDIT Official legal'),
      'Document must contain modified legal text when unlocked'
    );

    editor.destroy();
  });

  it('allows selection and cursor transactions inside legal block when locked', () => {
    const editor = createTestEditor({ unlocked: false });

    let legalPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock') {
        legalPos = pos + 2;
      }
    });

    // Move selection into legal block
    const tr = editor.state.tr.setSelection(Selection.near(editor.state.doc.resolve(legalPos)));
    (editor as any).dispatchTransaction(tr);
    assert.equal(
      editor.state.selection.from,
      legalPos,
      'Cursor selection inside legal block must be allowed'
    );

    editor.destroy();
  });

  it('rejects edits inside rights and limitations blocks when locked, and permits when unlocked', () => {
    const customContent = {
      type: 'doc',
      content: [
        {
          type: 'quotationSection',
          attrs: { 'data-quotation-section': 'scope', 'data-quotation-section-number': '1' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Standard scope text' }],
            },
          ],
        },
        {
          type: 'legalBlock',
          attrs: { 'data-quotation-section': 'rights', 'data-quotation-section-number': '2' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Original rights text' }],
            },
          ],
        },
        {
          type: 'legalBlock',
          attrs: { 'data-quotation-section': 'limitations', 'data-quotation-section-number': '3' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Original limitations text' }],
            },
          ],
        },
      ],
    };

    function createCustomEditor(unlocked: boolean) {
      const editor = new Editor({
        extensions: [
          StarterKit,
          QuotationSectionExtension,
          LegalBlockExtension.configure({ unlocked }),
        ],
        content: customContent,
      });
      const stateWithPlugins = editor.state.reconfigure({
        plugins: editor.extensionManager.plugins,
      });
      editor.view.updateState(stateWithPlugins);
      return editor;
    }

    // 1. Locked: text insertion into rights and limitations is blocked
    const lockedEditor = createCustomEditor(false);
    let rightsPos = -1;
    let limPos = -1;
    lockedEditor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock') {
        if (node.attrs?.['data-quotation-section'] === 'rights') {
          rightsPos = pos + 2;
        } else if (node.attrs?.['data-quotation-section'] === 'limitations') {
          limPos = pos + 2;
        }
      }
    });
    assert.ok(rightsPos > 0, 'rights block found');
    assert.ok(limPos > 0, 'limitations block found');

    const beforeLocked = JSON.stringify(lockedEditor.getJSON());
    const tr1 = lockedEditor.state.tr.insertText('HACKED_RIGHTS ', rightsPos);
    (lockedEditor as any).dispatchTransaction(tr1);
    assert.equal(
      JSON.stringify(lockedEditor.getJSON()),
      beforeLocked,
      'rights block must not change when locked'
    );

    const tr2 = lockedEditor.state.tr.insertText('HACKED_LIMITATIONS ', limPos);
    (lockedEditor as any).dispatchTransaction(tr2);
    assert.equal(
      JSON.stringify(lockedEditor.getJSON()),
      beforeLocked,
      'limitations block must not change when locked'
    );
    lockedEditor.destroy();

    // 2. Unlocked: editing is permitted
    const unlockedEditor = createCustomEditor(true);
    let uRightsPos = -1;
    let uLimPos = -1;
    unlockedEditor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'legalBlock') {
        if (node.attrs?.['data-quotation-section'] === 'rights') {
          uRightsPos = pos + 2;
        } else if (node.attrs?.['data-quotation-section'] === 'limitations') {
          uLimPos = pos + 2;
        }
      }
    });

    const tr3 = unlockedEditor.state.tr.insertText('EDITED_RIGHTS ', uRightsPos);
    (unlockedEditor as any).dispatchTransaction(tr3);
    assert.ok(
      JSON.stringify(unlockedEditor.getJSON()).includes('EDITED_RIGHTS'),
      'rights edited when unlocked'
    );

    const tr4 = unlockedEditor.state.tr.insertText('EDITED_LIMITATIONS ', uLimPos);
    (unlockedEditor as any).dispatchTransaction(tr4);
    assert.ok(
      JSON.stringify(unlockedEditor.getJSON()).includes('EDITED_LIMITATIONS'),
      'limitations edited when unlocked'
    );
    unlockedEditor.destroy();
  });

  it('preserves data-role on QuotationTableExtension', () => {
    const attrs = QuotationTableExtension.config.addAttributes?.call({}) as any;
    assert.ok(
      attrs['data-role'],
      'data-role attribute must be configured on QuotationTableExtension'
    );
    assert.equal(
      attrs['data-role'].parseHTML({
        getAttribute: (name: string) => (name === 'data-role' ? 'hardware_cost_table' : null),
      }),
      'hardware_cost_table'
    );
    assert.deepEqual(attrs['data-role'].renderHTML({ 'data-role': 'hardware_cost_table' }), {
      'data-role': 'hardware_cost_table',
    });
  });
});
