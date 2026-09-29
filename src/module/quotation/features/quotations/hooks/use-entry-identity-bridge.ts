import type { Control, FieldValues } from 'react-hook-form';
import type { QuotationEntryIdentity } from '../types/quotation-entry';

import { useWatch } from 'react-hook-form';
import { useRef, useMemo, useEffect } from 'react';

export type EntryIdentityBridgeOptions<T extends FieldValues = any> = {
  control: Control<T>;
  onChange?: (identity: QuotationEntryIdentity) => void;
  map?: (values: Partial<T>) => QuotationEntryIdentity;
};

export function useEntryIdentityBridge<T extends FieldValues = any>({
  control,
  onChange,
  map,
}: EntryIdentityBridgeOptions<T>): void {
  const values = useWatch({ control });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const currentIdentity = useMemo<QuotationEntryIdentity>(() => {
    if (map) {
      return map((values ?? {}) as Partial<T>);
    }
    const valObj = (values ?? {}) as Record<string, any>;
    return {
      project_name: typeof valObj.subject === 'string' ? valObj.subject : '',
      client_id: typeof valObj.client_id === 'string' ? valObj.client_id : '',
      client_company_name:
        typeof valObj.client_company_name === 'string' ? valObj.client_company_name : '',
      pic_name: typeof valObj.client_name === 'string' ? valObj.client_name : '',
    };
  }, [map, values]);

  const lastEmittedRef = useRef<QuotationEntryIdentity>(currentIdentity);

  useEffect(() => {
    const prev = lastEmittedRef.current;
    const hasChanged =
      prev.project_name !== currentIdentity.project_name ||
      prev.client_id !== currentIdentity.client_id ||
      prev.client_company_name !== currentIdentity.client_company_name ||
      prev.pic_name !== currentIdentity.pic_name;

    if (hasChanged) {
      lastEmittedRef.current = currentIdentity;
      onChangeRef.current?.(currentIdentity);
    }
  }, [currentIdentity]);
}
