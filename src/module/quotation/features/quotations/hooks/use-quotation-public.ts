import type { PublicQuotation } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getPublicQuotation } from '../api';

export function useQuotationPublic(token: string) {
  const [data, setData] = useState<PublicQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPublicQuotation(token)
      .then((quotation) => {
        if (active) setData(quotation);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setData(null);
        setError(reason instanceof Error ? reason.message : i18n.t('quotation:public.loadFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, token]);

  return { data, loading, error, refresh };
}
