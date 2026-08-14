# Quotation Frontend-Backend Integration Implementation Plan

> **For agentic workers:** Implement this plan task-by-task with verification checkpoints. Use the existing repository conventions; do not add a frontend test runner or alter unrelated user changes.

**Goal:** Complete Tahap 4 by connecting AI generation and quotation persistence to real API calls, adding public quotation retrieval and signature submission, and verifying the full client approval flow.

**Architecture:** Keep the existing shared Axios client and internal quotation API contract. Add a public backend route group keyed only by revision `public_token`, with a dedicated safe DTO and transactional signing service. Replace the public frontend fixture-first flow with API-first loading and signing, retaining fixture rendering only for an explicit demo fallback when a real public token is unavailable.

**Tech Stack:** React 19, TypeScript, Vite, MUI v7, Axios, React Hook Form, Zod, Gin, Go, pgx/v5, PostgreSQL, base64 PNG data URLs.

## Global Constraints

- Public routes do not use `JWTAuth` or `CompanyContext`.
- Public responses must not expose `company_id`, `created_by`, `ai_raw_response`, or signed IP data.
- Public lookup uses the revision UUID `public_token` as the sole access key.
- Signature input must be a non-empty `data:image/png;base64,` data URL and must not exceed 2 MiB encoded.
- A signed quotation cannot be overwritten; repeated signing returns HTTP 409.
- Signature storage changes from `VARCHAR(500)` to `TEXT`.
- Use the existing shared Axios instance; do not create another frontend client.
- Use the existing API response envelope and error normalization patterns.
- Do not add Redux, React Query, SWR, or a frontend test runner.
- Real Gemini/OpenAI integration and object storage remain deferred to Tahap 5.
- Preserve existing user changes in `CLAUDE.md`, `PRD.md`, and `.agents/`.

## File Map

### Backend: `quotation-api`

- Create: `internal/modules/quotation/dto/public_dto.go` — safe public response/request DTOs.
- Modify: `internal/modules/quotation/dto/quotation_request.go` — signature request validation shape if shared there.
- Modify: `internal/modules/quotation/repository/quotation_repository.go` — public lookup and transactional signing queries.
- Modify: `internal/modules/quotation/service/quotation_service.go` — public read/sign methods and validation errors.
- Modify: `internal/modules/quotation/handler/quotation_handler.go` — public GET/sign handlers and status mapping.
- Modify: `internal/modules/quotation/main.quotation.go` — public route registration.
- Modify: `internal/router/router.go` — mount the same quotation module under `/p`.
- Create: `internal/database/migrations/quotation/20260812_signature_text.up.sql` — change signature column to TEXT.
- Create: `internal/database/migrations/quotation/20260812_signature_text.down.sql` — rollback column type with documented size caveat.

### Frontend: `quotation-app`

- Modify: `src/shared/lib/axios.ts` — public quotation endpoint definitions.
- Modify: `src/module/quotation/features/quotations/types/index.ts` — public/signature API types.
- Modify: `src/module/quotation/features/quotations/api/index.ts` — public GET/sign API functions.
- Modify: `src/module/quotation/features/quotations/hooks/use-quotation-public.ts` — public request lifecycle hook.
- Modify: `src/module/quotation/features/quotations/components/signature-canvas.tsx` — expose disabled state cleanly during submission if needed.
- Modify: `src/module/quotation/features/quotations/views/quotation-public-view.tsx` — API-first loading and POST signing flow.
- Modify: `src/module/quotation/features/quotations/utils/fallback.ts` — explicit demo fallback only, never fallback for real tokens.
- Modify: `src/locales/langs/id/quotation.json` — integration loading/error/success strings.
- Modify: `src/locales/langs/en/quotation.json` — parallel English strings.
- Modify: `todo.md` — mark Tahap 4 items only after verification.

## Task 1: Add Public DTOs and Signature Migration

**Files:**
- Create: `quotation-api/internal/modules/quotation/dto/public_dto.go`
- Create: `quotation-api/internal/database/migrations/quotation/20260812_signature_text.up.sql`
- Create: `quotation-api/internal/database/migrations/quotation/20260812_signature_text.down.sql`

**Interfaces:**
- `type SignPublicQuotationRequest struct { SignatureImage string `json:"signature_image" binding:"required"` }`
- `type PublicQuotationResponse struct { QuotationNumber, ClientName, ProjectType, Status string; CreatedAt time.Time; Revision PublicQuotationRevisionResponse }`
- `type PublicQuotationRevisionResponse` contains revision number, public token, budget, public content fields, blueprint, signature URL, signed timestamp, and items.

- [ ] Define public DTOs without company ID, creator ID, AI raw response, or signed IP.
- [ ] Keep `ClientName` as a nullable-safe string or pointer consistent with the existing client join behavior.
- [ ] Add the up migration:

```sql
ALTER TABLE quotation_revisions
    ALTER COLUMN signature_image_url TYPE TEXT;
```

- [ ] Add the down migration with a comment that rollback can fail when stored values exceed 500 characters:

```sql
ALTER TABLE quotation_revisions
    ALTER COLUMN signature_image_url TYPE VARCHAR(500);
```

- [ ] Run the quotation migration file syntax through the repository migration workflow if a database is available.

## Task 2: Implement Backend Public Repository and Service

**Files:**
- Modify: `quotation-api/internal/modules/quotation/repository/quotation_repository.go`
- Modify: `quotation-api/internal/modules/quotation/service/quotation_service.go`

**Interfaces:**
- `GetPublicQuotation(ctx context.Context, publicToken string) (*domain.PublicQuotation, error)` or an equivalent repository-safe aggregate.
- `SignPublicRevision(ctx context.Context, publicToken, signatureData, signedIP string) error`.
- `GetPublic(ctx context.Context, publicToken string) (*dto.PublicQuotationResponse, error)`.
- `SignPublic(ctx context.Context, publicToken, signatureData, signedIP string) (*dto.PublicQuotationResponse, error)`.

- [ ] Add repository-level errors `ErrPublicNotFound` and `ErrAlreadySigned`.
- [ ] Implement public lookup by joining `quotation_revisions`, `quotations`, and `core.clients`, filtering `deleted_at IS NULL`, and loading items by revision ID.
- [ ] Ensure lookup does not require company ID and scans only fields needed by the public DTO.
- [ ] Implement signing in a transaction:
  1. Select the revision and parent quotation by public token.
  2. Return `ErrAlreadySigned` if `signed_at IS NOT NULL`.
  3. Update signature data, timestamp, and server-derived IP.
  4. Update parent quotation status to `signed`.
  5. Commit and return the updated public aggregate.
- [ ] Add service validation before repository access:
  - Parse `publicToken` with `uuid.Parse`.
  - Require `strings.HasPrefix(signatureData, "data:image/png;base64,")`.
  - Decode the suffix using `base64.StdEncoding.DecodeString`.
  - Reject empty bytes and encoded data URL length greater than `2*1024*1024`.
- [ ] Add service errors `ErrPublicNotFound`, `ErrAlreadySigned`, and `ErrInvalidSignature` and map repository errors to them.
- [ ] Map backend domain data to the safe public DTO and include items, blueprint, signed timestamp, and status.
- [ ] Run `gofmt -w internal/modules/quotation` and `go test ./internal/modules/quotation/...`; expected existing tests pass or report environment/database prerequisites.

## Task 3: Expose Backend Public Routes

**Files:**
- Modify: `quotation-api/internal/modules/quotation/handler/quotation_handler.go`
- Modify: `quotation-api/internal/modules/quotation/main.quotation.go`
- Modify: `quotation-api/internal/router/router.go`

**Interfaces:**
- `Handler.GetPublic(c *gin.Context)` handles `GET /p/q/:public_token`.
- `Handler.SignPublic(c *gin.Context)` handles `POST /p/q/:public_token/sign`.
- `Module.SetupPublicRoutes(router *gin.RouterGroup)` registers the public route group.

- [ ] Implement `GetPublic` with no auth/company middleware and return `response.Success` with the safe DTO.
- [ ] Implement `SignPublic` using `ShouldBindJSON`, derive IP from `c.ClientIP()`, call the service, and return the updated safe DTO.
- [ ] Map errors as follows:
  - public not found → 404
  - invalid signature → 400
  - already signed → 409
  - unexpected repository/service error → 500 without leaking SQL details
- [ ] Keep internal `SetupRoutes` unchanged except for shared handler wiring.
- [ ] Register the same initialized module under `quotationV1` and `router.Group("/p")` so public routes are available at `/p/q/:public_token`.
- [ ] Run `gofmt -w internal/modules/quotation internal/router/router.go`, then `go test ./...` and `go build ./...`.

## Task 4: Extend Frontend Public API and Hook

**Files:**
- Modify: `quotation-app/src/shared/lib/axios.ts`
- Modify: `quotation-app/src/module/quotation/features/quotations/types/index.ts`
- Modify: `quotation-app/src/module/quotation/features/quotations/api/index.ts`
- Create: `quotation-app/src/module/quotation/features/quotations/hooks/use-quotation-public.ts`

**Interfaces:**
- `endpoints.quotation.public.byToken(token)` → `/p/q/${token}`.
- `endpoints.quotation.public.sign(token)` → `/p/q/${token}/sign`.
- `getPublicQuotation(token): Promise<Quotation>`.
- `signPublicQuotation(token, signatureImage): Promise<Quotation>`.
- `useQuotationPublic(token): { data: Quotation | null; loading: boolean; error: string | null; refresh(): void }`.

- [ ] Add public endpoint functions to the existing quotation endpoint registry.
- [ ] Add `SignPublicQuotationPayload` and any response normalization types needed for public DTO fields.
- [ ] Implement public GET and POST through the shared Axios instance and local envelope unwrap helper.
- [ ] Implement the hook to fetch on token change, retain data during refetch, expose loading/error, and provide refresh.
- [ ] Do not send or require auth headers manually; the shared Axios request interceptor will simply have no token for public visitors.
- [ ] Run targeted frontend ESLint and `yarn build`.

## Task 5: Replace Fixture-First Public View With API-First Flow

**Files:**
- Modify: `quotation-app/src/module/quotation/features/quotations/views/quotation-public-view.tsx`
- Modify: `quotation-app/src/module/quotation/features/quotations/utils/fallback.ts`
- Modify: `quotation-app/src/module/quotation/features/quotations/components/signature-canvas.tsx`
- Modify: `quotation-app/src/locales/langs/id/quotation.json`
- Modify: `quotation-app/src/locales/langs/en/quotation.json`

**Interfaces:**
- Real token flow: `useQuotationPublic(token)` → render backend quotation.
- Demo flow: only `token === 'demo-quotation-token'` may render `getPublicQuotation(token)` after a request failure or when explicitly requested.
- Signature flow: `signPublicQuotation(token, signatureData)` → update view with returned signed quotation.

- [ ] Load public quotation from API on mount/token change.
- [ ] Render a translated document skeleton while loading.
- [ ] Render a translated public error state for real-token failures; do not silently show another quotation.
- [ ] Keep the existing demo fixture only for `demo-quotation-token`, with a visible translated demo/fallback notice.
- [ ] Remove the fallback notice for successful real API responses.
- [ ] Derive `approved` from `quotation.status === 'signed'` or `revision.signed_at`, not only local state.
- [ ] On signature submit, set submitting state, call `signPublicQuotation`, replace local quotation with server response, and preserve canvas data when the request fails.
- [ ] Disable canvas and submit controls while submitting or when already signed.
- [ ] Show blocking `ErrorDialog` for sign errors and retain a page-level error for load errors.
- [ ] Add translations for loading, load failure, signing, signing failure, already signed, and demo fallback.
- [ ] Run Prettier on changed frontend files, targeted ESLint, and `yarn build`.

## Task 6: Validate End-to-End Behavior and Update Roadmap

**Files:**
- Modify: `D:\venturo\Quotation-generator\todo.md`

- [ ] Run frontend checks from `quotation-app`:

```text
yarn eslint "src/module/quotation/**/*.{ts,tsx}" "src/routes/paths.ts" "src/routes/sections/*.tsx" "src/layouts/nav-config-dashboard.tsx" "src/shared/lib/axios.ts"
```

- [ ] Run backend checks from `quotation-api`:

```text
```

- [ ] If a configured database/backend is available, manually verify:
  - Generate AI updates description, scope, and blueprint.
  - Create persists the draft and subsequent content update.
  - Public GET renders the exact revision referenced by the token.
  - Signature POST persists the base64 PNG, timestamp, server IP, and signed status.
  - Second signature attempt returns 409 and preserves the first signature.
  - Invalid token returns 404 and does not show a different quotation.
- [ ] Update Tahap 4 checklist items to `[x]` only after checks pass; add a note that AI remains mock until Tahap 5.
- [ ] Run `git diff --check` in both repositories and inspect status; do not stage, commit, or revert unrelated changes.

## Self-Review Checklist

- Spec coverage: Task 1 covers storage/DTO, Tasks 2-3 cover backend public flow, Tasks 4-5 cover frontend API and UI integration, Task 6 covers roadmap and verification.
- Placeholder scan: no endpoint, function, or validation rule is left unnamed; demo fallback criteria are explicit.
- Type consistency: public DTO maps to the frontend `Quotation` shape; `signPublicQuotation` returns the same shape consumed by the public view.
- Security coverage: token-only lookup, safe DTO, bounded base64, server IP, and no overwrite are all represented in implementation tasks.
