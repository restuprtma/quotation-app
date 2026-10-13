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

        {/* Director Signature (rendered underneath stamp) */}
        {directorSignatureData && (
          <Box
            component="img"
            src={directorSignatureData}
            alt="Tanda Tangan Direksi"
            data-testid="preview-director-signature"
            sx={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              maxWidth: 180,
              maxHeight: 85,
              objectFit: 'contain',
              zIndex: 1,
            }}
          />
        )}

        {/* Company Stamp Overlay (stamped over signature with multiply blend mode) */}
        {companyStampData && (
          <Box
            component="img"
            src={companyStampData}
            alt="Stempel Perusahaan"
            data-testid="preview-company-stamp"
            sx={{
              position: 'absolute',
              left: 55,
              top: -5,
              width: 110,
              height: 110,
              objectFit: 'contain',
              opacity: 0.88,
              transform: 'rotate(-8deg)',
              pointerEvents: 'none',
              mixBlendMode: 'multiply',
              zIndex: 2,
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
