export type PromptEditorSession = {
  quotationId: string;
  revisionId: string;
  contentHtml: string;
  contentVersion: number;
  isDirty: boolean;
  isConflict: boolean;
};

export type PromptEditorSessionEvent =
  | ({ type: 'serverLoaded' } & Pick<
      PromptEditorSession,
      'quotationId' | 'revisionId' | 'contentHtml' | 'contentVersion'
    >)
  | { type: 'localChanged'; contentHtml: string }
  | { type: 'saveSucceeded'; contentHtml: string; contentVersion: number }
  | { type: 'versionConflict' };

export function createPromptEditorSession(): PromptEditorSession {
  return {
    quotationId: '',
    revisionId: '',
    contentHtml: '',
    contentVersion: 0,
    isDirty: false,
    isConflict: false,
  };
}

export function promptEditorSessionReducer(
  state: PromptEditorSession,
  event: PromptEditorSessionEvent
): PromptEditorSession {
  switch (event.type) {
    case 'serverLoaded': {
      const sameDocument =
        state.quotationId === event.quotationId && state.revisionId === event.revisionId;
      if (sameDocument && state.isDirty) return state;
      return {
        quotationId: event.quotationId,
        revisionId: event.revisionId,
        contentHtml: event.contentHtml,
        contentVersion: event.contentVersion,
        isDirty: false,
        isConflict: false,
      };
    }
    case 'localChanged':
      return {
        ...state,
        contentHtml: event.contentHtml,
        isDirty: event.contentHtml !== state.contentHtml,
      };
    case 'saveSucceeded':
      return {
        ...state,
        contentHtml: event.contentHtml,
        contentVersion: event.contentVersion,
        isDirty: false,
        isConflict: false,
      };
    case 'versionConflict':
      return { ...state, isConflict: true };
    default:
      return state;
  }
}
