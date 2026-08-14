import { useState, useCallback } from 'react';

export type QuotationDialogMode = 'new' | 'view' | 'edit';

export function useQuotationDialog() {
  const [state, setState] = useState<{ mode: QuotationDialogMode | null; id: string | null }>({
    mode: null,
    id: null,
  });

  const open = useCallback((mode: QuotationDialogMode, id?: string) => {
    setState({ mode, id: id ?? null });
  }, []);

  const close = useCallback(() => setState({ mode: null, id: null }), []);

  return { ...state, open, close };
}
