// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { ValidationPanel } from './validation-panel';

describe('ValidationPanel', () => {
  afterEach(() => {
    cleanup();
  });

  const mockValidResult = {
    is_valid: true,
    coverage_score: 95,
    checked_rules: 14,
    errors: [],
    warnings: [],
  };

  const mockCrossValidResult = {
    is_valid: true,
    checked_rules: 6,
    inconsistencies: [],
    warnings: [],
  };

  const mockResultWithIssues = {
    is_valid: false,
    coverage_score: 72,
    checked_rules: 14,
    errors: [
      {
        section: 'journey',
        code: 'MISSING_TOUCHPOINT',
        message: 'Step #3 pada skenario Registrasi belum mendefinisikan kanal interaksi.',
      },
      {
        section: 'wbs',
        code: 'ROLE_UNASSIGNED',
        message: 'Task WBS-2.1 tidak memiliki PIC / Role yang valid.',
      },
    ],
    warnings: [
      {
        section: 'architecture',
        code: 'HIGH_COUPLING_RISK',
        message: 'Komponen Payment Gateway memiliki ketergantungan langsung ke Database.',
      },
    ],
  };

  const mockCrossWithInconsistencies = {
    is_valid: false,
    checked_rules: 6,
    inconsistencies: [
      {
        target_section: 'state_machine',
        code: 'UNREACHABLE_STATE',
        message: 'State CANCELLED tidak memiliki transisi masuk dari state mana pun.',
      },
    ],
    warnings: [],
  };

  it('renders empty state when validation results are null or empty', () => {
    render(<ValidationPanel />);

    expect(screen.getByText(/Validasi Belum Dijalankan/i)).toBeTruthy();
    expect(
      screen.getByText(/Hasil validasi skema dan integritas silang akan muncul secara otomatis/i)
    ).toBeTruthy();
  });

  it('renders success state when there are 0 errors and 0 warnings', () => {
    render(
      <ValidationPanel
        validationResult={mockValidResult}
        crossValidationResult={mockCrossValidResult}
      />
    );

    expect(screen.getByText(/Validasi Lolos \(100% Valid\)/i)).toBeTruthy();
    expect(screen.getByText(/Semua Validasi Berhasil/i)).toBeTruthy();
    expect(screen.getByText(/95%/)).toBeTruthy();
    expect(screen.getByText('Bersih')).toBeTruthy();
  });

  it('renders errors and warnings with target sections and codes', () => {
    render(
      <ValidationPanel
        validationResult={mockResultWithIssues}
        crossValidationResult={mockCrossWithInconsistencies}
      />
    );

    // Errors (2 from validationResult + 1 from crossValidationResult = 3 errors)
    expect(screen.getByText(/3 Error Ditemukan/i)).toBeTruthy();
    expect(screen.getByText('journey')).toBeTruthy();
    expect(screen.getByText('MISSING_TOUCHPOINT')).toBeTruthy();
    expect(
      screen.getByText('Step #3 pada skenario Registrasi belum mendefinisikan kanal interaksi.')
    ).toBeTruthy();

    expect(screen.getByText('wbs')).toBeTruthy();
    expect(screen.getByText('ROLE_UNASSIGNED')).toBeTruthy();

    expect(screen.getByText('state_machine')).toBeTruthy();
    expect(screen.getByText('UNREACHABLE_STATE')).toBeTruthy();

    // Warnings (1 from validationResult)
    expect(screen.getByText(/1 Peringatan/i)).toBeTruthy();
    expect(screen.getByText('architecture')).toBeTruthy();
    expect(screen.getByText('HIGH_COUPLING_RISK')).toBeTruthy();
    expect(
      screen.getByText('Komponen Payment Gateway memiliki ketergantungan langsung ke Database.')
    ).toBeTruthy();

    // Coverage score
    expect(screen.getByText(/72%/)).toBeTruthy();
  });

  it('safely escapes special characters in error messages and does not crash on malformed items', () => {
    const malformedResult = {
      errors: [
        '<script>alert("xss")</script>',
        { message: '<b>Tag</b> & "quotes" & {malformed}', section: 'test' },
      ],
    };

    render(<ValidationPanel validationResult={malformedResult} />);

    expect(screen.getByText('<script>alert("xss")</script>')).toBeTruthy();
    expect(screen.getByText('<b>Tag</b> & "quotes" & {malformed}')).toBeTruthy();
  });

  it('adapts canonical backend issues from per-section validation_result and cross_validation_result', () => {
    const canonicalValidationResult = {
      journey: {
        valid: false,
        safe_outcome: 'invalid_schema',
        issues: [
          {
            code: 'ERR_DANGLING_REFERENCE',
            severity: 'error',
            section: 'journey',
            path: 'journey.activities[0].references[0]',
            target_id: 'act-1',
            message: 'Canonical reference tidak ditemukan',
            blocking: true,
            remediation: 'Pastikan reference menuju modul yang valid',
          },
        ],
      },
      architecture: {
        valid: true,
        issues: [
          {
            code: 'WARN_ARCH_NODE_UNREFERENCED_IN_WBS',
            severity: 'warning',
            section: 'architecture',
            path: 'architecture.nodes[1]',
            target_id: 'node-2',
            message: 'Node arsitektur belum diimplementasikan di WBS',
            blocking: false,
          },
        ],
      },
    };

    const canonicalCrossResult = {
      valid: false,
      issues: [
        {
          code: 'WARN_JOURNEY_ACTIVITY_UNLINKED',
          severity: 'warning',
          section: 'journey',
          path: 'journey.activities[1]',
          target_id: 'act-2',
          message: 'Activity belum terhubung ke workflow mana pun',
          blocking: false,
        },
      ],
      coverage: {
        journey_to_workflow: 0.85,
        architecture_to_wbs: 0.9,
      },
    };

    render(
      <ValidationPanel
        validationResult={canonicalValidationResult}
        crossValidationResult={canonicalCrossResult}
      />
    );

    // 1 Error + 2 Warnings
    expect(screen.getByText(/1 Error Ditemukan/i)).toBeTruthy();
    expect(screen.getByText(/2 Peringatan/i)).toBeTruthy();
    expect(screen.getByText('ERR_DANGLING_REFERENCE')).toBeTruthy();
    expect(screen.getByText('Canonical reference tidak ditemukan')).toBeTruthy();
    expect(screen.getByText('WARN_ARCH_NODE_UNREFERENCED_IN_WBS')).toBeTruthy();
    expect(screen.getByText('WARN_JOURNEY_ACTIVITY_UNLINKED')).toBeTruthy();
  });

  it('invokes onFocusIssue callback when focus button is clicked', () => {
    const onFocusIssue = vi.fn();
    const resultWithIssue = {
      issues: [
        {
          code: 'ERR_DUPLICATE_ID',
          severity: 'error',
          section: 'journey',
          path: 'journey.phases[1]',
          target_id: 'phase-2',
          message: 'Duplicate phase ID detected',
          blocking: true,
        },
      ],
    };

    render(<ValidationPanel validationResult={resultWithIssue} onFocusIssue={onFocusIssue} />);

    expect(screen.getByText('ERR_DUPLICATE_ID')).toBeTruthy();
    const focusButton = screen.getByRole('button', { name: /Fokus/i });
    expect(focusButton).toBeTruthy();
    focusButton.click();

    expect(onFocusIssue).toHaveBeenCalledTimes(1);
    expect(onFocusIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ERR_DUPLICATE_ID',
        section: 'journey',
        target_id: 'phase-2',
        path: 'journey.phases[1]',
      })
    );
  });
});
