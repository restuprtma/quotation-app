// @vitest-environment happy-dom

import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import idQuotation from 'src/locales/langs/id/quotation.json';
import enQuotation from 'src/locales/langs/en/quotation.json';

import { MeetingNotesForm } from './meeting-notes-form';

function createTestI18n(lng: 'id' | 'en') {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng,
    fallbackLng: lng,
    ns: ['quotation'],
    defaultNS: 'quotation',
    resources: {
      id: { quotation: idQuotation },
      en: { quotation: enQuotation },
    },
    interpolation: { escapeValue: false },
  });
  return instance;
}

function renderWithLocale(lng: 'id' | 'en', props: Partial<React.ComponentProps<typeof MeetingNotesForm>> = {}) {
  const i18nInstance = createTestI18n(lng);
  return render(
    <I18nextProvider i18n={i18nInstance}>
      <ThemeProvider theme={createTheme()}>
        <MeetingNotesForm onSubmit={vi.fn()} onOpenAdvanced={vi.fn()} {...props} />
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe('Prompt First i18n Integration', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all Indonesian labels properly without raw key leaks', () => {
    renderWithLocale('id');

    expect(screen.getByText('Mulai dari catatan meeting')).toBeTruthy();
    expect(
      screen.getByText(
        'Tempel catatan biasa dan kami siapkan draf quotation. Nilai komersial berasal dari katalog backend.'
      )
    ).toBeTruthy();

    expect(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Perusahaan \/ Organisasi Klien/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Attention \/ PIC Klien/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Catatan Meeting/i })).toBeTruthy();

    expect(screen.getByRole('button', { name: /Pengaturan Lanjutan/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Buat Draf/i })).toBeTruthy();

    expect(document.body.textContent).not.toMatch(/promptFirst\.|prompt\.promptFirst\./);
  });

  it('renders all English labels properly without raw key leaks', () => {
    renderWithLocale('en');

    expect(screen.getByText('Start from meeting notes')).toBeTruthy();
    expect(
      screen.getByText(
        'Paste ordinary meeting notes and we will prepare a quotation draft. Commercial values come from the backend catalog.'
      )
    ).toBeTruthy();

    expect(screen.getByRole('textbox', { name: /Project Title \/ Proposal Subject/i })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Client Company \/ Organization/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Attention \/ Client PIC/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Meeting Notes/i })).toBeTruthy();

    expect(screen.getByRole('button', { name: /Advanced Settings/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Create Draft/i })).toBeTruthy();

    expect(document.body.textContent).not.toMatch(/promptFirst\.|prompt\.promptFirst\./);
  });
});
