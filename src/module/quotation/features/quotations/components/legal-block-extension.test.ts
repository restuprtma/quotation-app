import { it, describe } from 'vitest';
import { Editor } from '@tiptap/core';
import assert from 'node:assert/strict';
import StarterKit from '@tiptap/starter-kit';
import { Selection } from '@tiptap/pm/state';

import { LegalBlockExtension } from './legal-block-extension';

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
      extensions: [
        StarterKit,
        LegalBlockExtension.configure({ unlocked: options.unlocked }),
      ],
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
    assert.ok(jsonAfter.includes('EDITED Opening paragraph'), 'Document must contain edited opening text');

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
    assert.ok(jsonAfter.includes('UNLOCKED_EDIT Official legal'), 'Document must contain modified legal text when unlocked');

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
    const tr = editor.state.tr.setSelection(
      Selection.near(editor.state.doc.resolve(legalPos))
    );
    (editor as any).dispatchTransaction(tr);
    assert.equal(editor.state.selection.from, legalPos, 'Cursor selection inside legal block must be allowed');

    editor.destroy();
  });
});
