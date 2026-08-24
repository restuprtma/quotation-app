import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useGetAISettings, useUpdateAISettings, useTestAIConnection } from '../hooks/use-ai-settings';

interface FormValues {
  provider: string;
  model: string;
  api_key: string;
}

export const ProviderSettingsForm = () => {
  const { data: settings, isLoading } = useGetAISettings();
  const updateSettings = useUpdateAISettings();
  const testConnection = useTestAIConnection();

  const { control, handleSubmit, reset, getValues } = useForm<FormValues>({
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
        render={({ field }) => <input {...field} placeholder="Provider (e.g. gemini)" />}
      />
      <Controller
        name="model"
        control={control}
        render={({ field }) => <input {...field} placeholder="Model (e.g. gemini-1.5-flash)" />}
      />
      <Controller
        name="api_key"
        control={control}
        render={({ field }) => (
          <input 
            {...field} 
            type="password" 
            placeholder={settings?.credential_configured ? "Leave blank to keep current key" : "Enter API Key"} 
            autoComplete="new-password"
          />
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
