# Quotation Product Surface Cleanup Implementation Plan

> **For agentic workers:** Implement this plan task-by-task with verification checkpoints. Delete skeleton source only after active imports are removed and preserve unrelated user changes.

**Goal:** Remove generic company skeleton features from `quotation-app` and leave a focused Quotation workspace plus a minimal Contract Generator foundation.

**Architecture:** Keep shared runtime foundations, JWT auth, core client access, dashboard/public layouts, and quotation feature code. Reduce authenticated routes/navigation to quotation and contract, redirect the dashboard index to quotation, remove skeleton runtime providers, and delete unreferenced skeleton source, translations, and mocks after import checks.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, MUI v7, i18next, Axios, existing shared UI and auth provider.

## Global Constraints

- Remove source files for deleted features, not just route visibility.
- Preserve JWT auth, core client, shared Axios, theme, i18n, shared UI, layouts, error boundary, and quotation.
- Do not delete shared components solely because they originated in the skeleton.
- Do not add fake contract data or non-functional contract controls.
- Keep `/quotation`, `/p/q/:token`, and add `/contract` as a real coming-soon product surface.
- Keep account, language, theme/settings, and logout controls as cross-cutting features.
- Do not remove backend core modules in this frontend cleanup.
- Use `src/...` imports and existing MUI/i18n conventions.
- Do not stage, commit, revert, or modify unrelated pre-existing changes.

## File Map

### Create

- `src/module/contract/features/contracts/pages/index.tsx` — Contract route page wrapper.
- `src/module/contract/features/contracts/views/contracts-coming-soon-view.tsx` — localized Contract foundation page.
- `src/locales/langs/id/contract.json` — Indonesian Contract strings.
- `src/locales/langs/en/contract.json` — English Contract strings.

### Modify

- `src/routes/paths.ts` — remove skeleton paths and add `dashboard.contract.root`.
- `src/routes/sections/dashboard.tsx` — remove skeleton lazy pages/routes, redirect index to quotation, add contract route.
- `src/routes/sections/index.tsx` — retain only auth/public/dashboard sections.
- `src/layouts/nav-config-dashboard.tsx` — reduce navigation to Quotation and Contract.
- `src/app.tsx` — remove onboarding and translation override runtime components; keep required providers/overlays.
- `src/module/core/features/home/pages/index.tsx` or route setup — remove generic home route if no longer referenced.
- `src/locales/langs/id/navigation.json` — remove skeleton labels, add contract label.
- `src/locales/langs/en/navigation.json` — remove skeleton labels, add contract label.
- `src/locales/langs/id/common.json` and `en/common.json` — retain only shared keys used by remaining app if cleanup search proves safe.
- `todo.md` — optional note that skeleton cleanup is complete if tracked in roadmap.

### Delete after import verification

- `src/module/dashboard/**`.
- `src/module/core/features/demo/**`.
- `src/module/core/features/demo-order/**`.
- `src/module/core/features/branches/**`.
- `src/module/core/features/roles/**`.
- `src/module/core/features/users/**`.
- `src/module/core/features/translation-override/**`.
- `src/module/core/features/home/**` after route cleanup.
- Skeleton-only locale files: `dashboard.json`, `demo.json`, `demo-order.json`, `branches.json`, `roles.json`, `users.json`, `translation-override.json`; delete `home.json` if no active consumer remains.
- `src/_mock/**` files after a repository-wide active import search confirms no remaining consumer.

## Task 1: Map Active Consumers and Remove Route Surface

**Files:**
- Modify: `src/routes/paths.ts`
- Modify: `src/routes/sections/dashboard.tsx`
- Modify: `src/routes/sections/index.tsx`

**Interfaces:**
- `paths.dashboard.quotation.root` remains `/quotation`.
- New `paths.dashboard.contract.root` is `/contract`.
- Dashboard index redirects to `paths.dashboard.quotation.root` using the existing router redirect pattern.

- [ ] Search all route imports and consumers before editing so only skeleton route leaves are removed.
- [ ] Remove lazy imports and route entries for Home, Finance, Monitoring, Sales, Branches, Roles, Users, Translation Override, Demo Item, and Demo Order.
- [ ] Add a lazy Contract page import from `src/module/contract/features/contracts/pages`.
- [ ] Replace the dashboard index element with a `<Navigate to={paths.dashboard.quotation.root} replace />` route element or the existing project-equivalent redirect.
- [ ] Keep the quotation route under the authenticated dashboard layout.
- [ ] Keep public routes before dashboard routes and preserve the 404 route.
- [ ] Add `dashboard.contract.root` and remove path objects that have no remaining consumers.
- [ ] Run TypeScript/build once; missing Contract module is expected until Task 3, but route syntax must be valid.

## Task 2: Remove Skeleton Navigation and Runtime Providers

**Files:**
- Modify: `src/layouts/nav-config-dashboard.tsx`
- Modify: `src/app.tsx`
- Modify: `src/locales/langs/id/navigation.json`
- Modify: `src/locales/langs/en/navigation.json`

**Interfaces:**
- `useNavData()` returns one business section with Quotation and Contract only.
- `App` keeps I18n, Auth, Settings, Theme, Localization, MotionLazy, ProgressBar, Snackbar, and children; it no longer mounts onboarding or translation override sync.

- [ ] Remove `usePermission` and recursive permission filtering if no remaining dashboard nav item uses feature permissions; otherwise retain only the minimal helper needed by remaining items.
- [ ] Remove ICONS for home, finance, monitoring, sales, and demo; retain quotation and add a contract icon from existing public navbar assets.
- [ ] Set navigation items to translated Quotation and Contract paths only.
- [ ] Remove `OnboardingDialog` and `TranslationOverrideSync` imports and JSX from `app.tsx`.
- [ ] Keep `SettingsDrawer` only if its active settings are generic; verify it does not render skeleton feature management.
- [ ] Remove navigation translation keys for dashboards, demo, settings administration, and account text only if no remaining component consumes them; retain account/language/logout labels.
- [ ] Run targeted ESLint and search for removed navigation keys.

## Task 3: Add Contract Coming-Soon Foundation

**Files:**
- Create: `src/module/contract/features/contracts/pages/index.tsx`
- Create: `src/module/contract/features/contracts/views/contracts-coming-soon-view.tsx`
- Create: `src/locales/langs/id/contract.json`
- Create: `src/locales/langs/en/contract.json`

**Interfaces:**
- Default page export renders `<title>` and `<ContractsComingSoonView />`.
- `ContractsComingSoonView` renders `DashboardContent`, `PageHeader`, a translated product explanation, and a translated `RouterLink` back to `paths.dashboard.quotation.root`.

- [ ] Create parallel Contract translations for `title`, `subtitle`, `description`, `backToQuotation`, and `status`.
- [ ] Build a focused page without mock records, fake counts, disabled fake buttons, or unrelated dashboard cards.
- [ ] Use the existing `PageHeader`, `DashboardContent`, `Card`, `Iconify`, and router-link primitives.
- [ ] Add the Contract route from Task 1 and navigation item from Task 2.
- [ ] Run targeted ESLint and `yarn build`.

## Task 4: Replace Generic Home and Remove Skeleton Modules

**Files:**
- Delete after search: `src/module/core/features/home/**`
- Delete: `src/module/dashboard/**`
- Delete: `src/module/core/features/demo/**`
- Delete: `src/module/core/features/demo-order/**`
- Delete: `src/module/core/features/branches/**`
- Delete: `src/module/core/features/roles/**`
- Delete: `src/module/core/features/users/**`
- Delete: `src/module/core/features/translation-override/**`

- [ ] Search all `src/` imports for each feature directory and confirm route/provider/nav consumers were removed.
- [ ] Delete the feature directories only after no active import remains.
- [ ] Keep `src/module/core/features/auth/**`, `src/module/core/features/client/**` if present, `src/module/core/features/error/**`, `src/module/core/features/settings/**`, and `src/module/quotation/**`.
- [ ] Search for imported dashboard components such as KPI cards or chart cards; delete only when no remaining feature imports them.
- [ ] Search for home translation namespace consumers; remove the home feature/namespace when the dashboard index no longer imports it.
- [ ] Run `yarn build` immediately after deletion and resolve only import failures caused by the deleted skeleton modules.

## Task 5: Remove Skeleton Mock Data and Unused Translations

**Files:**
- Delete: `src/_mock/**` files with no active imports.
- Delete: skeleton-only locale JSON files after key/import search.
- Modify: `src/locales/langs/id/common.json` only for proven orphan keys.
- Modify: `src/locales/langs/en/common.json` only for proven orphan keys.

- [ ] Search for imports from `src/_mock` and remove the directory only when the result is empty.
- [ ] Search each candidate locale namespace name in `src/`; delete `dashboard`, `demo`, `demo-order`, `branches`, `roles`, `users`, `translation-override`, and `home` JSON only when no `useTranslate`/loader usage remains.
- [ ] Keep `auth`, `common`, `error`, `messages`, `navigation`, `quotation`, and `contract` namespaces if they have active consumers.
- [ ] Do not remove shared common keys without a direct usage search; only remove confirmed orphan strings.
- [ ] Run the i18n resource loader through `yarn build` to catch missing dynamic namespaces.

## Task 6: Final Cleanup, Verification, and Roadmap Note

**Files:**
- Modify: `todo.md` only if adding a cleanup completion note is desired.

- [ ] Search active source for removed paths and labels:

```text
dashboards/finance
settings/branches
settings/roles
settings/users
settings/translation-override
demo/item
```

- [ ] Search active imports for deleted namespaces/directories and confirm there are no results.
- [ ] Run from `quotation-app`:

```text
yarn eslint "src/**/*.{js,jsx,ts,tsx}"
git diff --check
```

- [ ] If full-repository ESLint exposes pre-existing baseline errors, run targeted ESLint for all modified/remaining product files and record the baseline limitation; do not reintroduce deleted skeleton code to satisfy stale config.
- [ ] Manually verify `/`, `/quotation`, `/contract`, `/p/q/:token`, sign-in, sign-up, account menu, language switch, and settings drawer.
- [ ] Confirm no skeleton feature is reachable from the dashboard navigation or a registered route.
- [ ] Inspect `git status` and `git diff --stat`; never remove unrelated user changes or generated artifacts such as `graphify-out/`.

## Self-Review Checklist

- Spec coverage: Tasks 1-2 remove route/nav/runtime surface, Task 3 adds Contract foundation, Tasks 4-5 delete source/translations/mocks, Task 6 verifies residual cleanup.
- Placeholder scan: Contract page copy and files are explicit; no vague deletion step remains.
- Type consistency: route path is defined before route/nav consumers; Contract page exports a default route page.
- Dependency safety: deletion is gated by import searches and build checks; shared auth/client/UI foundations are explicitly protected.
