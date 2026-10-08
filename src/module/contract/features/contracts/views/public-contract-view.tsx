import { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';

import { usePublicContract, useSignPublicContract } from '../hooks/use-contracts';

export function PublicContractView({ token }: { token: string }) {
  const { data: contract, isLoading } = usePublicContract(token);
  const signContract = useSignPublicContract(token);

  const [signatureOpen, setSignatureOpen] = useState(false);
  const signaturePad = useRef<SignaturePad>(null);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Stack spacing={3}>
          <Skeleton height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h5" color="error">
          Contract not found or invalid token.
        </Typography>
      </Container>
    );
  }

  const isSigned = contract.status === 'signed';

  const handleSign = async () => {
    if (!signaturePad.current?.isEmpty()) {
      const signatureDataURL = signaturePad.current?.toDataURL() || '';
      try {
        await signContract.mutateAsync({ signature_data_url: signatureDataURL });
        toast.success('Contract signed successfully!');
        setSignatureOpen(false);
      } catch (err: any) {
        toast.error(err.message || 'Failed to sign contract');
      }
    } else {
      toast.error('Please provide a signature');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Card sx={{ p: 5 }}>
        <Stack spacing={4}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Contract Agreement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contract No: {contract.contract_number}
              </Typography>
            </Box>

            {isSigned ? (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'success.alpha8',
                  borderRadius: 1,
                  color: 'success.dark',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Iconify icon="solar:check-circle-bold" />
                <Typography variant="subtitle2">Signed</Typography>
              </Box>
            ) : (
              <Button variant="contained" color="primary" onClick={() => setSignatureOpen(true)}>
                Sign Contract
              </Button>
            )}
          </Stack>

          <Divider />

          {/* Document Content rendered securely, escaping HTML wasn't explicitly asked for the raw text but normally we'd format it properly. */}
          <Section title="Scope of Work" content={contract.scope_data} />
          <Section title="Deliverables" content={contract.deliverables_data} />
          <Section title="Commercial Terms" content={contract.commercial_terms} />
          <Section title="Payment Terms" content={contract.payment_terms} />
          <Section title="Timeline" content={contract.timeline_data} />
          <Section title="Additional Terms" content={contract.additional_terms} />
        </Stack>
      </Card>

      <Dialog open={signatureOpen} onClose={() => setSignatureOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sign Contract</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please sign below to accept the terms of this contract.
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: '#cbd5e1',
              borderRadius: 1,
              bgcolor: '#ffffff',
            }}
          >
            <SignaturePad
              ref={signaturePad}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas',
                style: { width: '100%', height: '100%' },
              }}
            />
          </Box>
          <Button size="small" onClick={() => signaturePad.current?.clear()} sx={{ mt: 1 }}>
            Clear Signature
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSign} disabled={signContract.isPending}>
            Submit Signature
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function Section({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </Typography>
    </Box>
  );
}
