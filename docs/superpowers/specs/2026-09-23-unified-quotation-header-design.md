# Unified Quotation Header Design

> Superseded on 2026-09-23 by
> `D:/venturo/Quotation-generator/docs/superpowers/specs/2026-09-23-editable-quotation-header-design.md`.
> Do not implement the separate React header or binary decoration described below.

**Date:** 2026-09-23  
**Applications:** `quotation-app`, `quotation-api`

## Objective

Apply one consistent document header to every quotation type. The rendered result must match `docs/snapshots/quotation.png`: a subtle binary decoration across the top, the Venturo logo aligned on the left, a centered quotation title, and a two-column metadata block containing document information and recipient information.

The header appears once at the beginning of a quotation. It must be present in the internal editor, previews, public quotation rendering, and browser print/PDF output.

## Visual Reference

The authoritative visual reference is:

`D:/venturo/Quotation-generator/docs/snapshots/quotation.png`

The existing `public/assets/images/QuotationHeader.png` is only a screenshot reference and must not be used as the rendered header because its opaque white background conflicts with dark theme presentation.

## Header Composition

The document header consists of four ordered regions:

1. A decorative binary-number band spanning the document width. The numbers are presentational only and excluded from the accessibility tree.
2. The transparent Venturo logo from `/logo/venturo-logo.png`, matching the asset used by the application sidebar. The logo is left-aligned below the binary band and includes the existing `EXPERT PROGRAMMERS` tagline.
3. The quotation title, centered below the logo. It uses uppercase bold text and may wrap to two lines, as in `PENAWARAN LAYANAN / DEDICATED PROGRAMMER SQUAD`.
4. A metadata region below the title, followed by sufficient spacing before the opening paragraph or first content section.

The native frontend composition replaces the screenshot asset. It uses transparent layout elements and theme-aware colors so no white rectangle appears in dark mode.

## Metadata Layout

The metadata region follows the reference exactly on desktop and A4 print:

- Left column:
  - `No`
  - `Perihal`
  - `Tanggal`
- Right column:
  - `Kepada`
  - `Yth. {client PIC}`
  - client company name, wrapping naturally when needed

Left-column labels and colon separators align vertically. The recipient column is left-aligned and begins near the right side of the page, matching the reference. All quotation types use the label `No`; previous variations such as `Nomor` and `Nomor Quotation` are normalized.

Values remain data-driven per quotation type. Missing optional recipient or company values must not leave malformed punctuation or placeholder text.

On narrow screens, the two metadata columns stack in reading order: document information first, recipient information second. Print output always retains the two-column layout.

## Architecture

Create a shared, non-editable quotation-header presentation component in the frontend. It owns the binary decoration, logo, title placement, and metadata layout. The component is mounted once before the editable quotation body by the shared document surface used across quotation types.

The business content remains editable, while the official header cannot be deleted or accidentally moved by editor operations. Existing and newly generated quotations receive the same visual header without requiring regeneration of saved HTML.

Backend renderers continue to provide semantic metadata values and each quotation's title. Any legacy title or metadata markup inside generated HTML must be normalized or suppressed at the shared presentation boundary so the rendered document does not show duplicate headers. Saved business content and calculation markers must remain round-trip safe.

Use the existing sidebar logo source rather than duplicating a new logo asset. The obsolete screenshot header asset may be removed after confirming there are no runtime references.

## Theme and Print Behavior

- Light theme: transparent header background with pale gray binary characters.
- Dark theme: transparent header background with low-opacity light binary characters; the transparent Venturo logo remains unchanged.
- Print/PDF: the document surface and header render on white, the binary characters use pale gray, and the header stays with the title where possible to prevent an isolated decoration at a page break.
- The logo preserves its aspect ratio and is never cropped or stretched.
- Decorative characters do not receive focus and are hidden from screen readers.

## Data Flow

1. The quotation detail response supplies the quotation HTML and structured document metadata already available to the editor/view.
2. The shared document surface resolves the title, quotation number, subject, date, client PIC, and company for the current quotation type.
3. The shared header renders those values above the editable document body.
4. Screen preview, public rendering, and print CSS consume the same component and layout rules.
5. Saving the editable body does not serialize the presentation-only header into user-editable content.

If a surface currently lacks the required structured metadata, it must derive the values from the existing semantic fields in the document without changing calculation or legal content.

## Error and Compatibility Handling

- Missing optional metadata renders as an empty value or omits the affected continuation line; it must not display `undefined`, `null`, or broken separators.
- Long subjects and company names wrap without overlapping the opposite column.
- Existing quotation HTML must load and save without losing protected commercial, legal, signature, or calculation markers.
- No quotation type may display both the legacy HTML header and the new shared header.
- The visual header must not introduce interactive links inside the printed document; the logo is an image, not sidebar navigation.

## Verification

Verification covers:

- Representative quotation documents for every supported quotation type.
- Exact ordering and labels: logo, centered title, `No`, `Perihal`, `Tanggal`, `Kepada`, `Yth.`, and company.
- No duplicated legacy title or metadata.
- Light theme, dark theme, narrow viewport, and A4 print preview.
- Long subject, PIC, and company wrapping.
- Existing document HTML round-trip tests and renderer tests.
- Focused frontend lint/tests, backend Go tests for affected renderers, and frontend production build.

Visual acceptance is based on comparison with `docs/snapshots/quotation.png`, allowing only responsive adjustments on narrow screens and theme-specific decoration colors.

## Out of Scope

- Repeating the header on every printed page.
- Changing quotation calculations, legal clauses, section ordering, or signature content.
- Making the logo or binary decoration editable.
- Replacing the Venturo brand asset.
