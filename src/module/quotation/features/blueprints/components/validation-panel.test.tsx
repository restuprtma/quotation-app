// @vitest-environment happy-dom
import { it, expect, describe, afterEach } from 'vitest';
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
});
