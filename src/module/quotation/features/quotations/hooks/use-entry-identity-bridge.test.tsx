import type { QuotationEntryIdentity } from '../types/quotation-entry';

import { useForm } from 'react-hook-form';
import { it, vi, expect, describe } from 'vitest';
// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';

import { useEntryIdentityBridge } from './use-entry-identity-bridge';

describe('useEntryIdentityBridge', () => {
  type TestFormValues = {
    subject: string;
    client_id: string;
    client_company_name: string;
    client_name: string;
    unrelated_field?: string;
    custom_title?: string;
  };

  it('does not call onChange on initial mount if values do not change', () => {
    const onChange = vi.fn();

    renderHook(() => {
      const { control } = useForm<TestFormValues>({
        defaultValues: {
          subject: 'Initial Subject',
          client_id: 'client-1',
          client_company_name: 'Acme Corp',
          client_name: 'John Doe',
        },
      });

      useEntryIdentityBridge({ control, onChange });
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with mapped QuotationEntryIdentity when identity fields change', () => {
    const onChange = vi.fn();

    const { result } = renderHook(() => {
      const form = useForm<TestFormValues>({
        defaultValues: {
          subject: 'Initial Subject',
          client_id: 'client-1',
          client_company_name: 'Acme Corp',
          client_name: 'John Doe',
        },
      });

      useEntryIdentityBridge({ control: form.control, onChange });
      return form;
    });

    act(() => {
      result.current.setValue('subject', 'Updated Subject');
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith<[QuotationEntryIdentity]>({
      project_name: 'Updated Subject',
      client_id: 'client-1',
      client_company_name: 'Acme Corp',
      pic_name: 'John Doe',
    });

    act(() => {
      result.current.setValue('client_company_name', 'Globex Corp');
      result.current.setValue('client_id', 'client-2');
    });

    expect(onChange).toHaveBeenLastCalledWith<[QuotationEntryIdentity]>({
      project_name: 'Updated Subject',
      client_id: 'client-2',
      client_company_name: 'Globex Corp',
      pic_name: 'John Doe',
    });
  });

  it('does not call onChange when unrelated fields change', () => {
    const onChange = vi.fn();

    const { result } = renderHook(() => {
      const form = useForm<TestFormValues>({
        defaultValues: {
          subject: 'Initial Subject',
          client_id: 'client-1',
          client_company_name: 'Acme Corp',
          client_name: 'John Doe',
          unrelated_field: 'val1',
        },
      });

      useEntryIdentityBridge({ control: form.control, onChange });
      return form;
    });

    act(() => {
      result.current.setValue('unrelated_field', 'val2');
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports custom map option', () => {
    const onChange = vi.fn();

    const { result } = renderHook(() => {
      const form = useForm<TestFormValues>({
        defaultValues: {
          subject: '',
          client_id: '',
          client_company_name: '',
          client_name: '',
          custom_title: 'Custom Title',
        },
      });

      useEntryIdentityBridge({
        control: form.control,
        onChange,
        map: (values) => ({
          project_name: values.custom_title ?? '',
          client_id: values.client_id ?? '',
          client_company_name: values.client_company_name ?? '',
          pic_name: values.client_name ?? '',
        }),
      });
      return form;
    });

    act(() => {
      result.current.setValue('custom_title', 'New Custom Title');
    });

    expect(onChange).toHaveBeenCalledWith<[QuotationEntryIdentity]>({
      project_name: 'New Custom Title',
      client_id: '',
      client_company_name: '',
      pic_name: '',
    });
  });
});
