// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { BlueprintResultPreview } from './blueprint-result-preview';

describe('BlueprintResultPreview', () => {
  afterEach(() => {
    cleanup();
  });

  const mockContentJson = {
    journey: {
      journeys: [
        {
          title: 'Registrasi Pasien Baru',
          persona: 'Pasien',
          goal: 'Mendaftar akun dan membuat janji temu',
          steps: [
            {
              step_number: 1,
              action: 'Mengisi formulir biodata',
              system_response: 'Validasi NIK dan generate nomor rekam medis',
              touchpoint: 'Mobile App',
            },
          ],
        },
      ],
    },
    architecture: {
      overview: 'Arsitektur modular berbasis microservices',
      components: [
        {
          name: 'Auth Service',
          type: 'Backend Service',
          technology: 'Node.js, Express',
          responsibilities: 'Autentikasi JWT dan otorisasi RBAC',
        },
      ],
      database: [
        {
          name: 'PostgreSQL Main DB',
          type: 'Relational (PostgreSQL 16)',
          description: 'Penyimpanan data transaksi dan pengguna',
        },
      ],
      integrations: [
        {
          name: 'Payment Gateway',
          protocol: 'REST / Webhook',
          purpose: 'Pemrosesan pembayaran tagihan medis',
        },
      ],
    },
    state_machine: {
      entity: 'Appointment',
      states: [
        { name: 'DRAFT', type: 'initial', description: 'Janji temu baru dibuat' },
        { name: 'CONFIRMED', type: 'intermediate', description: 'Sudah dikonfirmasi dokter' },
        { name: 'COMPLETED', type: 'final', description: 'Sesi konsultasi selesai' },
      ],
      transitions: [
        {
          from: 'DRAFT',
          to: 'CONFIRMED',
          trigger: 'confirmAppointment',
          guard: 'payment_verified == true',
        },
      ],
    },
    workflow: {
      workflows: [
        {
          name: 'Pemeriksaan Rawat Jalan',
          actor: 'Dokter Spesialis',
          trigger: 'Pasien tiba di poliklinik',
          steps: [
            {
              step_number: 1,
              action: 'Input diagnosis dan resep obat',
              actor: 'Dokter',
              rule: 'Harus memilih minimal 1 kode ICD-10',
            },
          ],
        },
      ],
    },
    wbs: {
      total_estimation_days: 45,
      items: [
        {
          code: 'WBS-1.1',
          module: 'Modul Pasien',
          task: 'Implementasi API Registrasi dan Verifikasi',
          role: 'Backend Developer',
          estimation_days: 5,
        },
      ],
    },
  };

  it('renders tabs and defaults to User Journey preview', () => {
    render(<BlueprintResultPreview contentJson={mockContentJson} />);

    expect(screen.getByRole('tab', { name: /user journey/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /arsitektur/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /state machine/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /workflow/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /wbs/i })).toBeTruthy();

    expect(screen.getByText('Registrasi Pasien Baru')).toBeTruthy();
    expect(screen.getByText(/Aktor: Pasien/i)).toBeTruthy();
    expect(screen.getByText('Mengisi formulir biodata')).toBeTruthy();
  });

  it('switches tabs to Architecture and renders components, database, and integrations', () => {
    render(<BlueprintResultPreview contentJson={mockContentJson} />);

    fireEvent.click(screen.getByRole('tab', { name: /arsitektur/i }));

    expect(screen.getByText('Arsitektur modular berbasis microservices')).toBeTruthy();
    expect(screen.getByText('Auth Service')).toBeTruthy();
    expect(screen.getByText('PostgreSQL Main DB')).toBeTruthy();
    expect(screen.getByText('Payment Gateway')).toBeTruthy();
  });

  it('switches tabs to State Machine and renders states and transitions', () => {
    render(<BlueprintResultPreview contentJson={mockContentJson} />);

    fireEvent.click(screen.getByRole('tab', { name: /state machine/i }));

    expect(screen.getByText(/Entitas: Appointment/i)).toBeTruthy();
    expect(screen.getAllByText('DRAFT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CONFIRMED').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('confirmAppointment')).toBeTruthy();
    expect(screen.getByText('payment_verified == true')).toBeTruthy();
  });

  it('switches tabs to Workflow and renders processes and decision rules', () => {
    render(<BlueprintResultPreview contentJson={mockContentJson} />);

    fireEvent.click(screen.getByRole('tab', { name: /workflow/i }));

    expect(screen.getByText('Pemeriksaan Rawat Jalan')).toBeTruthy();
    expect(screen.getByText('Input diagnosis dan resep obat')).toBeTruthy();
    expect(screen.getByText('Harus memilih minimal 1 kode ICD-10')).toBeTruthy();
  });

  it('switches tabs to WBS and renders task breakdown and total mandays', () => {
    render(<BlueprintResultPreview contentJson={mockContentJson} />);

    fireEvent.click(screen.getByRole('tab', { name: /wbs/i }));

    expect(screen.getByText('45 Hari Kerja (Mandays)')).toBeTruthy();
    expect(screen.getByText('WBS-1.1')).toBeTruthy();
    expect(screen.getByText('Modul Pasien')).toBeTruthy();
    expect(screen.getByText('Implementasi API Registrasi dan Verifikasi')).toBeTruthy();
    expect(screen.getByText('Backend Developer')).toBeTruthy();
  });

  it('renders graceful empty state when section is missing or empty without crashing', () => {
    render(<BlueprintResultPreview contentJson={{}} />);

    expect(screen.getByText(/Data User Journey Belum Tersedia/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /arsitektur/i }));
    expect(screen.getByText(/Data Arsitektur Sistem Belum Tersedia/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /state machine/i }));
    expect(screen.getByText(/Data State Machine Belum Tersedia/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /workflow/i }));
    expect(screen.getByText(/Data Workflow Bisnis Belum Tersedia/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /wbs/i }));
    expect(screen.getByText(/Data Work Breakdown Structure \(WBS\) Belum Tersedia/i)).toBeTruthy();
  });

  it('handles controlled activeSection and onSectionChange callback', () => {
    const onSectionChange = vi.fn();
    render(
      <BlueprintResultPreview
        contentJson={mockContentJson}
        activeSection="wbs"
        onSectionChange={onSectionChange}
      />
    );

    expect(screen.getByText('45 Hari Kerja (Mandays)')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /user journey/i }));
    expect(onSectionChange).toHaveBeenCalledWith('journey');
  });
});
