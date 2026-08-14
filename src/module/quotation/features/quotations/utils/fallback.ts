import type { PublicQuotation, PublicDetailResponse, PublicBlueprintResponse } from '../types';

export function getPublicQuotation(token: string): PublicQuotation {
  return {
    quotation_number: 'QUO-2026-0001',
    client_name: 'RS Harapan Sehat',
    project_type: 'project_based',
    status: 'shared',
    created_at: '2026-08-01T08:00:00Z',
    revision: {
      revision_number: 1,
      public_token: token,
      budget: 500000000,
      project_description:
        'Sistem manajemen rumah sakit terintegrasi untuk membantu pasien dan staf mengelola proses layanan secara lebih cepat, rapi, dan terukur.',
      scope_of_work:
        '1. Modul pendaftaran pasien online\n2. Modul antrian digital\n3. Dashboard operasional rumah sakit\n4. Rekam medis terintegrasi',
      maintenance_info: '60 poin / 6 bulan, 1 poin = 1 jam kerja',
      hosting_info: 'Cloud hosting dengan pemantauan dan backup berkala',
      notes: 'Implementasi dilakukan bertahap bersama tim operasional klien.',
      narrative_data: {
        introduction: 'Sistem manajemen rumah sakit terintegrasi',
        scope: ['Pendaftaran', 'Antrian Digital', 'Dashboard', 'Rekam Medis'],
      },
    },
  };
}

export function getPublicBlueprint(token: string): PublicBlueprintResponse {
  return {
    quotation_number: 'QUO-2026-0001',
    client_name: 'RS Harapan Sehat',
    subject: 'Sistem RS',
    blueprint_data: {
      title: 'Sistem RS',
      summary: 'Sistem Manajemen Rumah Sakit Terintegrasi',
      actors: [
        { id: 'patient', label: 'Pasien' },
        { id: 'admin', label: 'Admin RS' },
        { id: 'doctor', label: 'Dokter' },
      ],
      diagrams: [
        {
          type: 'workflow',
          title: 'Pendaftaran',
          steps: [
            { action: 'Mengisi form online' }
          ]
        }
      ],
      rules: ['Harus aman'],
      assumptions: ['Internet stabil'],
      edge_cases: ['Pasien tidak punya HP'],
      outputs: ['Nomor rekam medis'],
    },
  };
}

export function getPublicDetail(token: string): PublicDetailResponse {
  return {
    quotation_number: 'QUO-2026-0001',
    client_name: 'RS Harapan Sehat',
    subject: 'Sistem RS',
    narrative_data: {
      introduction: 'Sistem manajemen rumah sakit terintegrasi',
      scope: ['Pendaftaran', 'Antrian Digital', 'Dashboard', 'Rekam Medis'],
    },
    product_detail_data: {
      mode: 'project',
      goals: ['Meningkatkan efisiensi layanan'],
      deliverables: ['Web App', 'Mobile App'],
      milestones: [],
      team: [],
    },
  };
}
