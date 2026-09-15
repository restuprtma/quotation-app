// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { CommercialSchemeSelector } from './commercial-scheme-selector';

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string, optionsOrDefault?: string | { defaultValue?: string; count?: number }) => {
      if (typeof optionsOrDefault === 'string') {
        return optionsOrDefault;
      }
      if (optionsOrDefault && typeof optionsOrDefault === 'object') {
        if (optionsOrDefault.defaultValue) {
          return optionsOrDefault.defaultValue;
        }
        if (typeof optionsOrDefault.count === 'number') {
          return `${optionsOrDefault.count} commercial models available`;
        }
      }
      return key;
    },
  }),
}));

const theme = createTheme();

function renderSelector(
  props: {
    onSelectScheme?: (scheme: any) => void;
    onBack?: () => void;
  } = {}
) {
  const onSelectScheme = props.onSelectScheme || vi.fn();
  const onBack = props.onBack || vi.fn();
  const utils = render(
    <ThemeProvider theme={theme}>
      <CommercialSchemeSelector onSelectScheme={onSelectScheme} onBack={onBack} />
    </ThemeProvider>
  );
  return { ...utils, onSelectScheme, onBack };
}

describe('CommercialSchemeSelector', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all eight commercial schemes', () => {
    renderSelector();

    expect(screen.getByText('Dedicated Programmer Squad')).toBeTruthy();
    expect(screen.getByText('Custom Software Development')).toBeTruthy();
    expect(screen.getByText('Talent Outsourcing')).toBeTruthy();
    expect(screen.getByText('Software Subscription / SaaS')).toBeTruthy();
    expect(screen.getByText('White Label Product')).toBeTruthy();
    expect(screen.getByText('Standalone Maintenance & Support')).toBeTruthy();
    expect(screen.getByText('Cloud Infrastructure')).toBeTruthy();
    expect(screen.getByText('Sistem & Integrasi Perangkat Keras')).toBeTruthy();
  });

  it('calls onSelectScheme with cloud_infrastructure when Cloud card is clicked', () => {
    const onSelectScheme = vi.fn();
    renderSelector({ onSelectScheme });

    const cloudCard = screen.getByRole('button', { name: /Cloud Infrastructure/i });
    fireEvent.click(cloudCard);

    expect(onSelectScheme).toHaveBeenCalledTimes(1);
    expect(onSelectScheme).toHaveBeenCalledWith('cloud_infrastructure');
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    renderSelector({ onBack });

    const backButton = screen.getByRole('button', { name: /prompt\.backToPrompt/i });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('filters schemes when search query is entered', () => {
    renderSelector();

    const searchInput = screen.getByPlaceholderText(/Cari skema layanan\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'cloud' } });

    expect(screen.getByText('Cloud Infrastructure')).toBeTruthy();
    expect(screen.queryByText('Dedicated Programmer Squad')).toBeNull();
  });

  it('filters schemes by category tabs', () => {
    renderSelector();

    // Click Hardware tab
    const hardwareTab = screen.getByRole('tab', { name: /Hardware & IoT/i });
    fireEvent.click(hardwareTab);

    expect(screen.getByText('Sistem & Integrasi Perangkat Keras')).toBeTruthy();
    expect(screen.queryByText('Dedicated Programmer Squad')).toBeNull();
    expect(screen.queryByText('Cloud Infrastructure')).toBeNull();
  });

  it('supports keyboard selection with Enter key', () => {
    const onSelectScheme = vi.fn();
    renderSelector({ onSelectScheme });

    const dedicatedCard = screen.getByRole('button', { name: /Dedicated Programmer Squad/i });
    fireEvent.keyDown(dedicatedCard, { key: 'Enter', code: 'Enter' });

    expect(onSelectScheme).toHaveBeenCalledTimes(1);
    expect(onSelectScheme).toHaveBeenCalledWith('dedicated_squad');
  });
});
