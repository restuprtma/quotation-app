# Quotation Frontend-Backend Integration Design

**Date:** 2026-08-12  
**Scope:** Roadmap Tahap 4, Frontend - Backend Integration  
**Repositories:** `quotation-app` and `quotation-api`

## Goal

Replace the remaining Tahap 3 public fixture flow with real backend integration and verify the complete quotation path: AI generation, quotation persistence, public quotation retrieval, and client signature submission.

## Current State

- The frontend already calls the internal quotation endpoints for list, detail, create, update, and AI generation.
- The frontend create/edit form currently creates a draft and then updates its active revision content in a second request.
- The public frontend route `/p/q/:token` still renders a local fixture.
- The signature canvas generates a PNG data URL but only changes local UI state; it does not call the backend.
- The backend exposes internal quotation and AI routes under `/quotation/v1`, but has no public quotation routes.
- `quotation_revisions.signature_image_url` is currently `VARCHAR(500)`, which is too small for a base64 PNG data URL.

## Scope

### Included

- Frontend API functions for public quotation GET and signature POST.
- Frontend public view loading by `public_token`, with loading/error/success states.
- Frontend signature submission using the canvas PNG data URL.
- Backend public GET quotation endpoint by revision `public_token`.
- Backend public POST signature endpoint by revision `public_token`.
- Base64 PNG validation, size limit, UTC timestamp, and client IP capture.
- Status transition from `shared` or `draft` to `signed` after a valid signature.
- PostgreSQL migration changing signature storage to `TEXT`.
- Backend tests for public token lookup and signature validation/service behavior where the existing repository test setup permits.
- Update `todo.md` after verification.

### Explicitly Deferred

- Real Gemini/OpenAI integration; the existing mock provider remains for Tahap 5.
- Object storage upload; base64 is stored in PostgreSQL for this integration phase.
- Share/magic-link generation, revision creation, delete, comparison, and contract generation.
- Legal digital-signature compliance; this remains a simple drawn signature as described by the PRD.

## API Contract

### Public GET

```text
GET /p/q/:public_token
```

Response envelope:

```json
{
  "data": {
    "quotation_number": "QUO-2026-0001",
    "client_name": "RS Harapan Sehat",
    "project_type": "project_based",
    "status": "shared",
    "created_at": "2026-08-01T08:00:00Z",
    "revision": {
      "revision_number": 1,
      "public_token": "uuid",
      "budget": 500000000,
      "project_description": "...",
      "scope_of_work": "...",
      "maintenance_info": "...",
      "hosting_info": "...",
      "notes": "...",
      "blueprint_data": {},
      "signature_image_url": null,
      "signed_at": null,
      "items": []
    }
  },
  "message": "Public quotation retrieved successfully"
}
```

The public response uses a dedicated DTO and does not expose `company_id`, `created_by`, `ai_raw_response`, or signed IP data.

### Public Signature POST

```text
POST /p/q/:public_token/sign
Content-Type: application/json
```

Request:

```json
{
  "signature_image": "data:image/png;base64,iVBORw0KGgo..."
}
```

Success response returns the same public quotation shape with status `signed` and populated `signed_at`. The backend derives the IP from Gin request metadata and does not accept an IP supplied by the browser.

Validation rules:

- `signature_image` is required.
- It must use the `data:image/png;base64,` prefix.
- The decoded payload must be non-empty.
- The encoded request is limited to a bounded size to prevent oversized database writes; the chosen limit is 2 MiB for the complete data URL.
- A quotation already signed returns a conflict response and does not overwrite the original signature.
- Unknown, malformed, or non-public tokens return `404` without leaking tenant information.

## Backend Design

### Routing

`quotation.Module.SetupPublicRoutes(router *gin.RouterGroup)` registers:

- `GET /p/q/:public_token` → `Handler.GetPublic`
- `POST /p/q/:public_token/sign` → `Handler.SignPublic`

The root router creates the quotation module once, mounts internal routes under `/quotation/v1`, and mounts public routes under `/p`. Public routes do not use `JWTAuth` or `CompanyContext`.

### Repository

Add repository operations:

- `GetPublicQuotation(ctx, publicToken string)` — join revision, quotation, and client using only the public UUID token; require non-deleted quotation and revision.
- `SignPublicRevision(ctx, publicToken, signatureData, signedIP string)` — update the revision only when `signed_at IS NULL`, set `signature_image_url`, `signed_at`, `signed_ip`, and update parent quotation status to `signed` in one transaction.

The public query must use the revision token as the sole lookup key. It must not require company context and must not return internal columns through the public DTO.

### Service

Add service methods:

- `GetPublic(ctx, publicToken string) (*dto.PublicQuotationResponse, error)`
- `SignPublic(ctx, publicToken, signatureData, signedIP string) (*dto.PublicQuotationResponse, error)`

The service validates the UUID token before repository access, validates the data URL format and decoded size, and maps repository not-found/already-signed errors to handler-level errors.

### DTO

Add:

- `PublicQuotationResponse`
- `PublicQuotationRevisionResponse`
- `SignPublicQuotationRequest`

The DTO should reuse only safe public fields from the existing response mapping and include quotation display fields, active revision content, items, signature image URL, and signed timestamp.

### Database Migration

Add a quotation migration that changes `quotation_revisions.signature_image_url` from `VARCHAR(500)` to `TEXT`. The down migration changes it back to `VARCHAR(500)` only if existing values fit; the migration must document that rollback can fail if stored values exceed 500 characters.

## Frontend Design

### API Layer

Extend `endpoints.quotation.public` with:

- `byToken(token)`: `/p/q/${token}`
- `sign(token)`: `/p/q/${token}/sign`

Add:

- `getPublicQuotation(token): Promise<Quotation>`
- `signPublicQuotation(token, signatureImage): Promise<Quotation>`

Use the existing envelope unwrap helper pattern and the shared Axios instance. Public calls must not trigger an authenticated refresh loop when the backend endpoint is unauthenticated; no Authorization header is required.

### Public View State

The public view changes from synchronous fixture rendering to a request lifecycle:

- On mount or token change, fetch the public quotation.
- While loading, render a document skeleton.
- On success, render the real response and hide the fallback notice.
- On `404` or network error, show a translated error state and optionally provide a clearly labeled preview fallback only for development/demo tokens. Production public tokens must not silently display another quotation.
- If the returned status is `signed`, render the approval success state and do not show an editable signature canvas.

### Signature Flow

- `SignatureCanvas` continues to emit a PNG data URL.
- Public view enables the submit button only when a signature exists and the quotation is not already signed.
- On submit, call `signPublicQuotation(token, signature)`.
- Keep the signature area disabled while submitting.
- On success, replace the signature form with the translated approval confirmation and the server-returned quotation state.
- On failure, keep the canvas content and show a blocking error dialog so the client can retry.

## Error Handling

- Backend malformed token: `400` or `404` without internal details; `404` is preferred for public anti-enumeration behavior.
- Backend unknown token: `404`.
- Backend already signed: `409`.
- Backend invalid signature format/size: `400`.
- Frontend public load failure: page-level error state; no silent substitution for real tokens.
- Frontend sign failure: blocking error dialog while preserving the drawn signature.
- Internal AI/create/update errors retain the existing form values and show the existing error dialog.

## Security and Privacy

- Public access is scoped by a cryptographically random UUID revision token.
- No tenant ID, creator ID, AI raw response, or signed IP is exposed publicly.
- Client IP comes from the server request, not from a user-supplied field.
- Signature data is bounded before decoding and before database update.
- A signed quotation cannot be silently overwritten.

## Verification

From `quotation-app`:

```text
yarn eslint "src/module/quotation/**/*.{ts,tsx}" "src/routes/paths.ts" "src/routes/sections/*.tsx" "src/layouts/nav-config-dashboard.tsx" "src/shared/lib/axios.ts"
yarn build
```

From `quotation-api`:

```text
go test ./...
```

Manual/API checks:

- Generate AI from the quotation form and verify the response populates description, scope, and blueprint.
- Create a quotation and verify both create and update requests persist content.
- Open a real revision token at `/p/q/:token` and verify the page renders backend data.
- Draw a signature and submit it; verify the response is `signed`, the database has the base64 image and timestamp, and a second submit returns conflict.
- Open an invalid token and verify no fallback quotation is displayed.

## Self-Review

- The design covers all four Tahap 4 checklist items.
- The previous fixture limitation is removed for real tokens; fallback behavior is restricted to explicitly identified development/demo cases.
- Frontend and backend response shapes are defined consistently.
- Signature storage, validation, status transition, and replay protection are explicit.
- Real AI and object storage remain outside Tahap 4 and are not mixed into this scope.
