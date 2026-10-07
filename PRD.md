# Product Contract - Quotation & Contract Generator

**Audience:** IT Business Analyst, Presales, Project Manager, and delivery team.  
**Updated:** 2026-10-07 (Phase 13 AI-First Canonical Architecture)

---

## 1. Product Vision

Aplikasi ini menghasilkan penawaran IT (Quotation) dan Blueprint teknis menggunakan AI sebagai co-pilot, memungkinkan kolaborasi drafting berbasis TipTap editor dan visual diagramming, menyediakan akses publik terproteksi, serta mengonversi quotation yang telah ditandatangani menjadi kontrak legal.

Pengguna internal terautentikasi melalui JWT multi-company. Klien dan programmer eksternal mengakses dokumen publik melalui cryptographic share token tanpa login.

---

## 2. Dua Core Domain

### A. Quotation (AI-First & TipTap WYSIWYG)

Quotation mengadopsi model **Dedicated Squad / Man-Month** dengan tarif resmi perusahaan:
- **Rate Cards**: Snapshot rate card resmi (National / International), tier Seniority (Junior, Intermediate, Senior, Lead), dan Term Type (Short-term < 3 bulan vs Long-term >= 3 bulan).
- **Commercial Guardrails**: Total alokasi tim dibatasi oleh budget client. Client budget bersifat internal dan tidak pernah dicetak pada dokumen final quotation.
- **TipTap Word-like Editor**: AI men-generate semantik HTML terstruktur yang menjadi canonical editing surface bagi BA. Editor mendukung format paragraf, heading, tabel, bullet lists, dan legal block.
- **Legal Protection**: Block legal terms berstatus immutable secara default dengan indikator visual gembok. Pengeditan memerlukan konfirmasi unlock dan dicatat pada audit log (`legal_content_modified`).
- **Commercial Table Protection**: Pengeditan baris/angka tabel komersial dicatat pada audit log (`commercial_content_modified`).
- **Optimistic Locking**: Draft save menerapkan version check (`expected_version`). Jika versi stale, sistem mengembalikan `409 Conflict`.

### B. Blueprint (Technical System Specification)

Blueprint mengadopsi model **Structured Visual Diagrams & Specifications**:
- **5 Canonical Sections**:
  1. `journey`: User journey map dan persona flow.
  2. `architecture`: Diagram arsitektur sistem (C4 model / block components).
  3. `state_machine`: Transisi status dan life-cycle entitas utama.
  4. `workflow`: Alur proses bisnis dan swimlanes.
  5. `wbs`: Work Breakdown Structure hierarkis beserta estimasi.
- **Pipeline Generation**: AI menghasilkan blueprint section-by-section. Jika terjadi kegagalan pada salah satu section, section yang telah selesai tetap tersimpan dan BA dapat melakukan recovery manual atau continue pipeline.
- **Visual Editors**: Editor diagram interaktif (React Flow / canvas nodes) dengan validasi struktural (pencegahan orphaned nodes dan cyclic dependencies).
- **Publishing & Sharing**: Mendukung Full Publish atau Partial Publish (dengan banner status parsial).

---

## 3. Public Document Surfaces

Sistem menyediakan dua permukaan dokumen publik:

| Surface | URL | Deskripsi & Aksesibilitas |
|---|---|---|
| **Client Quotation** | `/p/q/:public_token` | **Stable Link UUID**. Selalu menampilkan active published revision dari quotation. Dilengkapi digital signature canvas. Race-safe double-sign protection. |
| **Programmer Blueprint** | `/p/blueprint/:token` | **Revision-Bound Link**. Mengakses snapshot spesifik dari blueprint revision yang di-share oleh BA. Data komersial, budget, rate card, dan client name sepenuhnya di-redact. |

> **Catatan:** Rute legacy tiga artifak (`/p/b/:token` dan `/p/d/:token`) telah dihapus secara permanen.

---

## 4. Lifecycle & Revisions

### Quotation Lifecycle
```text
[AI Generator / Manual] -> Draft Rev 1 -> [TipTap Editing] -> Published Rev 1
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                ▼                                     ▼
                                       Client Digital Signature                Branch to Draft Rev 2
                                                │                                     │
                                                ▼                                     ▼
                                      Signed -> Ready for Contract             Published Rev 2
                                                                               (Stable link updates automatically)
```

- Ketika Revision 2 berstatus draft, public stable link `/p/q/:token` tetap menampilkan Revision 1 yang sudah publish.
- Ketika Revision 2 dipublish, public stable link otomatis menampilkan Revision 2 unsigned.
- History signature dari Revision 1 tersimpan aman di database dan tidak terwariskan ke revisi baru.

### Blueprint Lifecycle
```text
[Pipeline Queue] -> Section Drafts -> Visual Editing -> Publish (Complete/Partial) -> Generate Share Links -> Revoke Link
```

---

## 5. Security & Isolation Principles

1. **Multi-Tenant Isolation**: Seluruh kueri data internal terikat secara ketat pada `company_id` dari JWT token.
2. **HTML UGC Sanitization**: Output AI dan input TipTap disanitasi menggunakan whitelist tag UGC yang ketat sebelum disimpan ke DB dan disajikan ke client.
3. **Public Token Entropy**: Token share publik dibuat menggunakan CSPRNG (minimal 32 byte entropy) dan diverifikasi via SHA-256 hash lookup di backend. Raw token tidak pernah disimpan di database atau dicatat di log.
4. **Programmer View Redaction**: Endpoint publik `/p/blueprint/:token` menggunakan DTO serializer terpisah yang secara ketat membuang seluruh field komersial, tarif, margin, nama klien, dan riwayat revisi.
5. **No Secret in Frontend**: Kunci API provider AI hanya disimpan terenkripsi di backend; frontend hanya menampilkan key hint (4 karakter terakhir).
