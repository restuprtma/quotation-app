import { it, expect, describe } from 'vitest';

import {
  type PromptEditorSession,
  createPromptEditorSession,
  promptEditorSessionReducer,
} from './prompt-editor-session';

const loaded = {
  quotationId: 'q-1',
  revisionId: 'r-1',
  contentHtml: '<p>server</p>',
  contentVersion: 3,
};

function reduce(
  state: PromptEditorSession | undefined,
  event: Parameters<typeof promptEditorSessionReducer>[1]
) {
  return promptEditorSessionReducer(state ?? createPromptEditorSession(), event);
}

describe('promptEditorSessionReducer', () => {
  it('loads the initial server document', () => {
    const state = reduce(undefined, { type: 'serverLoaded', ...loaded });

    expect(state).toMatchObject({
      ...loaded,
      isDirty: false,
      isConflict: false,
    });
  });

  it('updates a clean session when the same revision is refetched', () => {
    let state = reduce(undefined, { type: 'serverLoaded', ...loaded });
    state = reduce(state, {
      type: 'serverLoaded',
      ...loaded,
      contentHtml: '<p>new</p>',
      contentVersion: 4,
    });

    expect(state.contentHtml).toBe('<p>new</p>');
    expect(state.contentVersion).toBe(4);
    expect(state.isDirty).toBe(false);
  });

  it('preserves local content when the same revision is refetched while dirty', () => {
    let state = reduce(undefined, { type: 'serverLoaded', ...loaded });
    state = reduce(state, { type: 'localChanged', contentHtml: '<p>BA edit</p>' });
    state = reduce(state, {
      type: 'serverLoaded',
      ...loaded,
      contentHtml: '<p>server refresh</p>',
      contentVersion: 4,
    });

    expect(state.contentHtml).toBe('<p>BA edit</p>');
    expect(state.contentVersion).toBe(3);
    expect(state.isDirty).toBe(true);
  });

  it('makes a successful save canonical and clears dirty state', () => {
    let state = reduce(undefined, { type: 'serverLoaded', ...loaded });
    state = reduce(state, { type: 'localChanged', contentHtml: '<p>BA edit</p>' });
    state = reduce(state, {
      type: 'saveSucceeded',
      contentHtml: '<p>canonical</p>',
      contentVersion: 4,
    });

    expect(state).toMatchObject({
      contentHtml: '<p>canonical</p>',
      contentVersion: 4,
      isDirty: false,
    });
  });

  it('keeps local content and exposes a conflict after a 409', () => {
    let state = reduce(undefined, { type: 'serverLoaded', ...loaded });
    state = reduce(state, { type: 'localChanged', contentHtml: '<p>BA edit</p>' });
    state = reduce(state, { type: 'versionConflict' });

    expect(state.contentHtml).toBe('<p>BA edit</p>');
    expect(state.isDirty).toBe(true);
    expect(state.isConflict).toBe(true);
  });

  it('resets the session when switching quotation', () => {
    let state = reduce(undefined, { type: 'serverLoaded', ...loaded });
    state = reduce(state, { type: 'localChanged', contentHtml: '<p>BA edit</p>' });
    state = reduce(state, {
      type: 'serverLoaded',
      ...loaded,
      quotationId: 'q-2',
      revisionId: 'r-2',
    });

    expect(state.quotationId).toBe('q-2');
    expect(state.revisionId).toBe('r-2');
    expect(state.contentHtml).toBe('<p>server</p>');
    expect(state.isDirty).toBe(false);
  });
});
