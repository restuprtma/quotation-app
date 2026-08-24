import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetAISettings, useUpdateAISettings, useTestAIConnection } from '../hooks/use-ai-settings';

const schema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  api_key: z.string().optional().default(''), // Explicitly allow empty string
});

interface FormValues {
  provider: string;
  model: string;
  api_key: string;
}

export const ProviderSettingsForm = () => {
  const { data: settings, isLoading } = useGetAISettings();
  const updateSettings = useUpdateAISettings();
  const testConnection = useTestAIConnection();

  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: 'gemini',
      model: '',
      api_key: '', // MUST ALWAYS INIT EMPTY
    }
  });

  useEffect(() => {
    if (settings) {
      reset({
        provider: settings.provider,
        model: settings.model,
        api_key: '', // Explicitly ensure API key is never populated from backend
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormValues) => {
    // If api_key is empty string, backend preserves current key
    updateSettings.mutate(data);
  };

  const handleTestConnection = () => {
    const data = getValues();
    testConnection.mutate(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Assume standard UI library components here for input fields */}
      <h3>AI Provider Settings</h3>
      {settings?.credential_configured && (
        <p>Credential Configured (Hint: {settings.key_hint})</p>
      )}
      
      <Controller
        name="provider"
        control={control}
        render={({ field }) => (
          <div>
            <input {...field} placeholder="Provider (e.g. gemini)" />
            {errors.provider && <span style={{ color: 'red' }}>{errors.provider.message}</span>}
          </div>
        )}
      />
      <Controller
        name="model"
        control={control}
        render={({ field }) => (
          <div>
            <input {...field} placeholder="Model (e.g. gemini-1.5-flash)" />
            {errors.model && <span style={{ color: 'red' }}>{errors.model.message}</span>}
          </div>
        )}
      />
      <Controller
        name="api_key"
        control={control}
        render={({ field }) => (
          <div>
            <input 
              {...field} 
              type="password" 
              placeholder={settings?.credential_configured ? "Leave blank to keep current key" : "Enter API Key"} 
              autoComplete="new-password"
            />
            {errors.api_key && <span style={{ color: 'red' }}>{errors.api_key.message}</span>}
          </div>
        )}
      />

      <button type="button" onClick={handleTestConnection} disabled={testConnection.isPending}>
        {testConnection.isPending ? 'Testing...' : 'Test Connection'}
      </button>
      <button type="submit" disabled={updateSettings.isPending}>
        Save
      </button>
      
      {testConnection.isSuccess && <p style={{color: 'green'}}>Connection Successful</p>}
      {testConnection.isError && <p style={{color: 'red'}}>Connection Failed</p>}
    </form>
  );
};
