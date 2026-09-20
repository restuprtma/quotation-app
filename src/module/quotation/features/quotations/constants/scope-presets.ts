export type ScopePreset = {
  mandatory: string[];
  optional: string[];
};

export type StandardActivityItem = {
  id: string;
  label: string;
  description: string;
};

export const SOLUTION_TYPES = [
  { value: 'Web Application', label: 'Web Application' },
  { value: 'Mobile Application', label: 'Mobile Application' },
  { value: 'Enterprise SaaS', label: 'Enterprise SaaS' },
  { value: 'Custom Software Solution', label: 'Custom Software Solution' },
  { value: 'Cloud Infrastructure & API', label: 'Cloud Infrastructure & API' },
  { value: 'Sistem Antrian (Queue Management)', label: 'Sistem Antrian (Queue Management)' },
  { value: 'Kiosk Application', label: 'Kiosk Application' },
  { value: 'Website / Company Profile', label: 'Website / Company Profile' },
  { value: 'API Integration & Microservices', label: 'API Integration & Microservices' },
  { value: 'ERP & Internal Operations', label: 'ERP & Internal Operations' },
];

export const STANDARD_DEVELOPMENT_ACTIVITIES: StandardActivityItem[] = [
  {
    id: 'Requirement Analysis & PRD',
    label: 'Requirement Analysis & PRD',
    description: 'Analisis kebutuhan sistem, penyusunan SRS, dan perumusan PRD komprehensif',
  },
  {
    id: 'UI/UX Wireframing & Prototyping',
    label: 'UI/UX Wireframing & Prototyping',
    description: 'Perancangan user journey, wireframe, design system, dan prototype interaktif',
  },
  {
    id: 'Sprint Planning & Backlog Refinement',
    label: 'Sprint Planning & Backlog Refinement',
    description: 'Penyelarasan berkala agile backlog, estimasi task, dan evaluasi sprint',
  },
  {
    id: 'Code Review & Quality Assurance',
    label: 'Code Review & Quality Assurance',
    description: 'Peer review kode program, static code analysis, dan pengujian kualitas berkala',
  },
  {
    id: 'SIT/UAT Support',
    label: 'SIT/UAT Support',
    description: 'Pendampingan uji integrasi sistem (SIT) dan penerimaan pengguna (UAT)',
  },
  {
    id: 'Deployment & Go-Live Assistance',
    label: 'Deployment & Go-Live Assistance',
    description: 'Penyusunan deployment pipeline CI/CD dan pendampingan rilis lingkungan produksi',
  },
  {
    id: 'Hypercare & Warranty Support',
    label: 'Hypercare & Warranty Support',
    description: 'Dukungan teknis intensif pasca go-live dan penanganan bug masa garansi layanan',
  },
];

export const SCOPE_PRESETS_BY_SOLUTION_TYPE: Record<string, ScopePreset> = {
  'Web Application': {
    mandatory: [
      'System Architecture & Database Design',
      'Frontend UI/UX Implementation',
      'Backend API Development & Integration',
    ],
    optional: ['Mobile App Companion', 'Automated E2E Test Suite'],
  },
  'Mobile Application': {
    mandatory: [
      'Mobile UI/UX Implementation (iOS & Android)',
      'Backend REST API & Database Integration',
      'Push Notification Integration',
    ],
    optional: ['Offline Mode & Local Storage Cache', 'In-App Analytics & Crashlytics Integration'],
  },
  'Enterprise SaaS': {
    mandatory: [
      'Multi-tenant Architecture & Role-Based Access Control (RBAC)',
      'Billing & Subscription Engine',
      'Audit Logging & Security Compliance Module',
      'Admin Master Dashboard & Reporting',
    ],
    optional: ['Single Sign-On (SSO / SAML / OAuth)', 'Custom Webhook & Developer API Gateway'],
  },
  'Custom Software Solution': {
    mandatory: [
      'Custom Business Logic Workflow Engine',
      'Data Modeling & Scalable Database Architecture',
      'User Management & Departmental Access Control',
    ],
    optional: ['Legacy System Data Migration & ETL', 'Executive Analytics & KPI Dashboard'],
  },
  'Cloud Infrastructure & API': {
    mandatory: [
      'Cloud Architecture Infrastructure as Code (Terraform)',
      'Microservices API Gateway & Load Balancing',
      'Centralized Logging, Metrics & APM Monitoring',
    ],
    optional: [
      'Automated Disaster Recovery & Multi-region Failover',
      'High-throughput Caching Tier (Redis Cluster)',
    ],
  },
  'Sistem Antrian (Queue Management)': {
    mandatory: [
      'Aplikasi Caller / Pemanggilan Antrian Multi-Loket',
      'Display Layar Nomor Antrian & Suara Pemanggilan (TTS)',
      'Sistem Ticketing & Tiket Printer Thermal',
      'Backend Engine & Queue Routing Logic',
    ],
    optional: [
      'Integrasi Notifikasi WhatsApp / SMS Estimasi Antrian',
      'Kiosk Touchscreen Self-Service Tiket',
      'Dashboard Monitoring & Statistik Waktu Pelayanan',
    ],
  },
  'Kiosk Application': {
    mandatory: [
      'Antarmuka Kiosk Touchscreen Responsif & Kiosk-Mode Lockdown',
      'Integrasi Hardware Peripheral (Thermal Printer, Barcode/QR Scanner)',
      'Aplikasi Admin & Remote Monitoring Status Mesin',
      'API Backend & Sinkronisasi Data Transaksi',
    ],
    optional: [
      'Integrasi Payment Gateway QRIS / Mesin EDC',
      'Offline Mode Support & Auto-Sync saat Reconnect',
    ],
  },
  'Website / Company Profile': {
    mandatory: [
      'Desain UI/UX Responsif & Mobile-Friendly',
      'Content Management System (CMS) Dinamis',
      'Formulir Kontak Terintegrasi Email & WhatsApp',
      'Optimasi SEO On-Page & Performance PageSpeed',
    ],
    optional: [
      'Dukungan Multi-bahasa (ID & EN)',
      'Modul Publikasi Berita / Blog & Press Release',
      'Pusat Unduhan Brosur / Katalog Produk',
    ],
  },
  'API Integration & Microservices': {
    mandatory: [
      'Arsitektur Middleware & API Gateway Security',
      'Integrasi Core Banking / Third-party Vendor API',
      'Autentikasi & Otorisasi Token (OAuth2 / JWT)',
      'Audit Logging, Rate Limiting & Error Handling Queue',
    ],
    optional: [
      'Mock Service & Sandbox Environment untuk Testing Partner',
      'Automated API Documentation Portal (Swagger / OpenAPI)',
    ],
  },
  'ERP & Internal Operations': {
    mandatory: [
      'Modul Manajemen Inventory & Asset Tracking',
      'Modul Pengadaan & Purchase Order Approval Workflow',
      'Laporan Finansial & Buku Besar Sederhana',
      'Role & Permission Management Multi-Departemen',
    ],
    optional: [
      'Integrasi Barcode Scanner untuk Stock Opname',
      'Export Laporan Multi-Format (PDF, Excel, CSV)',
    ],
  },
};
