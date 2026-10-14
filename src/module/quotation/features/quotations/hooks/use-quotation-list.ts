import type { Quotation, PaginationMeta, QuotationListParams } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { listQuotations } from '../api';

const EMPTY_META: PaginationMeta = { page: 1, limit: 25, total: 0, total_pages: 1 };

export function useQuotationList(params: QuotationListParams) {
  const [data, setData] = useState<Quotation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  const { page, limit, search, status } = params;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listQuotations({ page, limit, search, status })
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setMeta(result.meta);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : i18n.t('quotation:errors.loadData'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, limit, search, status, refreshKey]);

  return { data, meta, loading, error, refresh };
}
