// @vitest-environment happy-dom
import type { ReactNode } from 'react';

import i18n from 'i18next';
import { MemoryRouter } from 'react-router';
import { it, expect, describe, afterEach } from 'vitest';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { render, screen, cleanup, renderHook } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { mixins } from 'src/theme/core/mixins';
import { NavSectionVertical } from 'src/shared/ui/nav-section';
import idNavigation from 'src/locales/langs/id/navigation.json';
import enNavigation from 'src/locales/langs/en/navigation.json';

import { useNavData } from './nav-config-dashboard';

function createTestI18n(lng: 'id' | 'en' = 'id') {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng,
    fallbackLng: lng,
    ns: ['navigation'],
    defaultNS: 'navigation',
    resources: {
      id: { navigation: idNavigation },
      en: { navigation: enNavigation },
    },
    interpolation: { escapeValue: false },
  });
  return instance;
}

function createWrapper(initialEntries = ['/quotation'], lng: 'id' | 'en' = 'id') {
  const i18nInstance = createTestI18n(lng);
  const theme = createTheme({ cssVariables: true, mixins });
  return ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18nInstance}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe('useNavData config structure', () => {
  afterEach(() => {
    cleanup();
  });

  it('returns grouped navigation structure for Quotation and Blueprint in Indonesian', () => {
    const { result } = renderHook(() => useNavData(), {
      wrapper: createWrapper(['/quotation'], 'id'),
    });

    const sections = result.current;
    expect(sections).toHaveLength(1);

    const items = sections[0].items;
    expect(items).toHaveLength(5);

    // 1. Quotation group
    expect(items[0]).toMatchObject({
      title: 'Quotation',
      path: paths.dashboard.quotation.root,
      children: [
        {
          title: 'Buat Quotation',
          path: paths.dashboard.quotation.prompt,
        },
        {
          title: 'Daftar Quotation',
          path: paths.dashboard.quotation.list,
        },
      ],
    });

    // 2. Blueprint group
    expect(items[1]).toMatchObject({
      title: 'Blueprint',
      path: paths.dashboard.blueprint.root,
      children: [
        {
          title: 'Buat Blueprint',
          path: paths.dashboard.blueprint.root,
        },
        {
          title: 'Proses Blueprint',
          path: paths.dashboard.blueprint.process,
        },
        {
          title: 'Daftar Blueprint',
          path: paths.dashboard.blueprint.list,
        },
      ],
    });

    // 3. Rate Cards
    expect(items[2]).toMatchObject({
      title: 'Rate Card',
      path: paths.dashboard.quotation.rateCards,
    });
    expect(items[2].children).toBeUndefined();

    // 4. AI Settings
    expect(items[3]).toMatchObject({
      title: 'Pengaturan AI',
      path: paths.dashboard.quotation.aiSettings,
    });
    expect(items[3].children).toBeUndefined();

    // 5. Contract Generator
    expect(items[4]).toMatchObject({
      title: 'Contract Generator',
      path: paths.dashboard.contract.root,
    });
    expect(items[4].children).toBeUndefined();
  });

  it('returns grouped navigation structure for Quotation and Blueprint in English', () => {
    const { result } = renderHook(() => useNavData(), {
      wrapper: createWrapper(['/quotation'], 'en'),
    });

    const sections = result.current;
    const items = sections[0].items;

    expect(items[0]).toMatchObject({
      title: 'Quotation',
      children: [
        { title: 'Create Quotation', path: paths.dashboard.quotation.prompt },
        { title: 'Quotation List', path: paths.dashboard.quotation.list },
      ],
    });

    expect(items[1]).toMatchObject({
      title: 'Blueprint',
      children: [
        { title: 'Create Blueprint', path: paths.dashboard.blueprint.root },
        { title: 'Blueprint Process', path: paths.dashboard.blueprint.process },
        { title: 'Blueprint List', path: paths.dashboard.blueprint.list },
      ],
    });

    expect(items[2]).toMatchObject({ title: 'Rate Cards' });
    expect(items[3]).toMatchObject({ title: 'AI Settings' });
    expect(items[4]).toMatchObject({ title: 'Contract Generator' });
  });
});

describe('NavSectionVertical with grouped sidebar', () => {
  afterEach(() => {
    cleanup();
  });

  function TestNavComponent() {
    const navData = useNavData();
    return <NavSectionVertical data={navData} />;
  }

  const renderNav = (path: string, lng: 'id' | 'en' = 'id') =>
    render(<TestNavComponent />, {
      wrapper: createWrapper([path], lng),
    });

  it('activates Quotation parent and Buat Quotation child on "/quotation"', () => {
    renderNav('/quotation');

    const quotationParent = screen.getByRole('button', { name: 'Quotation' });
    expect(quotationParent.className).toContain('--active');
    expect(quotationParent.className).toContain('--open');

    const createQuotationChild = screen.getByRole('link', { name: 'Buat Quotation' });
    expect(createQuotationChild.className).toContain('--active');

    const listQuotationChild = screen.getByRole('link', { name: 'Daftar Quotation' });
    expect(listQuotationChild.className).not.toContain('--active');
  });

  it('activates Quotation parent and Daftar Quotation child on "/quotation/list"', () => {
    renderNav('/quotation/list');

    const quotationParent = screen.getByRole('button', { name: 'Quotation' });
    expect(quotationParent.className).toContain('--active');
    expect(quotationParent.className).toContain('--open');

    const listQuotationChild = screen.getByRole('link', { name: 'Daftar Quotation' });
    expect(listQuotationChild.className).toContain('--active');

    const createQuotationChild = screen.getByRole('link', { name: 'Buat Quotation' });
    expect(createQuotationChild.className).not.toContain('--active');
  });

  it('activates Blueprint parent and Buat Blueprint child on "/blueprint"', () => {
    renderNav('/blueprint');

    const blueprintParent = screen.getByRole('button', { name: 'Blueprint' });
    expect(blueprintParent.className).toContain('--active');
    expect(blueprintParent.className).toContain('--open');

    const createBlueprintChild = screen.getByRole('link', { name: 'Buat Blueprint' });
    expect(createBlueprintChild.className).toContain('--active');

    const processBlueprintChild = screen.getByRole('link', { name: 'Proses Blueprint' });
    expect(processBlueprintChild.className).not.toContain('--active');

    const listBlueprintChild = screen.getByRole('link', { name: 'Daftar Blueprint' });
    expect(listBlueprintChild.className).not.toContain('--active');
  });

  it('activates Blueprint parent and Proses Blueprint child on "/blueprint/process"', () => {
    renderNav('/blueprint/process');

    const blueprintParent = screen.getByRole('button', { name: 'Blueprint' });
    expect(blueprintParent.className).toContain('--active');
    expect(blueprintParent.className).toContain('--open');

    const processBlueprintChild = screen.getByRole('link', { name: 'Proses Blueprint' });
    expect(processBlueprintChild.className).toContain('--active');

    const createBlueprintChild = screen.getByRole('link', { name: 'Buat Blueprint' });
    expect(createBlueprintChild.className).not.toContain('--active');
  });

  it('activates Blueprint parent and Daftar Blueprint child on "/blueprint/list"', () => {
    renderNav('/blueprint/list');

    const blueprintParent = screen.getByRole('button', { name: 'Blueprint' });
    expect(blueprintParent.className).toContain('--active');
    expect(blueprintParent.className).toContain('--open');

    const listBlueprintChild = screen.getByRole('link', { name: 'Daftar Blueprint' });
    expect(listBlueprintChild.className).toContain('--active');

    const createBlueprintChild = screen.getByRole('link', { name: 'Buat Blueprint' });
    expect(createBlueprintChild.className).not.toContain('--active');
  });

  it('activates Blueprint parent on detail "/blueprint/bp-123" without marking children active', () => {
    renderNav('/blueprint/bp-123');

    const blueprintParent = screen.getByRole('button', { name: 'Blueprint' });
    expect(blueprintParent.className).toContain('--active');

    const createBlueprintChild = screen.getByRole('link', { name: 'Buat Blueprint' });
    expect(createBlueprintChild.className).not.toContain('--active');

    const processBlueprintChild = screen.getByRole('link', { name: 'Proses Blueprint' });
    expect(processBlueprintChild.className).not.toContain('--active');

    const listBlueprintChild = screen.getByRole('link', { name: 'Daftar Blueprint' });
    expect(listBlueprintChild.className).not.toContain('--active');
  });
});
