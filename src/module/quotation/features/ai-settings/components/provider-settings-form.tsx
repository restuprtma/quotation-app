import { z } from 'zod';
import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  TextField,
  CardHeader,
  IconButton,
  Typography,
  CardContent,
  InputAdornment,
} from '@mui/material';

import {
  useGetAISettings,
  useUpdateAISettings,
  useTestAIConnection,
} from '../hooks/use-ai-settings';

const schema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  base_url: z.string().optional(),
  api_key: z.string().optional(), // Explicitly allow empty string
});

type FormValues = z.infer<typeof schema>;

export const ProviderSettingsForm = () => {
  const { data: settings, isLoading } = useGetAISettings();
  const updateSettings = useUpdateAISettings();
  const testConnection = useTestAIConnection();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { provider: 'gemini', model: '', base_url: '', api_key: '' },
  });

  useEffect(() => {
    if (settings) {
      reset({
        provider: settings.provider,
        model: settings.model,
        base_url: settings.base_url || '',
        api_key: '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormValues) =>
    updateSettings.mutate({
      ...data,
      api_key: data.api_key || '',
    });
  const handleTestConnection = () => {
    const data = getValues();
    testConnection.mutate({
      ...data,
      api_key: data.api_key || '',
    });
  };

  if (isLoading)
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6 }}>
          <Typography color="text.secondary">Loading settings...</Typography>
        </CardContent>
      </Card>
    );

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight="600">
            Connection Details
          </Typography>
        }
        subheader={
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            {settings?.credential_configured ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'success.main',
                  fontSize: '0.875rem',
                }}
              >
                <Icon icon="eva:checkmark-circle-2-fill" />
                <Typography variant="body2" color="success.main" fontWeight="500">
                  Credential Configured (Hint: {settings.key_hint})
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'warning.main',
                  fontSize: '0.875rem',
                }}
              >
                <Icon icon="eva:alert-triangle-fill" />
                <Typography variant="body2" color="warning.main" fontWeight="500">
                  No credential configured
                </Typography>
              </Box>
            )}
          </Stack>
        }
        sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}
      />
      <CardContent sx={{ pt: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Controller
                name="provider"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Provider"
                    placeholder="e.g. gemini, agentrouter"
                    error={!!errors.provider}
                    helperText={
                      errors.provider?.message ||
                      "Format protocol (contoh: 'agentrouter', 'gemini', 'openai')"
                    }
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="eva:cloud-upload-outline" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Model"
                    placeholder="e.g. gemini-1.5-flash"
                    error={!!errors.model}
                    helperText={errors.model?.message}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="eva:layers-outline" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Stack>

            <Controller
              name="base_url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Custom Base URL (Optional)"
                  placeholder="e.g. https://api.proxy.com/v1beta"
                  error={!!errors.base_url}
                  helperText={errors.base_url?.message}
                  fullWidth
                  variant="outlined"
                />
              )}
            />

            <Controller
              name="api_key"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  label="API Key"
                  placeholder={
                    settings?.credential_configured
                      ? 'Leave blank to keep current key'
                      : 'Enter API Key'
                  }
                  autoComplete="new-password"
                  error={!!errors.api_key}
                  helperText={
                    errors.api_key?.message || 'Keep this secure. Will not be visible after saving.'
                  }
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="eva:lock-outline" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          <Icon icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {testConnection.isSuccess && (
              <Alert
                severity="success"
                icon={<Icon icon="eva:checkmark-circle-2-outline" width={24} />}
              >
                Connection to {getValues('provider')} successful!
              </Alert>
            )}
            {testConnection.isError && (
              <Alert severity="error" icon={<Icon icon="eva:alert-triangle-outline" width={24} />}>
                Failed to connect to AI provider. Please check your credentials.
              </Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                pt: 2,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleTestConnection}
                disabled={testConnection.isPending}
                startIcon={<Icon icon="eva:wifi-outline" />}
              >
                {testConnection.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={updateSettings.isPending}
                startIcon={<Icon icon="eva:save-outline" />}
                disableElevation
              >
                Save Configuration
              </Button>
            </Box>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};
