// @vitest-environment happy-dom
import { it, expect, describe } from 'vitest';
import { render } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { DocumentCanvas } from './document-canvas';

describe('DocumentCanvas', () => {
  it('renders with permanent white paper styling and A4 max-width', () => {
    const { container } = render(
      <DocumentCanvas>
        <p>Document Content</p>
      </DocumentCanvas>
    );

    const paper = container.querySelector('.quotation-document') as HTMLElement;
    expect(paper).not.toBeNull();
    // Verify class and structure
    expect(paper?.classList.contains('quotation-document')).toBe(true);

    const computed = window.getComputedStyle(paper);
    expect(computed.backgroundColor).toBe('#ffffff');
    expect(computed.color).toBe('#202124');
    expect(computed.maxWidth).toBe('793.401px'); // 210mm in pixels
  });

  it('renders with dark shadow in dark mode', () => {
    const darkTheme = createTheme({
      palette: {
        mode: 'dark',
        background: { paper: '#121212' },
        text: { primary: '#ffffff' },
      },
    });

    const { container } = render(
      <ThemeProvider theme={darkTheme}>
        <DocumentCanvas>
          <p>Document Content</p>
        </DocumentCanvas>
      </ThemeProvider>
    );

    const paper = container.querySelector('.quotation-document') as HTMLElement;
    expect(paper).not.toBeNull();
    expect(paper.classList.contains('quotation-document')).toBe(true);

    const computed = window.getComputedStyle(paper);
    expect(computed.backgroundColor).toBe('#ffffff');
    expect(computed.color).toBe('#202124');
    expect(computed.boxShadow).toBe('0 0 24px rgba(0, 0, 0, 0.45)');
  });

  it('renders with custom card shadow in light mode when provided', () => {
    const lightTheme = createTheme({
      palette: { mode: 'light' },
      customShadows: { card: '0 0 2px 0 rgba(145, 158, 171, 0.2)' },
    } as any);

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <DocumentCanvas>
          <p>Document Content</p>
        </DocumentCanvas>
      </ThemeProvider>
    );

    const paper = container.querySelector('.quotation-document') as HTMLElement;
    const computed = window.getComputedStyle(paper);
    expect(computed.boxShadow).toBe('0 0 2px 0 rgba(145, 158, 171, 0.2)');
  });
});
