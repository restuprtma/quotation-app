# Tuai Frontend (React)

Frontend aplikasi Quotation & Contract Generator, dibangun di atas **Minimals MUI foundation**.

**Stack:** Vite 7 · React 19 · React Router 7 · MUI v7 + Emotion · TipTap (Word-like WYSIWYG) · React Flow (Visual Diagramming) · TanStack Query · React Hook Form + Zod · Axios · i18next.

---

## Prasyarat

- **Node.js ≥ 22.12** (lihat `engines` di [package.json](package.json))
- **Yarn v1** (`yarn@1.22.22`) sebagai package manager

## Instalasi & Menjalankan

```sh
yarn install
yarn dev            # Vite dev server di http://localhost:8081
```

Dev server berjalan di **port 8081** (lihat [vite.config.ts](vite.config.ts)) dan menampilkan overlay TypeScript + ESLint checker di pojok kiri-atas.

## Skrip Quality Gate & Development

| Skrip                             | Fungsi                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `yarn dev`                        | Start Vite dev server (in-process TS + ESLint checker)                                                         |
| `yarn build`                      | `tsc` (typecheck) lalu `vite build` — typecheck adalah bagian dari build                                      |
| `yarn start`                      | `vite preview` atas hasil build                                                                                |
| `yarn tsc:watch`                  | Type-check watch mode                                                                                          |
| `yarn lint` / `yarn lint:fix`     | ESLint atas `src/**/*.{js,jsx,ts,tsx}`                                                                         |
| `yarn fm:check` / `yarn fm:fix`   | Prettier format check / write                                                                                  |
| `yarn fix:all`                    | `lint:fix` + `fm:fix`                                                                                          |
| `yarn re:dev` / `yarn re:build`   | Bersihkan `node_modules`/`dist`, reinstall, lalu dev/build                                                     |

> **Catatan:** Tidak ada unit test runner otomatis di frontend. Kualitas frontend diverifikasi melalui automated quality gate (`yarn lint`, `yarn fm:check`, `yarn build`) serta panduan E2E manual di `docs/qa/`.

---

## Konfigurasi (Environment)

Env di-_inline_ oleh Vite saat build time. File:
- **`.env`** — dipakai saat dev (default mengarah ke backend lokal `http://localhost:8080`)
- **`.env.prod`** — env produksi

Variabel penting:
- `VITE_SERVER_URL` — Base URL backend untuk Axios instance

---

## Struktur Folder & Modul Bisnis

```
src/
├── app.tsx                 # Providers global (I18n, Auth, Settings, Theme, TanStack Query)
├── layouts/                # auth-split, dashboard, simple (public view)
├── locales/                # i18next JSON (id default, en)
├── routes/
│   ├── paths.ts            # SEMUA path terpusat
│   └── sections/           # auth.tsx, dashboard.tsx, index.tsx
├── shared/                 # cross-cutting: api, config, lib (axios), ui, utils
└── module/                 # domain modules
    ├── core/               # Auth JWT multi-company, users, roles, branches, audit log
    ├── quotation/          # AI-First Quotation & Blueprint Generator
    │   └── features/
    │       ├── quotations/         # AI generator, TipTap editor, optimistic drafts, revisions
    │       ├── blueprints/         # Visual pipeline, React Flow diagrams (5 sections)
    │       ├── blueprint-sharing/  # Share links management & revocation
    │       ├── rate-cards/         # Master rate cards CRUD & cost breakdown
    │       └── ai-settings/        # Provider, model, and encrypted key management
    ├── contract/           # Signed contracts foundation
    └── dashboard/          # Dashboard home & analytics
```

---

## Arsitektur Fitur Utama

### 1. Quotation Editor (TipTap WYSIWYG)
- **Drafting Terstruktur**: AI menghasilkan semantik HTML yang diedit langsung pada TipTap editor.
- **Proteksi Legal Terms**: Blok klausul hukum terkunci secara default. Perubahan memerlukan konfirmasi unlock dan tercatat pada audit trail (`legal_content_modified`).
- **Optimistic Locking**: Penyimpanan draft menyertakan nomor versi (`expected_version`). Tab yang stale menerima respons `409 Conflict`.
- **Public Client View**: Endpoint `/p/q/:token` menyajikan HTML tersanitasi dari revisi aktif yang sudah dipublikasikan lengkap dengan canvas tanda tangan digital.

### 2. Technical Blueprint (Visual Diagramming)
- **Multi-Section Visual Pipeline**: 5 section kanonikal (`journey`, `architecture`, `state_machine`, `workflow`, `wbs`) dirender menggunakan node React Flow yang dapat diatur interaktif.
- **Partial Publishing**: Blueprint dapat dipublikasikan secara penuh maupun parsial (dengan banner peringatan dan matrix kelengkapan).
- **Programmer Share Links**: Link publik `/p/blueprint/:token` menyajikan spesifikasi teknis murni tanpa memuat anggaran, harga, rate card, maupun nama klien.

### 3. Shared Axios & Public Access
- Satu instance Axios terpusat di `src/shared/lib/axios.ts` dengan JWT interceptor dan token refresh otomatis.
- Helper `withoutAuthRefresh(config)` digunakan untuk request publik (`/p/q/:token`, `/p/blueprint/:token`) agar tidak memicu auth refresh interceptor.

---

## Standar & Pola Koding

Sebelum membuat fitur baru atau mengubah pola, baca dokumentasi di [docs/](docs/):
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — ringkasan aturan main
- [docs/patterns/](docs/patterns/) — deep-dive per topik (table, dialog-crud, i18n, dll.)
- `eslint.config.mjs` — aturan import ordering strict (`perfectionist/sort-imports`). Gunakan `yarn lint:fix` setelah mengedit kode.
