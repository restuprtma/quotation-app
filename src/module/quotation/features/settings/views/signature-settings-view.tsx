import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { toast } from 'sonner';

import {
  useSignatureSettings,
  useUpdateSignatureSettings,
} from '../hooks/use-signature-settings';
import { SignatureStampPreview } from '../components/signature-stamp-preview';

function DrawingCanvas({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  const configureContext = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1f2937';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    configureContext(context);
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    configureContext(ctx);
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
    setHasStroke(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStroke(false);
    onChange('');
  };

  return (
    <Box data-testid="signature-canvas-container" sx={{ width: '100%' }}>
      {value && !hasStroke ? (
        <Box
          sx={{
            p: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: '#ffffff',
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src={value}
            alt="Tanda Tangan Saat Ini"
            sx={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', mx: 'auto' }}
          />
          <Box sx={{ mt: 1 }}>
            <Button size="small" variant="outlined" color="error" onClick={handleClear}>
              Gambar Ulang
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 180,
              border: '1px dashed',
              borderColor: '#cbd5e1',
              borderRadius: 1.5,
              bgcolor: '#ffffff',
              overflow: 'hidden',
              touchAction: 'none',
            }}
          >
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ position: 'absolute', top: 8, left: 12, pointerEvents: 'none' }}
            >
              Goreskan tanda tangan Anda di area putih ini
            </Typography>
            <canvas
              ref={canvasRef}
              width={400}
              height={180}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              style={{
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
          </Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              Gunakan mouse, stylus, atau sentuhan jari.
            </Typography>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={handleClear}
              disabled={!hasStroke && !value}
            >
              Hapus / Bersihkan
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export function SignatureSettingsView() {
  const { data: settingsData, isLoading } = useSignatureSettings();
  const updateMutation = useUpdateSignatureSettings();

  const [directorName, setDirectorName] = useState(
    settingsData?.director_name ?? 'Yulianto Frandi'
  );
  const [directorTitle, setDirectorTitle] = useState(
    settingsData?.director_title ?? 'Direksi Venturo Pro'
  );
  const [directorSignatureData, setDirectorSignatureData] = useState(
    settingsData?.director_signature_data ?? ''
  );
  const [companyStampData, setCompanyStampData] = useState(
    settingsData?.company_stamp_data ?? ''
  );

  const [sigTab, setSigTab] = useState(0);

  useEffect(() => {
    if (settingsData) {
      if (settingsData.director_name !== undefined) {
        setDirectorName(settingsData.director_name);
      }
      if (settingsData.director_title !== undefined) {
        setDirectorTitle(settingsData.director_title);
      }
      if (settingsData.director_signature_data !== undefined) {
        setDirectorSignatureData(settingsData.director_signature_data);
      }
      if (settingsData.company_stamp_data !== undefined) {
        setCompanyStampData(settingsData.company_stamp_data);
      }
    }
  }, [settingsData]);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast.error('Berkas harus berupa gambar berformat PNG');
        event.target.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran berkas melebihi batas maksimal 2MB');
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        director_name: directorName,
        director_title: directorTitle,
        director_signature_data: directorSignatureData,
        company_stamp_data: companyStampData,
      });
      toast.success('Pengaturan tanda tangan & stempel berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan tanda tangan');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Tanda Tangan & Stempel Perusahaan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Konfigurasikan tanda tangan direksi dan stempel resmi perusahaan untuk disematkan
            otomatis pada dokumen penawaran harga.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          alignItems="flex-start"
        >
          {/* Left Form: Fields, Signature, Stamp */}
          <Stack spacing={3} sx={{ flex: 1, width: '100%' }}>
            {/* Director Information Card */}
            <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Informasi Direksi
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Nama Lengkap Direksi"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="Yulianto Frandi"
                />
                <TextField
                  fullWidth
                  label="Jabatan / Title Direksi"
                  value={directorTitle}
                  onChange={(e) => setDirectorTitle(e.target.value)}
                  placeholder="Direksi Venturo Pro"
                />
              </Stack>
            </Card>

            {/* Director Signature Card */}
            <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Tanda Tangan Direksi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Pilih metode tanda tangan langsung atau unggah berkas PNG transparan.
              </Typography>

              <Tabs
                value={sigTab}
                onChange={(_, val) => setSigTab(val)}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Gambar Langsung" />
                <Tab label="Unggah PNG" />
              </Tabs>

              {sigTab === 0 ? (
                <DrawingCanvas
                  value={directorSignatureData}
                  onChange={setDirectorSignatureData}
                />
              ) : (
                <Box data-testid="signature-file-upload">
                  {directorSignatureData ? (
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        bgcolor: '#ffffff',
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        component="img"
                        src={directorSignatureData}
                        alt="Tanda Tangan Terunggah"
                        sx={{
                          maxHeight: 120,
                          maxWidth: '100%',
                          objectFit: 'contain',
                          mx: 'auto',
                        }}
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                        sx={{ mt: 1.5 }}
                      >
                        <Button component="label" variant="outlined" size="small">
                          Ganti File PNG
                          <input
                            type="file"
                            accept="image/png"
                            hidden
                            onChange={(e) =>
                              handleFileUpload(e, setDirectorSignatureData)
                            }
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => setDirectorSignatureData('')}
                        >
                          Hapus
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box
                      component="label"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3,
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        bgcolor: 'background.neutral',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <input
                        type="file"
                        accept="image/png"
                        hidden
                        onChange={(e) =>
                          handleFileUpload(e, setDirectorSignatureData)
                        }
                      />
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        Pilih File PNG Tanda Tangan
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Format PNG transparan, ukuran maks. 2MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Card>

            {/* Company Stamp Card */}
            <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Stempel Resmi Perusahaan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Unggah file gambar stempel resmi perusahaan dalam format PNG transparan.
              </Typography>

              <Box data-testid="stamp-file-upload">
                {companyStampData ? (
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      bgcolor: '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      component="img"
                      src={companyStampData}
                      alt="Stempel Perusahaan Terunggah"
                      sx={{
                        maxHeight: 120,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        mx: 'auto',
                      }}
                    />
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                      sx={{ mt: 1.5 }}
                    >
                      <Button component="label" variant="outlined" size="small">
                        Ganti Stempel PNG
                        <input
                          type="file"
                          accept="image/png"
                          hidden
                          onChange={(e) => handleFileUpload(e, setCompanyStampData)}
                        />
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setCompanyStampData('')}
                      >
                        Hapus
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    component="label"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <input
                      type="file"
                      accept="image/png"
                      hidden
                      onChange={(e) => handleFileUpload(e, setCompanyStampData)}
                    />
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Pilih File PNG Stempel
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Format PNG transparan, rasio 1:1, ukuran maks. 2MB
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>

            {/* Save Button */}
            <Box>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </Box>
          </Stack>

          {/* Right Live Simulation Preview */}
          <Stack
            spacing={2}
            sx={{
              width: { xs: '100%', md: 340 },
              position: { md: 'sticky' },
              top: { md: 24 },
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Simulasi Tampilan Dokumen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tampilan berikut adalah representasi overlay tanda tangan dan stempel
              sebagaimana akan dicetak pada dokumen quotation resmi.
            </Typography>
            <SignatureStampPreview
              directorName={directorName}
              directorTitle={directorTitle}
              directorSignatureData={directorSignatureData}
              companyStampData={companyStampData}
            />
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
