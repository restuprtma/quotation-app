// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { paths } from 'src/routes/paths';

import { dashboardRoutes } from './dashboard';

// Mock auth guard & layout to isolate routing tests
vi.mock('src/module/core/features/auth/guard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('src/layouts/dashboard', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

vi.mock('src/shared/ui/loading-screen', () => ({
  LoadingScreen: () => <div data-testid="loading-screen">Loading...</div>,
}));

// Mock lazy-loaded page modules
vi.mock('src/module/quotation/features/quotations/pages/prompt', () => ({
  default: () => <div data-testid="page-quotation-prompt">Quotation Prompt Page</div>,
}));

vi.mock('src/module/quotation/features/quotations/pages/list', () => ({
  default: () => <div data-testid="page-quotation-list">Quotation List Page</div>,
}));

vi.mock('src/module/quotation/features/quotations/pages/editor', () => ({
  default: () => <div data-testid="page-quotation-editor">Quotation Editor Page</div>,
}));

vi.mock('src/module/quotation/features/blueprints/pages/create', () => ({
  default: () => <div data-testid="page-blueprint-create">Blueprint Create Page</div>,
}));

vi.mock('src/module/quotation/features/blueprints/pages/process', () => ({
  default: () => <div data-testid="page-blueprint-process">Blueprint Process Page</div>,
}));

vi.mock('src/module/quotation/features/blueprints/pages/list', () => ({
  default: () => <div data-testid="page-blueprint-list">Blueprint List Page</div>,
}));

vi.mock('src/module/quotation/features/blueprints/pages/progress', () => ({
  default: () => <div data-testid="page-blueprint-progress">Blueprint Progress Page</div>,
}));

vi.mock('src/module/quotation/features/blueprints/pages/editor', () => ({
  default: () => <div data-testid="page-blueprint-editor">Blueprint Editor Page</div>,
}));

vi.mock('src/module/quotation/features/settings/pages/signature-settings-page', () => ({
  default: () => <div data-testid="page-signature-settings">Signature Settings Page</div>,
}));

describe('Dashboard paths', () => {
  it('defines canonical quotation paths', () => {
    expect(paths.dashboard.quotation.root).toBe('/quotation');
    expect(paths.dashboard.quotation.prompt).toBe('/quotation');
    expect(paths.dashboard.quotation.list).toBe('/quotation/list');
    expect(paths.dashboard.quotation.signatureSettings).toBe('/quotation/settings/signature');
    expect(paths.dashboard.quotation.edit('q-123')).toBe('/quotation/q-123/edit');
  });

  it('defines canonical blueprint static and dynamic paths', () => {
    expect(paths.dashboard.blueprint.root).toBe('/blueprint');
    expect(paths.dashboard.blueprint.create).toBe('/blueprint');
    expect(paths.dashboard.blueprint.process).toBe('/blueprint/process');
    expect(paths.dashboard.blueprint.list).toBe('/blueprint/list');
    expect(paths.dashboard.blueprint.detail('bp-123')).toBe('/blueprint/bp-123');
    expect(paths.dashboard.blueprint.edit('bp-123')).toBe('/blueprint/bp-123/edit');
  });
});

describe('Dashboard Router', () => {
  afterEach(() => {
    cleanup();
  });

  const renderRoute = (initialEntry: string) => {
    const router = createMemoryRouter(dashboardRoutes, {
      initialEntries: [initialEntry],
    });
    return render(<RouterProvider router={router} />);
  };

  it('redirects root "/" to "/quotation" and renders QuotationPromptPage', async () => {
    renderRoute('/');
    expect(await screen.findByTestId('page-quotation-prompt')).toBeDefined();
  });

  it('renders QuotationPromptPage on "/quotation"', async () => {
    renderRoute('/quotation');
    expect(await screen.findByTestId('page-quotation-prompt')).toBeDefined();
  });

  it('renders QuotationListPage on "/quotation/list"', async () => {
    renderRoute('/quotation/list');
    expect(await screen.findByTestId('page-quotation-list')).toBeDefined();
  });

  it('renders SignatureSettingsPage on "/quotation/settings/signature"', async () => {
    renderRoute('/quotation/settings/signature');
    expect(await screen.findByTestId('page-signature-settings')).toBeDefined();
  });

  it('renders BlueprintCreatePage on "/blueprint"', async () => {
    renderRoute('/blueprint');
    expect(await screen.findByTestId('page-blueprint-create')).toBeDefined();
  });

  it('renders BlueprintProcessPage on "/blueprint/process" without matching dynamic :id route', async () => {
    renderRoute('/blueprint/process');
    expect(await screen.findByTestId('page-blueprint-process')).toBeDefined();
    expect(screen.queryByTestId('page-blueprint-progress')).toBeNull();
  });

  it('renders BlueprintListPage on "/blueprint/list" without matching dynamic :id route', async () => {
    renderRoute('/blueprint/list');
    expect(await screen.findByTestId('page-blueprint-list')).toBeDefined();
    expect(screen.queryByTestId('page-blueprint-progress')).toBeNull();
  });

  it('renders BlueprintProgressPage on "/blueprint/:id"', async () => {
    renderRoute('/blueprint/bp-999');
    expect(await screen.findByTestId('page-blueprint-progress')).toBeDefined();
  });

  it('renders BlueprintEditorPage on "/blueprint/:id/edit"', async () => {
    renderRoute('/blueprint/bp-999/edit');
    expect(await screen.findByTestId('page-blueprint-editor')).toBeDefined();
  });
});
