# Quotation Product Surface Cleanup Design

**Date:** 2026-08-12  
**Scope:** Remove company skeleton/template features from the frontend  
**Application:** `quotation-app`

## Goal

Transform the starter frontend from a generic company skeleton into a focused Quotation & Contract Generator product for IT Business Analysts, while preserving only the technical foundations and real domain dependencies required by the application.

## Product Surface After Cleanup

### Internal authenticated surface

- `/` redirects to the quotation workspace.
- `/quotation` is the primary internal quotation list and editor.
- `/contract` is a translated Contract Generator foundation page marked `Coming Soon`; it contains no fake contract data or non-functional controls.
- Existing JWT authentication remains required for internal routes.

### Public unauthenticated surface

- `/p/q/:token` remains the public quotation preview and signing flow.
- No dashboard shell, authentication, or internal navigation is rendered for public quotation pages.
- A future `/p/c/:token` route is not added in this cleanup because Contract public delivery is not implemented yet; it will be introduced with the Contract feature.

## Features To Remove Completely

Remove from active routes, navigation, providers, translations, and source files:

- Finance dashboard.
- Monitoring dashboard.
- Sales dashboard.
- Demo item pages, including empty-state demo.
- Demo order list and detail pages.
- Branch management UI.
- Role management UI.
- User management UI.
- Translation override UI and runtime sync.
- Home page statistics/activity built from invoice, order, user, deployment, and payment dummy data.
- Dashboard-specific mock datasets and unused generic `_mock` datasets.

Deletion applies to source files, not just route visibility. Shared primitives that are imported by quotation, auth, layout, or error handling must remain even if they originated in the starter.

## Features To Keep

- JWT auth provider, guards, sign-in/sign-up pages, auth types, and auth API.
- Core client module/API because quotation creation requires a valid `client_id`.
- Shared Axios instance and auth refresh behavior.
- Theme provider, global CSS, i18n provider, localization provider, snackbar, progress bar, motion provider, error boundary, shared table/form/dialog components, and layouts used by remaining routes.
- Dashboard shell and account/language controls needed by internal users.
- Quotation feature and its internal/public routes.
- Shared configuration and environment handling.

Settings drawer remains only if its controls are generic application settings such as theme mode, color preset, layout direction, or density. It must not expose company-skeleton feature management.

## Contract Foundation

Add a small feature at `src/module/contract/features/contracts/`:

```text
src/module/contract/features/contracts/
├── pages/index.tsx
└── views/contracts-coming-soon-view.tsx
```

Register `/contract` in centralized paths, dashboard routes, navigation, and the `navigation`/`contract` translation namespaces. The page uses `DashboardContent` and `PageHeader`, explains that Contract Generator is the next product area, and offers one translated link/action back to Quotation. It must not use mock contract records, fake KPIs, disabled-looking fake workflows, or unrelated skeleton copy.

The Contract foundation is deliberately read-only and small. Contract CRUD, templates, clauses, public contract links, and contract signatures remain future implementation work.

## Home Route Behavior

The dashboard index should not show generic company metrics. Replace the existing skeleton home page with a product-oriented quotation landing view or redirect index directly to `/quotation`.

Recommended behavior: redirect `/` to `/quotation` inside the authenticated dashboard route tree. This removes the need for a second dashboard home page and makes the primary product workflow immediate after login. Keep the existing auth redirect path pointing to `/` so auth behavior remains compatible.

## Navigation

The internal navigation contains only:

- Quotation.
- Contract.

The account menu may retain profile, language, theme/settings, and logout because these are cross-cutting controls rather than business skeleton features. No `Demo Page`, dashboard category, settings management, or generic company administration item remains in the business navigation.

## Runtime Provider Cleanup

Remove from `src/app.tsx`:

- `OnboardingDialog`, unless a remaining auth requirement proves it is needed for sign-up completion.
- `TranslationOverrideSync`.

Keep the provider order and global overlays needed by the remaining app. If the onboarding component has no remaining consumer after route cleanup, delete its source file; do not leave a runtime import that can trigger skeleton behavior.

## Translation Cleanup

Remove translation namespaces whose only consumers are deleted features:

- `dashboard.json`.
- `demo.json`.
- `demo-order.json`.
- `branches.json`.
- `roles.json`.
- `users.json`.
- `translation-override.json`.
- Any home strings that describe generic invoice/order/user/deployment metrics.

Keep `auth`, `common`, `navigation`, `quotation`, `error`, `messages`, and settings translations only when they still have active consumers. Add matching Indonesian and English Contract translations.

## Dependency and File Deletion Rules

- Before deleting a file, search all `src/` imports and remove/update consumers first.
- Do not delete shared UI components solely because they were originally supplied by the skeleton; retain any component used by quotation, auth, contract foundation, layout, or error paths.
- Delete generic `_mock` data only when no active source import remains.
- Do not remove backend core modules in this frontend cleanup; auth and client APIs remain required by the frontend and quotation backend.
- Do not change package dependencies unless a removed skeleton feature is the sole consumer and the dependency can be proven unused by build/search.

## Error and Fallback Behavior

- Unknown internal paths continue to use the existing 404 boundary.
- `/contract` always renders the translated coming-soon page, not a 404.
- Public quotation errors continue to use the existing API-first error handling.
- No removed skeleton route may silently redirect to a generic dashboard page.

## Verification

From `quotation-app`:

```text
yarn eslint "src/**/*.{js,jsx,ts,tsx}"
```

Targeted checks:

- Search active source for removed route paths and navigation labels: `demo`, `dashboards/finance`, `dashboards/monitoring`, `dashboards/sales`, `settings/branches`, `settings/roles`, `settings/users`, and `settings/translation-override`.
- Confirm no active import points to deleted modules or translation files.
- Verify `/` reaches `/quotation` after authentication.
- Verify `/quotation` loads the quotation workspace.
- Verify `/contract` loads the localized coming-soon page.
- Verify `/p/q/:token` remains unauthenticated and functional.
- Verify sign-in/sign-up still build and route correctly.

## Self-Review

- Scope is limited to frontend product-surface cleanup and a minimal Contract foundation.
- Auth and core client dependencies are explicitly retained, avoiding accidental breakage of quotation creation and internal access.
- Generic dummy business data is removed rather than renamed or hidden.
- No fake Contract functionality is introduced.
- The specification contains no unresolved placeholders or ambiguous deletion rules.
