// @vitest-environment happy-dom
import { it, expect, describe, beforeEach } from 'vitest';

import { cropCanvasToBoundingBox } from './canvas-crop';

class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;

  fillStyle = '#000000';

  private buffer: Uint8ClampedArray;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.buffer = new Uint8ClampedArray((canvas.width || 1) * (canvas.height || 1) * 4);
  }

  fillRect(x: number, y: number, w: number, h: number) {
    const { width, height } = this.canvas;
    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          this.buffer[idx] = 0;
          this.buffer[idx + 1] = 0;
          this.buffer[idx + 2] = 0;
          this.buffer[idx + 3] = 255;
        }
      }
    }
  }

  getImageData(_sx: number, _sy: number, sw: number, sh: number) {
    return {
      data: this.buffer,
      width: sw,
      height: sh,
    };
  }

  drawImage(
    _image: CanvasImageSource,
    _sx: number,
    _sy: number,
    _sw: number,
    _sh: number,
    _dx: number,
    _dy: number,
    _dw: number,
    _dh: number
  ) {
    // no-op for mock
  }
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = function getMockContext(contextId: string) {
    if (contextId === '2d') {
      if (!(this as any)._mockCtx) {
        (this as any)._mockCtx = new MockCanvasRenderingContext2D(this);
      }
      return (this as any)._mockCtx;
    }
    return null;
  } as any;

  HTMLCanvasElement.prototype.toDataURL = function getMockDataUrl(_type?: string) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  };
});

describe('cropCanvasToBoundingBox', () => {
  it('returns null if canvas context is not available or canvas is empty', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    // An untouched canvas has all alpha = 0
    const result = cropCanvasToBoundingBox(canvas);
    expect(result).toBeNull();
  });

  it('returns null if canvas width or height is 0', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    const result = cropCanvasToBoundingBox(canvas);
    expect(result).toBeNull();
  });

  it('returns null if 2d context cannot be retrieved', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    canvas.getContext = () => null;
    const result = cropCanvasToBoundingBox(canvas);
    expect(result).toBeNull();
  });

  it('crops active drawing area with padding and returns data URL', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    // Draw a small black rectangle at (50, 50) of size 20x20
    ctx.fillStyle = '#000000';
    ctx.fillRect(50, 50, 20, 20);

    const croppedDataUrl = cropCanvasToBoundingBox(canvas, 5);
    expect(croppedDataUrl).toBeDefined();
    expect(typeof croppedDataUrl).toBe('string');
    expect(croppedDataUrl).toContain('data:image/png;base64');
  });

  it('crops active drawing area with default padding', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillRect(10, 10, 10, 10);

    const croppedDataUrl = cropCanvasToBoundingBox(canvas);
    expect(croppedDataUrl).toBeDefined();
    expect(croppedDataUrl).toContain('data:image/png;base64');
  });
});
