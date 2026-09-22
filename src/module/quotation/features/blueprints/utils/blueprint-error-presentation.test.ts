import { describe, it, expect } from 'vitest';
import { presentBlueprintError } from './blueprint-error-presentation';

describe('presentBlueprintError', () => {
  it('returns null for empty, null, or undefined code', () => {
    expect(presentBlueprintError(null)).toBeNull();
    expect(presentBlueprintError(undefined)).toBeNull();
    expect(presentBlueprintError('')).toBeNull();
    expect(presentBlueprintError('   ')).toBeNull();
  });

  it('maps provider_configuration to configuration category with settings action', () => {
    const result = presentBlueprintError('provider_configuration');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('configuration');
    expect(result?.action).toBe('settings');
    expect(result?.title.toLowerCase()).toContain('konfigurasi');
  });

  it('maps provider_invalid_credential to credential category with settings action', () => {
    const result = presentBlueprintError('provider_invalid_credential');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('credential');
    expect(result?.action).toBe('settings');
    expect(result?.title.toLowerCase()).toMatch(/kredensial|api key/i);
  });

  it('maps provider_unavailable to availability category with retry action, NOT configuration', () => {
    const result = presentBlueprintError('provider_unavailable');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('availability');
    expect(result?.action).toBe('retry');
    expect(result?.title.toLowerCase()).not.toContain('belum diatur');
    expect(result?.title.toLowerCase()).not.toContain('konfigurasi');
  });

  it('maps provider_rate_limited to rate_limit category with retry action', () => {
    const result = presentBlueprintError('provider_rate_limited');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('rate_limit');
    expect(result?.action).toBe('retry');
    expect(result?.title.toLowerCase()).toMatch(/batas|rate limit/i);
  });

  it('maps provider_timeout to timeout category with retry action', () => {
    const result = presentBlueprintError('provider_timeout');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('timeout');
    expect(result?.action).toBe('retry');
    expect(result?.title.toLowerCase()).toMatch(/waktu|timeout/i);
  });

  it('maps provider_request_rejected to request category with manual action', () => {
    const result = presentBlueprintError('provider_request_rejected');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('request');
    expect(result?.action).toBe('manual');
  });

  it('maps provider_payload_too_large to request or prompt category with manual action', () => {
    const result = presentBlueprintError('provider_payload_too_large');
    expect(result).not.toBeNull();
    expect(['request', 'prompt']).toContain(result?.category);
    expect(result?.action).toBe('manual');
  });

  it('maps prompt_construction_failed to prompt category without directing to settings', () => {
    const result = presentBlueprintError('prompt_construction_failed');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('prompt');
    expect(result?.action).not.toBe('settings');
    expect(result?.title.toLowerCase()).not.toContain('konfigurasi');
  });

  it('maps invalid_schema to generic category with retry action', () => {
    const result = presentBlueprintError('invalid_schema');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('generic');
    expect(['retry', 'manual']).toContain(result?.action);
  });

  it('maps interrupted to generic category with retry action', () => {
    const result = presentBlueprintError('interrupted');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('generic');
    expect(result?.action).toBe('retry');
  });

  it('maps pipeline_blocked to generic category with refresh action', () => {
    const result = presentBlueprintError('pipeline_blocked');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('generic');
    expect(['refresh', 'manual']).toContain(result?.action);
  });

  it('supports legacy alias provider_config_missing mapped to configuration', () => {
    const result = presentBlueprintError('provider_config_missing');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('configuration');
    expect(result?.action).toBe('settings');
  });

  it('supports legacy alias unauthorized mapped to credential', () => {
    const result = presentBlueprintError('unauthorized');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('credential');
    expect(result?.action).toBe('settings');
  });

  it('handles case-insensitive and trimmed error codes', () => {
    const resultUpper = presentBlueprintError(' PROVIDER_UNAVAILABLE ');
    expect(resultUpper?.category).toBe('availability');

    const resultConfig = presentBlueprintError('PROVIDER_CONFIGURATION');
    expect(resultConfig?.category).toBe('configuration');
  });

  it('returns generic presentation for unknown code strings', () => {
    const result = presentBlueprintError('some_unknown_internal_code');
    expect(result).not.toBeNull();
    expect(result?.category).toBe('generic');
    expect(result?.action).toBe('retry');
  });
});
