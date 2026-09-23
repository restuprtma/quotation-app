# Unified Quotation Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the Venturo masthead, centered service title, and exact two-column `No`/`Perihal`/`Tanggal`/`Kepada` layout from `docs/snapshots/quotation.png` once at the top of every quotation type.

**Architecture:** Keep semantic metadata in persisted backend HTML so editor round-trips remain safe. A frontend parser converts that header into a typed model; a non-editable React masthead renders before `EditorContent`, while scoped CSS hides only the duplicate editor header. Normalize backend renderer outliers so every quotation exposes the same metadata contract.

**Tech Stack:** Go, React 19, TypeScript 5.9, MUI 7, Tiptap 3, Vitest 4, Playwright 1.63, CSS print media.

**Current surface note:** The repository does not yet implement the planned public quotation route `/p/q/:token`; `src/routes/sections/public.tsx` currently exposes only public contracts. This plan makes the header component independent of editor state so that future public quotation work can reuse it, but it does not create the otherwise unrelated public artifact feature.

## Global Constraints

- Apply the header to all supported quotation types and show it exactly once.
- Use `/logo/venturo-logo.png`, the transparent asset already used by the sidebar.
- Build binary decoration with theme-aware markup/CSS and `aria-hidden="true"`.
- Display `No`, `Perihal`, `Tanggal`, `Kepada`, `Yth. {client PIC}`, and client company in reference order.
- Use two columns on desktop/A4 print and stacked columns on narrow screens.
- Never serialize the React masthead into editable HTML or remove semantic metadata from saved HTML.
- Do not change calculations, legal clauses, section ordering, or signatures.
- Preserve unrelated dirty-worktree changes and stage only files belonging to each task.

---

## File Map

Frontend additions:

- `src/module/quotation/features/quotations/components/quotation-document-header-model.ts`: parse persisted header HTML.
- `src/module/quotation/features/quotations/components/quotation-document-header.tsx`: render the non-editable official header.
- `src/module/quotation/features/quotations/styles/quotation-document-header.css`: responsive, theme, and print layout.
- Matching `.test.ts`/`.test.tsx` files for parser and component contracts.

Frontend modifications:

- `quotation-editor.tsx`: derive the model and mount the masthead before `EditorContent`.
- `document-canvas.tsx`: import shared header styling and enforce print surface colors.
- `quotation-document-style.test.ts` and document round-trip tests: verify display and persistence boundaries.
- `e2e/dedicated-squad-quotation.spec.ts`: browser-level ordering and label checks.

Backend additions:

- `internal/modules/quotation/service/official_quotation_header.go`: shared escaped header renderer.
- `internal/modules/quotation/service/official_quotation_header_test.go`: semantic contract tests.

Backend modifications:

- All eight service `*_html_renderer.go` files and their tests.

---

### Task 1: Normalize the backend semantic header

**Files:**
- Create: `../quotation-api/internal/modules/quotation/service/official_quotation_header.go`
- Create: `../quotation-api/internal/modules/quotation/service/official_quotation_header_test.go`
- Modify: `../quotation-api/internal/modules/quotation/service/{dedicated_squad,custom_development,standalone_maintenance,subscription_saas,white_label,kiosk_queue,talent_outsourcing,cloud_infrastructure}_html_renderer.go`
- Test: matching renderer test files in `../quotation-api/internal/modules/quotation/service/`

**Interfaces:**
- Consumes: existing `QuotationMetadata`.
- Produces: `renderOfficialQuotationHeader(title string, metadata QuotationMetadata) string`.

- [ ] **Step 1: Write the failing helper test**

```go
func TestRenderOfficialQuotationHeader(t *testing.T) {
	got := renderOfficialQuotationHeader("PENAWARAN <LAYANAN>", QuotationMetadata{
		QuotationNumber: "VEN/0826/007", Subject: "Sistem Self-Ordering",
		IssueDate: "Jumat, 7 Agustus 2026", ClientName: "Muh. Khalid",
		ClientCompanyName: "PT Langgeng Sukses Abadi Teknologi (Qtrust)",
	})
	assert.Contains(t, got, `<header data-block-type="metadata">`)
	assert.Contains(t, got, `<h1>PENAWARAN &lt;LAYANAN&gt;</h1>`)
	for _, field := range []string{"quotation_number", "subject", "issue_date_header", "client_pic", "client_company"} {
		assert.Contains(t, got, `data-field="`+field+`"`)
	}
}
```

- [ ] **Step 2: Run the test and confirm the missing function**

Run: `go test ./internal/modules/quotation/service -run TestRenderOfficialQuotationHeader -count=1`

Expected: FAIL with `undefined: renderOfficialQuotationHeader`.

- [ ] **Step 3: Implement the escaped helper**

```go
func renderOfficialQuotationHeader(title string, m QuotationMetadata) string {
	var b strings.Builder
	b.WriteString(`<header data-block-type="metadata">`)
	b.WriteString(`<h1>` + html.EscapeString(title) + `</h1>`)
	b.WriteString(`<p><span data-field="quotation_number">` + html.EscapeString(m.QuotationNumber) + `</span></p>`)
	b.WriteString(`<p><span data-field="subject">` + html.EscapeString(m.Subject) + `</span></p>`)
	b.WriteString(`<p><span data-field="issue_date_header">` + html.EscapeString(m.IssueDate) + `</span></p>`)
	b.WriteString(`<p><span data-field="client_pic">` + html.EscapeString(m.ClientName) + `</span></p>`)
	b.WriteString(`<p><span data-field="client_company">` + html.EscapeString(m.ClientCompanyName) + `</span></p>`)
	b.WriteString(`</header>`)
	return b.String()
}
```

Import standard-library `html` and `strings`. Empty optional spans are intentional; the frontend omits blank presentation lines.

- [ ] **Step 4: Route all eight renderers through the helper**

Replace hand-built headers with calls such as:

```go
b.WriteString(renderOfficialQuotationHeader("PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD", metadata))
```

Use the existing official titles for Custom Software Development, Standalone Maintenance & Support, Software Subscription / SaaS, White Label Product, Kiosk & Sistem Antrian, Talent Outsourcing, and Cloud Infrastructure. Preserve dedicated-squad letter-prefix handling before the call. Talent and cloud document inputs already carry `QuotationMetadata`; pass that field to the helper instead of retaining their anonymous or reduced metadata paragraphs.

- [ ] **Step 5: Add shared renderer assertions**

```go
func assertOfficialHeader(t *testing.T, doc, title string) {
	t.Helper()
	assert.Equal(t, 1, strings.Count(doc, `data-block-type="metadata"`))
	assert.Contains(t, doc, `<h1>`+title+`</h1>`)
	for _, field := range []string{"quotation_number", "subject", "issue_date_header", "client_pic", "client_company"} {
		assert.Contains(t, doc, `data-field="`+field+`"`)
	}
}
```

Call it from each renderer's canonical success test.

- [ ] **Step 6: Verify backend service tests**

Run: `go test ./internal/modules/quotation/service -count=1`

Expected: PASS.

- [ ] **Step 7: Commit backend normalization**

```bash
git add internal/modules/quotation/service/official_quotation_header.go internal/modules/quotation/service/official_quotation_header_test.go internal/modules/quotation/service/*_html_renderer.go internal/modules/quotation/service/*_html_renderer_test.go
git commit -m "feat: normalize quotation document headers"
```

### Task 2: Parse persisted metadata into a typed model

**Files:**
- Create: `src/module/quotation/features/quotations/components/quotation-document-header-model.ts`
- Create: `src/module/quotation/features/quotations/components/quotation-document-header-model.test.ts`

**Interfaces:**
- Consumes: quotation `content: string`.
- Produces: `QuotationDocumentHeaderModel` and `parseQuotationDocumentHeader(content: string)`.

- [ ] **Step 1: Write canonical and legacy parser tests**

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { parseQuotationDocumentHeader } from './quotation-document-header-model';

describe('parseQuotationDocumentHeader', () => {
  it('reads canonical semantic fields', () => {
    const model = parseQuotationDocumentHeader(`<header data-block-type="metadata"><h1>PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD</h1><p><span data-field="quotation_number">VEN/0826/007</span></p><p><span data-field="subject">Sistem Self-Ordering</span></p><p><span data-field="issue_date_header">Jumat, 7 Agustus 2026</span></p><p><span data-field="client_pic">Muh. Khalid</span></p><p><span data-field="client_company">Qtrust</span></p></header>`);
    expect(model).toEqual({ title: 'PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD', number: 'VEN/0826/007', subject: 'Sistem Self-Ordering', issueDate: 'Jumat, 7 Agustus 2026', clientPic: 'Muh. Khalid', clientCompany: 'Qtrust' });
  });

  it('supports the legacy talent header', () => {
    const model = parseQuotationDocumentHeader(`<header><h1>PENAWARAN LAYANAN TALENT OUTSOURCING</h1><p>VEN/01</p><p>Backend Engineer</p></header>`);
    expect(model).toMatchObject({ number: 'VEN/01', subject: 'Backend Engineer', issueDate: '', clientPic: '', clientCompany: '' });
  });
});
```

- [ ] **Step 2: Run the parser test and confirm it fails**

Run: `yarn vitest run src/module/quotation/features/quotations/components/quotation-document-header-model.test.ts`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement parser normalization**

```ts
export type QuotationDocumentHeaderModel = {
  title: string; number: string; subject: string; issueDate: string;
  clientPic: string; clientCompany: string;
};

const text = (root: ParentNode, selector: string) =>
  root.querySelector(selector)?.textContent?.trim() ?? '';

export function parseQuotationDocumentHeader(content: string): QuotationDocumentHeaderModel {
  const document = new DOMParser().parseFromString(content, 'text/html');
  const header = document.querySelector('[data-block-type="metadata"]') ?? document.querySelector('header');
  const legacy = header ? Array.from(header.querySelectorAll(':scope > p'), (p) => p.textContent?.trim() ?? '') : [];
  return {
    title: header ? text(header, 'h1') : '',
    number: text(document, '[data-field="quotation_number"]') || legacy[0] || '',
    subject: text(document, '[data-field="subject"]') || legacy[1] || '',
    issueDate: text(document, '[data-field="issue_date_header"]'),
    clientPic: text(document, '[data-field="client_pic"]'),
    clientCompany: text(document, '[data-field="client_company"]'),
  };
}
```

- [ ] **Step 4: Cover all eight titles, missing header, escaping, and long values**

Use `it.each` for the eight titles and explicit empty-string assertions. Do not insert placeholder glyphs into the model.

- [ ] **Step 5: Run and commit the parser**

Run: `yarn vitest run src/module/quotation/features/quotations/components/quotation-document-header-model.test.ts`

Expected: PASS.

```bash
git add src/module/quotation/features/quotations/components/quotation-document-header-model.ts src/module/quotation/features/quotations/components/quotation-document-header-model.test.ts
git commit -m "feat: parse quotation header metadata"
```

### Task 3: Build the native Venturo masthead

**Files:**
- Create: `src/module/quotation/features/quotations/components/quotation-document-header.tsx`
- Create: `src/module/quotation/features/quotations/components/quotation-document-header.test.tsx`
- Create: `src/module/quotation/features/quotations/styles/quotation-document-header.css`

**Interfaces:**
- Consumes: `{ model: QuotationDocumentHeaderModel }`.
- Produces: `QuotationDocumentHeader`, a non-interactive React component.

- [ ] **Step 1: Write the failing markup contract test**

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { QuotationDocumentHeader } from './quotation-document-header';

it('renders the official accessible header', () => {
  const html = renderToStaticMarkup(<QuotationDocumentHeader model={{ title: 'PENAWARAN LAYANAN', number: 'VEN/01', subject: 'Sistem', issueDate: '7 Agustus 2026', clientPic: 'Khalid', clientCompany: 'Qtrust' }} />);
  expect(html).toContain('src="/logo/venturo-logo.png"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('<dt>No</dt>');
  expect(html).toContain('<dt>Perihal</dt>');
  expect(html).toContain('<dt>Tanggal</dt>');
  expect(html).toContain('Kepada');
  expect(html).toContain('Yth. Khalid');
  expect(html).not.toContain('<a');
});
```

- [ ] **Step 2: Run the test and confirm the missing component**

Run: `yarn vitest run src/module/quotation/features/quotations/components/quotation-document-header.test.tsx`

Expected: FAIL because the component is missing.

- [ ] **Step 3: Implement the component**

Use two fixed binary text rows inside an `aria-hidden` element, `<img src="/logo/venturo-logo.png" alt="Venturo — Expert Programmers" />`, a centered `<h1>`, a `<dl>` for left metadata, and `<address>` for `Kepada`. Give each colon its own `.quotation-official-header__colon` span. Render `Yth.` only when `clientPic` exists and omit an empty company line.

- [ ] **Step 4: Implement reference dimensions and theme rules**

```css
.quotation-official-header { color: var(--qtr-document-ink); margin: -16px 0 32px; }
.quotation-official-header__binary { height: 48px; overflow: hidden; color: rgba(145,158,171,.32); font: 16px/1.35 monospace; white-space: pre; }
.quotation-official-header__logo { display: block; width: 240px; height: auto; margin: 8px 0 28px 52px; }
.quotation-official-header__title { max-width: 520px; margin: 0 auto 26px; text-align: center; font-size: 22px; line-height: 1.15; font-weight: 700; }
.quotation-official-header__metadata { display: grid; grid-template-columns: minmax(0,1fr) minmax(220px,34%); gap: 48px; }
.quotation-official-header__facts { display: grid; grid-template-columns: 72px 12px minmax(0,1fr); margin: 0; }
.quotation-official-header__recipient { margin: 0; font-style: normal; overflow-wrap: anywhere; }
```

At `max-width: 600px`, stack metadata and reset logo margin. In dark mode use low-opacity light binary text. Under `@media print`, force white/black document colors, retain two columns, hide editor UI, and set `break-inside: avoid` on the official header.

- [ ] **Step 5: Run and commit the component**

Run: `yarn vitest run src/module/quotation/features/quotations/components/quotation-document-header.test.tsx`

Expected: PASS.

```bash
git add src/module/quotation/features/quotations/components/quotation-document-header.tsx src/module/quotation/features/quotations/components/quotation-document-header.test.tsx src/module/quotation/features/quotations/styles/quotation-document-header.css
git commit -m "feat: add Venturo quotation masthead"
```

### Task 4: Integrate without changing saved HTML

**Files:**
- Modify: `src/module/quotation/features/quotations/components/quotation-editor.tsx`
- Modify: `src/module/quotation/features/quotations/components/document-canvas.tsx`
- Modify: `src/module/quotation/features/quotations/components/quotation-document-style.test.ts`
- Test: `src/module/quotation/features/quotations/components/*-document-roundtrip.test.tsx`

**Interfaces:**
- Consumes: parser and masthead from Tasks 2–3.
- Produces: one visible native header plus unchanged Tiptap serialization.

- [ ] **Step 1: Add failing style and round-trip assertions**

```ts
expect(stylesheet).toContain(".quotation-document__editor .ProseMirror > [data-block-type='metadata']");
expect(stylesheet).toContain('.quotation-official-header__metadata');
expect(stylesheet).toContain('@media print');
```

In one canonical test for each quotation family, assert saved HTML still contains `data-block-type="metadata"`, `quotation_number`, `subject`, `issue_date_header`, `client_pic`, and `client_company`.

- [ ] **Step 2: Run focused tests and observe the new assertion failure**

Run: `yarn vitest run src/module/quotation/features/quotations/components/quotation-document-style.test.ts src/module/quotation/features/quotations/components/*-document-roundtrip.test.tsx`

Expected: FAIL only on missing shared-header integration.

- [ ] **Step 3: Mount the native header before `EditorContent`**

```tsx
const headerModel = useMemo(() => parseQuotationDocumentHeader(content), [content]);

<Box ref={containerRef} className="quotation-document__editor" sx={{ position: 'relative' }}>
  <QuotationDocumentHeader model={headerModel} />
  <TableGripOverlay editor={editor} containerRef={containerRef} isUnlocked={isUnlocked} />
  <EditorContent editor={editor} />
</Box>
```

Import `useMemo`, the parser, and component. Never pass the React header into Tiptap.

- [ ] **Step 4: Hide only the editor's persisted duplicate**

Import `quotation-document-header.css` from `document-canvas.tsx` and add:

```css
.quotation-document__editor .ProseMirror > [data-block-type='metadata'],
.quotation-document__editor .ProseMirror > header:first-child:not([data-block-type]) {
  display: none;
}
```

The legacy selector supports old Talent Outsourcing HTML. Do not hide metadata in non-editor renderers.

- [ ] **Step 5: Run all quotation component tests**

Run: `yarn vitest run src/module/quotation/features/quotations/components`

Expected: PASS.

- [ ] **Step 6: Commit integration**

```bash
git add src/module/quotation/features/quotations/components/quotation-editor.tsx src/module/quotation/features/quotations/components/document-canvas.tsx src/module/quotation/features/quotations/components/quotation-document-style.test.ts src/module/quotation/features/quotations/components/*-document-roundtrip.test.tsx
git commit -m "feat: render official header above quotation editor"
```

### Task 5: Visual, print, and full-family verification

**Files:**
- Modify: `e2e/dedicated-squad-quotation.spec.ts`
- Delete: `public/assets/images/QuotationHeader.png`

**Interfaces:**
- Consumes: completed semantic contract and frontend masthead.
- Produces: regression coverage and removal of the opaque screenshot.

- [ ] **Step 1: Add browser assertions**

```ts
const header = page.locator('.quotation-official-header');
await expect(header).toHaveCount(1);
await expect(header.locator('img')).toHaveAttribute('src', '/logo/venturo-logo.png');
await expect(header.getByRole('heading', { level: 1 })).toHaveText('PENAWARAN LAYANAN DEDICATED PROGRAMMER SQUAD');
for (const label of ['No', 'Perihal', 'Tanggal', 'Kepada', 'Yth.']) await expect(header).toContainText(label);
```

- [ ] **Step 2: Run the focused E2E scenario**

Run: `yarn playwright test e2e/dedicated-squad-quotation.spec.ts --grep "golden flow"`

Expected: PASS when its existing API/database harness is available. If the suite remains intentionally skipped, record the skip and perform the same assertions manually.

- [ ] **Step 3: Compare all eight types with the reference**

Run `yarn dev`, open one document per service type at 100% zoom, and compare with `D:/venturo/Quotation-generator/docs/snapshots/quotation.png`. Confirm one header; 240px uncropped logo; centered title of at most two lines; aligned labels/colons; correctly positioned recipient; wrapping without overlap; stacked mobile metadata; subtle dark-theme decoration; and white two-column A4 print output. Adjust only shared CSS measurements and rerun component/style tests after changes.

- [ ] **Step 4: Remove the screenshot asset safely**

Run: `rg -n -F "QuotationHeader.png" . -g '!node_modules' -g '!.git'`

Expected: no runtime reference. Delete `public/assets/images/QuotationHeader.png`; keep `docs/snapshots/quotation.png` as the acceptance reference.

- [ ] **Step 5: Run complete verification**

Frontend:

```bash
yarn vitest run src/module/quotation/features/quotations/components
yarn eslint "src/module/quotation/features/quotations/**/*.{ts,tsx}"
yarn build
```

Backend:

```bash
go test ./internal/modules/quotation/service -count=1
go test ./internal/modules/quotation/... -count=1
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit browser coverage and cleanup**

```bash
git add e2e/dedicated-squad-quotation.spec.ts
git commit -m "test: verify unified quotation header"
```

## Completion Criteria

- All eight renderers emit one normalized semantic metadata header.
- Every quotation editor displays one native Venturo header matching the reference.
- Saved HTML retains its metadata header and protected data fields.
- Light, dark, mobile, and A4 print layouts satisfy the approved design.
- The opaque screenshot is absent from runtime assets.
- Frontend and backend checks pass without altering unrelated working-tree files.
