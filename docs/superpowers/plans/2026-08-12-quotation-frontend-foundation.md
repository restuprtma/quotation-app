# Quotation Frontend Foundation Implementation Plan

> **For agentic workers:** Implement this plan task-by-task with verification checkpoints. Do not add a test runner; this repository uses `yarn lint`, `yarn fm:check`, and `yarn build` for validation.

**Goal:** Build Tahap 3 of the Quotation & Contract Generator frontend: API-ready internal quotation UI, AI editor, public read-only preview, and touch-friendly signature canvas.

**Architecture:** Add a `quotation` domain feature following the existing module layout. Internal list/detail/form flows use the shared Axios instance and backend envelope helpers; the public preview uses a typed local fallback only because the backend does not yet expose public quotation endpoints. Register internal and public routes separately, with the public route outside authentication.

**Tech Stack:** React 19, TypeScript, Vite, MUI v7, React Router 7, Axios shared instance, React Hook Form, Zod, i18next, HTML Canvas pointer events.

## Global Constraints

- Use `src/...` imports, never deep relative imports.
- Use MUI `sx`, not Tailwind.
- Use the existing shared Axios instance; do not create another client.
- Use React Hook Form + Zod for forms and `RHFNumericField` for Rupiah amounts.
- Use `useTable`, `TableHeadCustom`, `TableSkeleton`, and `TablePaginationCustom` for the quotation list.
- Use local state and context only; do not add Redux, React Query, SWR, or a test runner.
- Keep all new user-facing strings in parallel `id` and `en` quotation namespaces.
- Internal quotation list data must come from the backend API, not local mock data.
- Public fallback data is limited to the missing public GET/sign endpoints and must match the frontend quotation types.
- Do not modify existing user changes in `CLAUDE.md`, `PRD.md`, or `.agents/`.

## File Map

### Create

- `src/module/quotation/features/quotations/types/index.ts` — quotation, revision, blueprint, list params, and payload types.
- `src/module/quotation/features/quotations/api/index.ts` — envelope unwrapping and quotation API calls.
- `src/module/quotation/features/quotations/utils/format.ts` — locale-aware money/date/status helpers.
- `src/module/quotation/features/quotations/utils/fallback.ts` — explicit public preview fallback fixture and token normalization.
- `src/module/quotation/features/quotations/hooks/use-quotation-list.ts` — paginated list state and refresh.
- `src/module/quotation/features/quotations/hooks/use-quotation.ts` — detail fetch state.
- `src/module/quotation/features/quotations/hooks/use-quotation-dialog.ts` — local new/edit/view dialog state.
- `src/module/quotation/features/quotations/components/quotation-status-label.tsx` — status chip.
- `src/module/quotation/features/quotations/components/blueprint-renderer.tsx` — generic blueprint display.
- `src/module/quotation/features/quotations/components/signature-canvas.tsx` — pointer-event canvas.
- `src/module/quotation/features/quotations/components/quotation-table-row.tsx` — table row and popover actions.
- `src/module/quotation/features/quotations/components/quotation-detail-dialog.tsx` — read-only detail dialog.
- `src/module/quotation/features/quotations/components/quotation-form-dialog.tsx` — create/edit RHF dialog and AI editor.
- `src/module/quotation/features/quotations/views/quotation-list-view.tsx` — dashboard composition.
- `src/module/quotation/features/quotations/views/quotation-public-view.tsx` — public document composition.
- `src/module/quotation/features/quotations/pages/list.tsx` — thin internal route page.
- `src/module/quotation/features/quotations/pages/public.tsx` — thin public route page.
- `src/locales/langs/id/quotation.json` — Indonesian strings.
- `src/locales/langs/en/quotation.json` — English strings.
- `src/routes/sections/public.tsx` — unauthenticated public route section.

### Modify

- `src/shared/lib/axios.ts` — add quotation and AI endpoint definitions.
- `src/routes/paths.ts` — add internal quotation and public quotation paths.
- `src/routes/sections/dashboard.tsx` — lazy-load internal quotation list route.
- `src/routes/sections/index.tsx` — include public route section.
- `src/layouts/nav-config-dashboard.tsx` — add Quotation navigation item and icon.
- `src/locales/langs/id/navigation.json` — Indonesian navigation label.
- `src/locales/langs/en/navigation.json` — English navigation label.
- `todo.md` — mark only completed Tahap 3 UI/API foundation items after verification.

## Task 1: Register API, Types, Routes, Navigation, and i18n

**Files:**
- Modify: `src/shared/lib/axios.ts`
- Modify: `src/routes/paths.ts`
- Modify: `src/routes/sections/dashboard.tsx`
- Modify: `src/routes/sections/index.tsx`
- Create: `src/routes/sections/public.tsx`
- Modify: `src/layouts/nav-config-dashboard.tsx`
- Modify: `src/locales/langs/id/navigation.json`
- Modify: `src/locales/langs/en/navigation.json`
- Create: `src/locales/langs/id/quotation.json`
- Create: `src/locales/langs/en/quotation.json`
- Create: `src/module/quotation/features/quotations/types/index.ts`

**Interfaces:**
- `paths.dashboard.quotation.root: '/quotation'`
- `paths.public.quotation: (token: string) => '/p/q/${token}'`
- `endpoints.quotation.quotations.list`, `.byId(id)`, `.create`, `.update(id)`, and `.ai.generate`
- `Quotation`, `QuotationRevision`, `Blueprint`, `QuotationListParams`, `CreateQuotationPayload`, `UpdateQuotationPayload`, and `AIGeneratePayload`

- [ ] Add the endpoint object after `endpoints.core` in `src/shared/lib/axios.ts`, using `/quotation/v1/quotations` and `/quotation/v1/ai/generate`.
- [ ] Add the centralized paths and lazy route imports; mount `/quotation` inside dashboard children.
- [ ] Add `publicRoutes` with a `path: 'p/q/:token'` route rendering `SimpleLayout` plus a lazy public page, without `AuthGuard`.
- [ ] Include `publicRoutes` in `routesSection` before the dashboard catch-all behavior.
- [ ] Add `quotation` to navigation using an existing registered SVG icon and add matching `navigation.quotation` keys in both languages.
- [ ] Create parallel translation keys for title, subtitle, table, toolbar, statuses, form labels, validation, dialog actions, detail labels, public preview, signature, and errors.
- [ ] Define nullable response fields for revisions and a blueprint schema that accepts absent/partial data without unsafe `any` casts.
- [ ] Run `yarn build` to catch route/type errors before feature components exist; expected result may be missing-module errors until Task 2 is complete.

## Task 2: Implement API, Formatters, Fallback, and Data Hooks

**Files:**
- Create: `src/module/quotation/features/quotations/api/index.ts`
- Create: `src/module/quotation/features/quotations/utils/format.ts`
- Create: `src/module/quotation/features/quotations/utils/fallback.ts`
- Create: `src/module/quotation/features/quotations/hooks/use-quotation-list.ts`
- Create: `src/module/quotation/features/quotations/hooks/use-quotation.ts`
- Create: `src/module/quotation/features/quotations/hooks/use-quotation-dialog.ts`

**Interfaces:**
- `listQuotations(params): Promise<{ data: Quotation[]; meta: PaginationMeta }>`
- `getQuotation(id): Promise<Quotation>`
- `createQuotation(payload): Promise<Quotation>`
- `updateQuotation(id, payload): Promise<Quotation>`
- `generateQuotationAI(payload): Promise<AIGenerateResponse>`
- `useQuotationList(params): { data, meta, loading, error, refresh }`
- `useQuotation(id): { data, loading, error }`
- `useQuotationDialog(): { mode, id, open, close }`
- `getPublicQuotation(token): PublicQuotationFixture`

- [ ] Implement `unwrap` and `unwrapList` locally in the API module using the existing `{ data, message, meta, errors }` envelope, including a readable error extractor.
- [ ] Implement list, detail, create, update, and AI calls through the shared Axios default export and registered endpoints.
- [ ] Implement locale-aware `formatCurrency`, `formatDate`, and stable status color helpers using `i18next.resolvedLanguage`.
- [ ] Create one explicit fallback quotation fixture with blueprint actors, phases, activities, budget, scope, and signature-ready metadata; ignore the token only for fixture selection while preserving it for display/integration.
- [ ] Implement list hook with retained rows during refetch, first-load loading state, page/limit/search/status params, and `refresh` callback.
- [ ] Implement detail hook with reset-on-id behavior and normalized error messages.
- [ ] Implement local dialog hook with `new | edit | view` modes and optional IDs.
- [ ] Run `yarn lint` and `yarn build` after fixing import ordering with `yarn lint:fix` if needed.

## Task 3: Build Shared Quotation Components

**Files:**
- Create: `src/module/quotation/features/quotations/components/quotation-status-label.tsx`
- Create: `src/module/quotation/features/quotations/components/blueprint-renderer.tsx`
- Create: `src/module/quotation/features/quotations/components/signature-canvas.tsx`

**Interfaces:**
- `<QuotationStatusLabel status={QuotationStatus} />`
- `<BlueprintRenderer blueprint={Blueprint | null | undefined} compact?: boolean />`
- `<SignatureCanvas disabled?: boolean onChange?: (dataUrl: string | null) => void />`

- [ ] Map draft/shared/signed/contract-created to translated labels and MUI chip colors.
- [ ] Render blueprint summary, actors as chips, phases as timeline/cards, and activities with actor/action/system response/channel/output; render a translated empty state for missing blueprint data.
- [ ] Implement a canvas using `pointerdown`, `pointermove`, and `pointerup`, `touchAction: 'none'`, DPR-aware resize setup, clear, stroke tracking, and `toDataURL('image/png')`.
- [ ] Ensure the canvas exposes no signature data until a stroke is present and clears both pixels and callback value.
- [ ] Keep all component labels/tooltips translated.
- [ ] Run `yarn build` and manually inspect that the component prop types are consumed without `any`.

## Task 4: Build Internal Table Row and Detail Dialog

**Files:**
- Create: `src/module/quotation/features/quotations/components/quotation-table-row.tsx`
- Create: `src/module/quotation/features/quotations/components/quotation-detail-dialog.tsx`

**Interfaces:**
- `<QuotationTableRow row={Quotation} onView(id) onEdit(id) />`
- `<QuotationDetailDialog open id onClose onEdit />`

- [ ] Implement clickable dense table rows with quotation number, client, formatted budget, project type, status, date, revision, and popover actions.
- [ ] Use `stopPropagation` on the action cell, include View Detail first and Edit second, and avoid destructive actions not supported by the backend.
- [ ] Implement a fast-transition detail dialog with pinned title/actions and `DialogContent dividers`.
- [ ] Load detail via `useQuotation`, display metadata and active revision fields, and render `BlueprintRenderer`.
- [ ] Handle detail loading, error, absent revision, null content, and close/edit transitions without crashing.
- [ ] Run `yarn lint:fix`, `yarn lint`, and `yarn build`.

## Task 5: Build Create/Edit Form and AI Editor

**Files:**
- Create: `src/module/quotation/features/quotations/components/quotation-form-dialog.tsx`

**Interfaces:**
- `<QuotationFormDialog open mode id onClose onSaved />`
- `FormValues` containing `client_id`, `client_name`, `client_industry`, `project_type`, `budget`, `client_requirements`, `project_description`, `scope_of_work`, `maintenance_info`, `hosting_info`, `notes`, and `blueprint_json`.

- [ ] Define a `makeSchema(t)` Zod factory with required client UUID, project type, positive budget, requirements, description, scope, and valid JSON blueprint validation.
- [ ] Use `Form`, `Field.Text`, `Field.Select`, and `RHFNumericField`; use multiline text fields for requirements/content and an explicit JSON editor field.
- [ ] On new mode, reset default values; on edit mode, fetch detail and map the active revision to form values.
- [ ] Implement Generate AI loading/error state and send project type, client name fallback, client industry fallback, budget, newline-split requirements, and notes.
- [ ] Apply AI response only to description, scope, and blueprint fields; never overwrite budget or manually entered requirement fields.
- [ ] Implement Save for create/update with backend payload transformation, preserving parsed `blueprint_data`; keep dialog open on errors and show `ErrorDialog`.
- [ ] Use a wide responsive dialog, pinned actions, `transitionDuration`, and actions for Generate AI, Save, and close.
- [ ] Render a compact live `BlueprintRenderer` beside or below the JSON editor when the JSON parses.
- [ ] Run `yarn lint:fix`, `yarn lint`, and `yarn build`.

## Task 6: Compose Internal Dashboard and Public Preview

**Files:**
- Create: `src/module/quotation/features/quotations/views/quotation-list-view.tsx`
- Create: `src/module/quotation/features/quotations/views/quotation-public-view.tsx`
- Create: `src/module/quotation/features/quotations/pages/list.tsx`
- Create: `src/module/quotation/features/quotations/pages/public.tsx`

**Interfaces:**
- `QuotationListView` composes the dashboard table, toolbar, dialogs, refresh, and create action.
- `QuotationPublicView` reads `token` from `useParams`, uses `getPublicQuotation`, and composes read-only document plus `SignatureCanvas`.

- [ ] Build the internal list with `DashboardContent`, `PageHeader`, search/status toolbar, shared table toolkit, empty state, API error alert, and pagination.
- [ ] Wire row view/edit callbacks to local dialog state and refresh after successful save.
- [ ] Add a top-right outlined `+ Quotation` action using the translation namespace.
- [ ] Build the public document with responsive branded header, quotation metadata, content sections, budget summary, maintenance/hosting cards, and blueprint renderer.
- [ ] Add an explicit translated fallback notice indicating that public API data is not connected yet.
- [ ] Wire SignatureCanvas clear/submit UX, disable submit before a stroke, display success state, and retain the generated PNG data in local component state for Tahap 4.
- [ ] Ensure public view never imports auth hooks or dashboard navigation.
- [ ] Run `yarn lint:fix`, `yarn lint`, and `yarn build`.

## Task 7: Update Roadmap and Final Verification

**Files:**
- Modify: `D:\venturo\Quotation-generator\todo.md`

- [ ] Run `yarn lint` from `quotation-app` and resolve all reported errors.
- [ ] Run `yarn fm:check`; if formatting fails, run `yarn fm:fix` and rerun the check.
- [ ] Run `yarn build` and verify TypeScript plus Vite production build pass.
- [ ] Start `yarn dev` if environment permits and manually verify `/quotation` and `/p/q/demo-quotation-token` at desktop and mobile widths.
- [ ] Update only the Tahap 3 checklist items that are complete: API configuration, dashboard, form, AI editor, client preview, and digital signature UI. Note in the task summary that public endpoint submission remains deferred to Tahap 4.
- [ ] Review `git diff --stat` and `git diff --check`; do not stage or revert unrelated pre-existing changes.

## Self-Review Checklist

- Spec coverage: Tasks 1-2 cover API/configuration, Tasks 4-6 cover all five requested UI areas, Task 7 covers roadmap and verification.
- Placeholder scan: No implementation step depends on an unspecified endpoint or unnamed component; the only deferred work is explicitly identified in the design and Task 7.
- Type consistency: API and component interfaces are defined before their consumers; `Quotation`, `Blueprint`, and payload types are introduced in Task 1 and reused unchanged.
- Existing conventions: shared table toolkit, RHF/Zod, i18n, local dialog state, MUI dialogs, Axios endpoint registry, and no test runner are all enforced in the global constraints.
