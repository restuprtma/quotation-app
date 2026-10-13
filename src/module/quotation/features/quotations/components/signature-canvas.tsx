import type { BoxProps } from '@mui/material/Box';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { cropCanvasToBoundingBox } from '../utils/canvas-crop';

type Props = {
  disabled?: boolean;
  onChange?: (dataUrl: string | null) => void;
  sx?: BoxProps['sx'];
};

export function SignatureCanvas({ disabled = false, onChange, sx }: Props) {
  const { t } = useTranslate('quotation');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasStroke, setHasStroke] = useState(false);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = bounds.width * ratio;
      canvas.height = bounds.height * ratio;
      const context = canvas.getContext('2d');
      context?.scale(ratio, ratio);
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 3.2;
        context.strokeStyle = '#1f2937';
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const { x, y } = point(event);
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(x, y);
    drawingRef.current = true;
    setHasStroke(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = cropCanvasToBoundingBox(canvas) ?? canvas.toDataURL('image/png');
    onChange?.(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange?.(null);
  };

  return (
    <Box sx={sx}>
      <Stack spacing={1.5}>
        <Box
          sx={{
            position: 'relative',
            height: { xs: 170, sm: 210 },
            overflow: 'hidden',
            border: '1px dashed',
            borderColor: '#cbd5e1',
            borderRadius: 1.5,
            bgcolor: '#ffffff',
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ position: 'absolute', top: 12, left: 12 }}
          >
            {t('public.signatureCanvas')}
          </Typography>
          <canvas
            ref={canvasRef}
            aria-label={t('public.signatureCanvas')}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: '100%',
              height: '100%',
              cursor: disabled ? 'default' : 'crosshair',
              touchAction: 'none',
            }}
          />
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {t('public.signatureHint')}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={clear}
            disabled={disabled || !hasStroke}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            {t('buttons.clearSignature')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
