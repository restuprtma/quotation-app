import type { PublicBlueprintResponse } from '../types';

import i18n from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { getPublicBlueprint } from '../api';

export function useBlueprintPublic(token: string) {
  const [data, setData] = useState<PublicBlueprintResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPublicBlueprint(token)
      .then((blueprint) => {
        if (active) setData(blueprint);
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
