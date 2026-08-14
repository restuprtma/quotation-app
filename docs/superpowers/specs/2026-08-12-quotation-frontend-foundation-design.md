# Quotation Frontend Foundation & UI Design

**Date:** 2026-08-12  
**Scope:** Roadmap Tahap 3, Frontend Foundation & UI  
**Application:** `quotation-app`

## Goal

Build the complete quotation frontend foundation in React + Vite so internal users can browse and edit quotations, and clients can view a polished read-only quotation and sign it. The feature must follow the existing Minimals MUI architecture, use the shared Axios instance, and remain ready for Tahap 4 API integration.

## Scope

### Included

- Shared API configuration and quotation endpoint definitions.
- Internal quotation dashboard with search, status filtering, pagination, detail, create, and edit flows.
- Quotation form fields for client, project type, budget, requirements, maintenance, hosting, and notes.
- Editable AI content fields for project description, scope of work, and blueprint JSON.
- AI generation action connected to the existing `/quotation/v1/ai/generate` endpoint.
- Generic blueprint renderer for actors, phases, and activities.
- Public quotation preview at `/p/q/:token` without authentication.
- Touch-friendly signature canvas with clear and submit states.
- Bahasa Indonesia and English translations for all new user-facing strings.
- Route, navigation, type, API, component, hook, and utility additions under the existing feature-module conventions.

### Explicitly Deferred

- Public quotation GET and signature POST integration because the current backend does not expose `/p/q/:token` or `/p/q/:token/sign` yet.
- Client autocomplete backed by the core client endpoint, because the current backend quotation DTO requires a UUID but no client list contract was supplied for this task. The form uses a UUID-capable client input and is structured for replacement by an autocomplete hook in Tahap 4.
- Quotation delete, revisions, sharing, comparison, contract generation, and PDF export because they are not part of the Tahap 3 checklist or currently available backend endpoints.

## Architecture

Create the feature at:

```text
src/module/quotation/features/quotations/
├── api/
├── components/
├── hooks/
├── pages/
├── types/
├── utils/
└── views/
```

### API

Extend `src/shared/lib/axios.ts` with one `endpoints.quotation` object:

- `quotations.list`: `/quotation/v1/quotations`
- `quotations.byId(id)`: `/quotation/v1/quotations/:id`
- `quotations.create`: `/quotation/v1/quotations`
- `quotations.update(id)`: `/quotation/v1/quotations/:id`
- `ai.generate`: `/quotation/v1/ai/generate`

The feature API module uses the shared Axios instance and unwraps the existing response envelope. It must not instantiate another Axios client. `VITE_SERVER_URL` remains the configurable server base; local development defaults to the backend URL through the existing environment files.

### Routing

Add centralized paths:

- Internal list: `/quotation`
- Public preview: `/p/q/:token`

Register the internal route under the dashboard layout and the public route in a separate route section without `AuthGuard`. The public page uses the simple layout but owns a document-like content surface so it looks appropriate for an external client.

### State

- Dashboard pagination, search, and status filters use local state and `useTable`.
- Dashboard list state retains existing rows while refetching.
- Create/edit dialog state is local to the list view.
- Form state uses React Hook Form and Zod.
- Preview state uses the route token and a typed fallback fixture until the public API is available.
- Signature drawing is local canvas state; submit changes the local success state and is explicitly isolated for later API wiring.

## UI Design

### Internal Dashboard

The dashboard uses `DashboardContent`, `PageHeader`, a filter card, and the shared table toolkit. Table columns:

- Quotation number
- Client name
- Budget
- Project type
- Status
- Created date
- Revision
- Actions

Rows are clickable to open a read-only detail dialog. The actions popover contains View Detail and Edit, with the standard MUI menu pattern. Status values use chips with stable color mapping for draft, shared, signed, and contract-created states.

The empty state distinguishes an initial empty list from a search/filter miss. First-load skeletons are shown only while there is no data; existing rows remain visible during refetch.

### Create/Edit Dialog

The form is a wide responsive dialog with pinned title/actions and scrollable content. It contains:

- Client UUID input, required.
- Project type select: Product Based or Project Based.
- Rupiah budget field using `RHFNumericField`.
- Client requirements multiline field, required.
- Maintenance info, hosting info, and notes optional fields.
- AI editor fields for project description and scope of work.
- Blueprint JSON editor with a live renderer preview when the JSON parses.

The Generate AI action sends the PRD-shaped payload with project type, client name, client industry, budget, requirements, and notes. Since the current form only has a client UUID, client name and industry are optional context fields in the UI and default to safe values until client reference data is integrated. A failed request shows an actionable error and leaves entered content intact; it does not silently overwrite user text.

Save sends the backend-shaped create or update payload. Create starts as a draft. Update preserves the active revision fields. Success closes the dialog, refreshes the list, and opens the saved quotation detail.

### Detail Dialog

The detail dialog displays quotation metadata, budget, content, optional service information, and a reusable blueprint rendering. It offers Edit and Close actions. It handles partial/null revision fields without rendering `null` or crashing.

### Public Preview

The public document surface has:

- Branded header with quotation number and revision.
- Client and date metadata.
- Project description and scope sections.
- Budget summary and optional maintenance/hosting information.
- Blueprint timeline/cards using the same renderer as the internal UI.
- Signature section with clear, canvas, and consent/submit actions.

The page is responsive, has strong document hierarchy, and avoids dashboard navigation. It displays a small non-blocking fallback notice only when the route is using fixture data because the public endpoint is not yet available.

### Signature Canvas

Implement a small dependency-free canvas component rather than adding a new package. It supports:

- Pointer events for mouse, pen, and touch.
- Resize-aware canvas setup with device-pixel-ratio scaling.
- Clear action.
- `toDataURL('image/png')` output for the future sign endpoint.
- Disabled submit until a stroke exists.
- Success state after local submission, with the component API exposing the generated image for Tahap 4.

## Data Types

Frontend types mirror the backend DTOs and PRD blueprint schema:

- `Quotation`
- `QuotationRevision`
- `QuotationItem`
- `Blueprint`
- `BlueprintActor`
- `BlueprintPhase`
- `BlueprintActivity`
- `QuotationListParams`
- `CreateQuotationPayload`
- `UpdateQuotationPayload`
- `AIGeneratePayload`
- `AIGenerateResponse`

Optional backend response fields are represented as nullable/optional in TypeScript and normalized at the view boundary.

## Internationalization

Add parallel namespaces:

- `src/locales/langs/id/quotation.json`
- `src/locales/langs/en/quotation.json`

All labels, buttons, status names, validation messages, empty states, fallback notices, and feedback use the quotation namespace or shared `common` namespace. Static option arrays store translation keys rather than display labels.

## Error Handling

- List first-load failures use a page-level MUI `Alert`.
- Save and AI generation failures use the existing blocking `ErrorDialog` while keeping the form open.
- Validation errors render at the field and first-error level according to the existing form conventions.
- Invalid blueprint JSON shows an inline editor error and does not break the rest of the form or detail page.
- Public fallback data is explicitly typed and only used for routes whose API is not yet implemented.

## Verification

Run from `quotation-app`:

```text
yarn lint
yarn fm:check
yarn build
```

Manual smoke checks:

- Navigate to `/quotation`, search/filter/paginate, open detail, open edit, and create a quotation.
- Trigger Generate AI with backend available and verify the three editor fields update.
- Navigate to `/p/q/demo-quotation-token`, verify responsive read-only content, clear/sign canvas, and success state.
- Switch language and verify quotation labels and validation messages change.

## Self-Review

- No unresolved placeholders or ambiguous implementation requirements remain in this document.
- Public API fallback is explicit and limited to the missing backend endpoints; dashboard data must not become a local mock source.
- The feature structure, routing, i18n, table, form, and error handling align with the existing project conventions.
- The scope is limited to Tahap 3; revisions, sharing, deletion, contracts, and real public API integration remain later work.
