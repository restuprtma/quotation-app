import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

export interface SignatureStampPreviewProps {
  directorName?: string;
  directorTitle?: string;
  directorSignatureData?: string | null;
  companyStampData?: string | null;
}

export function SignatureStampPreview({
  directorName = 'Yulianto Frandi',
  directorTitle = 'Direksi Venturo Pro',
  directorSignatureData,
  companyStampData,
}: SignatureStampPreviewProps) {
  const hasContent = Boolean(directorSignatureData || companyStampData);

  return (
    <Card
      data-testid="signature-stamp-preview"
      variant="outlined"
      sx={{
        p: 3,
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        maxWidth: 320,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, letterSpacing: 1 }}>
        Pratinjau Dokumen
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Hormat Kami,
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ mb: 1 }}>
        PT Venturo Pro Solusindo
      </Typography>

      {/* Signature & Stamp Overlay Simulation */}
      <Box
        sx={{
          position: 'relative',
          width: 220,
          height: 110,
          my: 1,
          border: hasContent ? 'none' : '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: hasContent ? 'transparent' : 'grey.50',
          overflow: 'hidden',
        }}
      >
        {!hasContent && (
          <Typography variant="caption" color="text.disabled" align="center">
            Pratinjau Tanda Tangan & Stempel
          </Typography>
        )}

        {/* Company Stamp in background (slightly tilted, multiply blend mode) */}
        {companyStampData && (
          <Box
            component="img"
            src={companyStampData}
            alt="Stempel Perusahaan"
            data-testid="preview-company-stamp"
            sx={{
              position: 'absolute',
              left: 10,
              top: 0,
              width: 110,
              height: 110,
              objectFit: 'contain',
              opacity: 0.85,
              transform: 'rotate(-8deg)',
              pointerEvents: 'none',
              mixBlendMode: 'multiply',
            }}
          />
        )}

        {/* Director Signature in foreground */}
        {directorSignatureData && (
          <Box
            component="img"
            src={directorSignatureData}
            alt="Tanda Tangan Direksi"
            data-testid="preview-director-signature"
            sx={{
              position: 'absolute',
              left: 0,
              top: 15,
              width: 190,
              height: 85,
              objectFit: 'contain',
            }}
          />
        )}
      </Box>

      {/* Signer Info */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {directorName || 'Yulianto Frandi'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {directorTitle || 'Direksi Venturo Pro'}
        </Typography>
      </Box>
    </Card>
  );
}
