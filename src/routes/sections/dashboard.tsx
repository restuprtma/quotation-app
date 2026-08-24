import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/shared/config';
import { DashboardLayout } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/shared/ui/loading-screen';
import { AuthGuard } from 'src/module/core/features/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const QuotationListPage = lazy(() => import('src/module/quotation/features/quotations/pages/list'));
const ContractListPage = lazy(() => import('src/module/contract/features/contracts/pages/list'));
const ContractEditPage = lazy(() => import('src/module/contract/features/contracts/pages/edit'));
const AISettingsPage = lazy(() => import('src/module/quotation/features/ai-settings/pages/index'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/quotation" replace /> },
      {
        path: 'quotation',
        children: [
          { index: true, element: <QuotationListPage /> },
          { path: 'ai-settings', element: <AISettingsPage /> },
        ]
      },
      {
        path: 'contract',
        children: [
          { index: true, element: <ContractListPage /> },
          { path: ':id/edit', element: <ContractEditPage /> },
        ],
      },
    ],
  },
];
