import type { SignPublicQuotationPayload } from '../types/public';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { SignatureCanvas } from './signature-canvas';

type FormValues = {
  consent: boolean;
};

type Props = {
  clientPic?: string;
  clientCompany?: string;
  onSubmit: (payload: SignPublicQuotationPayload) => Promise<void>;
  isSubmitting?: boolean;
};

export function SignatureForm({ clientPic, clientCompany, onSubmit, isSubmitting = false }: Props) {
  const { t } = useTranslate('quotation');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      consent: false,
    },
  });

  const onFormSubmit = async (values: FormValues) => {
    if (!signatureData) {
      setSignatureError(t('public.signatureRequired'));
      return;
    }
    setSignatureError(null);

    await onSubmit({
      signature_data: signatureData,
      consent: values.consent,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} data-testid="signature-form">
      <Stack spacing={3}>
        {(clientPic || clientCompany) && (
          <Alert severity="info" icon={<Iconify icon="solar:user-id-bold" />}>
            <Typography variant="subtitle2">Menandatangani sebagai:</Typography>
            <Typography variant="body2">
              {[clientPic, clientCompany].filter(Boolean).join(' • ')}
            </Typography>
          </Alert>
        )}

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t('public.approval')}</Typography>
          <SignatureCanvas
            disabled={isSubmitting}
            onChange={(dataUrl) => {
              setSignatureData(dataUrl);
              if (dataUrl) setSignatureError(null);
            }}
          />
          {signatureError && <FormHelperText error>{signatureError}</FormHelperText>}
        </Stack>

        <Controller
          name="consent"
          control={control}
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <Stack>
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} disabled={isSubmitting} />}
                label={
                  <Typography variant="body2" color="text.secondary">
                    {t('public.consentLabel')}
                  </Typography>
                }
              />
              {fieldState.error && (
                <FormHelperText error>Consent is required to proceed</FormHelperText>
              )}
            </Stack>
          )}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? t('public.signing') : t('public.submitSignature')}
        </Button>
      </Stack>
    </form>
  );
}
