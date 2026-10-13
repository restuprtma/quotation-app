// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { SignatureCanvas } from './signature-canvas';

const mockCropCanvas = vi.fn();
vi.mock('../utils/canvas-crop', () => ({
  cropCanvasToBoundingBox: (...args: unknown[]) => mockCropCanvas(...args),
}));

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string) => key,
  }),
}));

afterEach(cleanup);

describe('SignatureCanvas', () => {
  beforeEach(() => {
    mockCropCanvas.mockReset();
  });

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

  it('configures lineWidth to 3.2 and calls cropCanvasToBoundingBox on pointer up', () => {
    const mockContext = {
      scale: vi.fn(),
      lineCap: '',
      lineJoin: '',
      lineWidth: 0,
      strokeStyle: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    };
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 400,
      height: 200,
      left: 0,
      top: 0,
    });
    mockCropCanvas.mockReturnValue('data:image/png;base64,cropped_signature');

    const handleChange = vi.fn();
    render(<SignatureCanvas onChange={handleChange} />);
    const canvas = screen.getByLabelText('public.signatureCanvas');

    expect(mockContext.lineWidth).toBe(3.2);

    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 20, clientY: 20, pointerId: 1 });

    expect(mockCropCanvas).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith('data:image/png;base64,cropped_signature');
  });
});
