import type { SignPublicQuotationPayload } from '../types/public';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import { SignatureCanvas } from './signature-canvas';

type FormValues = {
  signer_name: string;
  signer_email: string;
  consent: boolean;
};

type Props = {
  onSubmit: (payload: SignPublicQuotationPayload) => Promise<void>;
  isSubmitting?: boolean;
};

export function SignatureForm({ onSubmit, isSubmitting = false }: Props) {
  const { t } = useTranslate('quotation');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      signer_name: '',
      signer_email: '',
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
      signer_name: values.signer_name.trim(),
      signer_email: values.signer_email.trim(),
      signature_data: signatureData,
      consent: values.consent,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} data-testid="signature-form">
      <Stack spacing={3}>
        <Controller
          name="signer_name"
          control={control}
          rules={{ required: `${t('public.signerName')} is required` }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t('public.signerName')}
              fullWidth
              disabled={isSubmitting}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="signer_email"
          control={control}
          rules={{
            required: `${t('public.signerEmail')} is required`,
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              type="email"
              label={t('public.signerEmail')}
              fullWidth
              disabled={isSubmitting}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

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
