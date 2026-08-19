import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';

import { LoadingScreen } from 'src/shared/ui/loading-screen';

export const rndRoutes: RouteObject[] = [];

if (import.meta.env.DEV) {
  const QuotationSkillLabPage = lazy(
    () => import('src/module/quotation/features/rnd/quotation-skill-lab/pages')
  );

  rndRoutes.push({
    path: '/rnd/quotation-skill-lab',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <QuotationSkillLabPage />
      </Suspense>
    ),
  });
}
