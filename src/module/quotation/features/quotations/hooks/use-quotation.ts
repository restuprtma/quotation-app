import type { Quotation } from '../types';

import i18n from 'i18next';
import { useState, useEffect } from 'react';

import { getQuotation } from '../api';

export function useQuotation(id: string | null) {
  const [data, setData] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getQuotation(id)
      .then((quotation) => {
        if (active) setData(quotation);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : i18n.t('quotation:errors.loadDetail')
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return { data, loading, error };
}
