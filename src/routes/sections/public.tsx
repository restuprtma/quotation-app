import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { SimpleLayout } from 'src/layouts/simple';
import { LoadingScreen } from 'src/shared/ui/loading-screen';

const QuotationPublicPage = lazy(
  () => import('src/module/quotation/features/quotations/pages/public')
);

const BlueprintPublicPage = lazy(
  () => import('src/module/quotation/features/quotations/pages/public-blueprint')
);

const DetailPublicPage = lazy(
  () => import('src/module/quotation/features/quotations/pages/public-detail')
);

const ContractPublicPage = lazy(
  () => import('src/module/contract/features/contracts/pages/public')
);

export const publicRoutes: RouteObject[] = [
  {
    path: 'p',
    element: (
      <SimpleLayout
        slotProps={{
          header: { sx: { display: 'none' } },
          main: { sx: { bgcolor: 'background.neutral' } },
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </SimpleLayout>
    ),
    children: [
      { path: 'q/:token', element: <QuotationPublicPage /> },
      { path: 'b/:token', element: <BlueprintPublicPage /> },
      { path: 'd/:token', element: <DetailPublicPage /> },
      { path: 'c/:token', element: <ContractPublicPage /> },
    ],
  },
];
