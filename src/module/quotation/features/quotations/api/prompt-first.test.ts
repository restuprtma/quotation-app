import { it, vi, expect, describe } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import type { MeetingQuotationPayload } from '../types/prompt-first';

import {
  getPromptIssues,
  patchPromptQuotation,
  createQuotationFromMeeting,
  revisePromptQuotationSection,
} from './prompt-first';

describe('Prompt-first Quotation API', () => {
  it('endpoints.quotation.quotations.fromMeeting is configured correctly', () => {
    expect(endpoints.quotation.quotations.fromMeeting).toBe(
      '/quotation/v1/quotations/from-meeting'
    );
  });

  it('createQuotationFromMeeting sends canonical payload without synthesizing client_name', async () => {
    const canonicalPayload: MeetingQuotationPayload = {
      project_name: 'Website Redesign',
      client_id: '40000000-0000-0000-0000-000000000001',
      client_company_name: 'PT Acme Sukses',
      pic_name: 'Budi Santoso',
      meeting_notes: 'Meeting with Budi from PT Acme regarding website redesign project.',
      idempotency_key: '550e8400-e29b-41d4-a716-446655440000',
    };

    const mockResponse = {
      quotation_id: '60000000-0000-0000-0000-000000000001',
      revision_id: '70000000-0000-0000-0000-000000000001',
      quotation_number: 'QUO-2026-0001',
      content_html: '<article>Quotation</article>',
      content_version: 1,
      state_version: 1,
      prompt_state: {
        schema_version: 'prompt_quotation_v1',
        meeting_notes: canonicalPayload.meeting_notes,
        scope: [],
        team: [],
        issues: [],
        readiness: 'incomplete',
      },
      issues: [],
      readiness: 'incomplete',
      idempotent_replay: false,
    };

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        data: mockResponse,
        message: 'Quotation draft created',
      },
    });

    const signal = new AbortController().signal;
    const result = await createQuotationFromMeeting(canonicalPayload, signal);

    expect(postSpy).toHaveBeenCalledWith(
      '/quotation/v1/quotations/from-meeting',
      canonicalPayload,
      { signal }
    );
    // client_name must NOT be synthesized or present in the outgoing payload
    expect(canonicalPayload.client_name).toBeUndefined();
    expect(postSpy.mock.calls[0][1]).not.toHaveProperty('client_name');
    expect(result).toEqual(mockResponse);
  });

  it('createQuotationFromMeeting accepts legacy payload containing client_name', async () => {
    const legacyPayload: MeetingQuotationPayload = {
      client_name: 'Legacy Client',
      meeting_notes: 'Legacy meeting note text',
      idempotency_key: '550e8400-e29b-41d4-a716-446655440001',
    };

    const mockResponse = {
      quotation_id: '60000000-0000-0000-0000-000000000002',
      revision_id: '70000000-0000-0000-0000-000000000002',
      quotation_number: 'QUO-2026-0002',
      content_html: '<article>Quotation</article>',
      content_version: 1,
      state_version: 1,
      prompt_state: {
        schema_version: 'prompt_quotation_v1',
        meeting_notes: legacyPayload.meeting_notes,
        scope: [],
        team: [],
        issues: [],
        readiness: 'incomplete',
      },
      issues: [],
      readiness: 'incomplete',
      idempotent_replay: false,
    };

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        data: mockResponse,
        message: 'Quotation draft created',
      },
    });

    const result = await createQuotationFromMeeting(legacyPayload);

    expect(postSpy).toHaveBeenCalledWith(
      '/quotation/v1/quotations/from-meeting',
      legacyPayload,
      { signal: undefined }
    );
    expect(result).toEqual(mockResponse);
  });

  it('revisePromptQuotationSection sends payload and unwraps data', async () => {
    const quotationID = '60000000-0000-0000-0000-000000000001';
    const payload = {
      revision_id: '70000000-0000-0000-0000-000000000001',
      content_version: 1,
      state_version: 1,
      instruction: 'Add testing phase to scope',
      target_section: 'scope' as const,
    };

    const mockResponse = {
      quotation_id: quotationID,
      revision_id: payload.revision_id,
      content_html: '<article>Revised</article>',
      content_version: 2,
      state_version: 2,
      prompt_state: {} as any,
      issues: [],
      readiness: 'priceable',
      calculation: {} as any,
    };

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        data: mockResponse,
        message: 'Section revised',
      },
    });

    const result = await revisePromptQuotationSection(quotationID, payload);
    expect(postSpy).toHaveBeenCalledWith(
      endpoints.quotation.quotations.reviseSection(quotationID),
      payload,
      { signal: undefined }
    );
    expect(result).toEqual(mockResponse);
  });

  it('patchPromptQuotation sends patch operations and unwraps data', async () => {
    const quotationID = '60000000-0000-0000-0000-000000000001';
    const payload = {
      revision_id: '70000000-0000-0000-0000-000000000001',
      content_version: 1,
      state_version: 1,
      operations: [{ type: 'set_duration_months' as const, duration_months: 6 }],
    };

    const mockResponse = {
      quotation_id: quotationID,
      revision_id: payload.revision_id,
      content_html: '<article>Patched</article>',
      content_version: 2,
      state_version: 2,
      prompt_state: {} as any,
      issues: [],
      readiness: 'priceable',
      calculation: {} as any,
    };

    const patchSpy = vi.spyOn(axios, 'patch').mockResolvedValueOnce({
      data: {
        data: mockResponse,
        message: 'Prompt state patched',
      },
    });

    const result = await patchPromptQuotation(quotationID, payload);
    expect(patchSpy).toHaveBeenCalledWith(
      endpoints.quotation.quotations.promptState(quotationID),
      payload,
      { signal: undefined }
    );
    expect(result).toEqual(mockResponse);
  });

  it('getPromptIssues extracts issues array or error details from API error', () => {
    const structuredError = {
      response: {
        data: {
          data: {
            issues: [
              {
                code: 'client_company.missing',
                field: 'client_company',
                message: 'client company is required',
                severity: 'blocking',
              },
            ],
          },
        },
      },
    };

    expect(getPromptIssues(structuredError)).toEqual([
      {
        code: 'client_company.missing',
        field: 'client_company',
        message: 'client company is required',
        severity: 'blocking',
      },
    ]);

    const errorDetails = {
      response: {
        data: {
          errors: {
            detail: ['commercial_input_missing'],
          },
        },
      },
    };

    expect(getPromptIssues(errorDetails)).toEqual([
      {
        code: 'commercial_input_missing',
        field: '',
        message: 'commercial_input_missing',
        severity: 'blocking',
      },
    ]);

    expect(getPromptIssues(new Error('generic error'))).toEqual([]);
  });
});
