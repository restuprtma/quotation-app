import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { SimpleLayout } from 'src/layouts/simple';
import { LoadingScreen } from 'src/shared/ui/loading-screen';

import { PublicThemeScope } from '../components/public-theme-scope';

const ContractPublicPage = lazy(
  () => import('src/module/contract/features/contracts/pages/public')
);
const QuotationPublicPage = lazy(
  () => import('src/module/quotation/features/quotations/pages/public')
);
const SharedBlueprintPublicPage = lazy(
  () => import('src/module/quotation/features/blueprint-sharing/pages/public')
);

export const publicRoutes: RouteObject[] = [
  {
    path: 'p',
    element: (
      <PublicThemeScope>
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
      </PublicThemeScope>
    ),
    children: [
      { path: 'c/:token', element: <ContractPublicPage /> },
      { path: 'q/:token', element: <QuotationPublicPage /> },
      { path: 'blueprint/:token', element: <SharedBlueprintPublicPage /> },
    ],
  },
];
