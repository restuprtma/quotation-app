// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SignatureCanvas } from './signature-canvas';

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string) => key,
  }),
}));

afterEach(cleanup);


describe('SignatureCanvas', () => {
  it('renders canvas with accessible role and aria-label', () => {
    render(<SignatureCanvas />);
    const canvas = screen.getByLabelText('public.signatureCanvas');
    expect(canvas).not.toBeNull();
  });

  it('renders container with white paper background and hardened border', () => {
    render(<SignatureCanvas />);
    const canvas = screen.getByLabelText('public.signatureCanvas');
    const container = canvas.parentElement as HTMLElement;
    const computed = window.getComputedStyle(container);
    expect(computed.backgroundColor).toBe('#ffffff');
    expect(computed.borderColor).toBe('#cbd5e1');
  });
});

