# Agent Guide - quotation-app

## Token-efficient reading

Before coding, read this file and the short [PRD.md](PRD.md). Do **not** read every product document.

Read only the documents matching the specific task:
- Quotation editor & revisions: [PRD.md](PRD.md) § 2.A and [CONVENTIONS.md](docs/CONVENTIONS.md).
- Blueprint diagrams & pipeline: [PRD.md](PRD.md) § 2.B and [src/module/quotation/features/blueprints/](src/module/quotation/features/blueprints/).
- Blueprint share links: [src/module/quotation/features/blueprint-sharing/](src/module/quotation/features/blueprint-sharing/).
- Public pages & tokens: [PRD.md](PRD.md) § 3 and [src/routes/paths.ts](src/routes/paths.ts).
- Rate cards management: [src/module/quotation/features/rate-cards/](src/module/quotation/features/rate-cards/).

Read `docs/CONVENTIONS.md` for any new feature or pattern change.

## Project Scope

This frontend is exclusively for the Quotation & Contract Generator system. Active business surfaces are:

- Internal `/quotation` workspace (AI generation, TipTap Word-like editor, optimistic drafts, revisions).
- Internal `/blueprint` workspace (Multi-section visual pipeline, React Flow diagrams, share links).
- Internal `/contract` workspace (Signed contract foundation).
- Public `/p/q/:token` client quotation view with digital signature canvas.
- Public `/p/blueprint/:token` programmer blueprint technical view.
- JWT authentication and multi-company tenant switching.

Legacy routes (`/p/b/:token`, `/p/d/:token`, finance/inventory/sales skeletons) are purged and must not be reintroduced.

## Commands

- Node >=22; Yarn v1.
- `yarn dev` starts Vite on port 8081.
- `yarn build` runs TypeScript (`tsc --noEmit`) and Vite production build.
- `yarn lint` / `yarn lint:fix` runs ESLint.
- `yarn fm:check` / `yarn fm:fix` runs Prettier.
- There is no unit test runner. Do not invent `yarn test`.

## Non-negotiable Rules

- Use `src/...` imports.
- Use shared Axios; never create a second Axios client.
- Use `withoutAuthRefresh()` for public endpoints (`/p/q/:token`, `/p/blueprint/:token`).
- Use React Hook Form + Zod for forms.
- Use `RHFNumericField` for money and currency formatting.
- Use MUI `sx`, not Tailwind.
- Use i18n (`useTranslate`) for every user-facing string.
- TipTap HTML is strictly sanitized using UGC policies; Blueprint JSON is rendered via controlled React Flow / diagram components.
- Never overwrite dirty drafts without user confirmation. Optimistic locking 409 must be handled gracefully.
- Never expose API keys or secrets in frontend state/UI (only 4-char hint).

## Architecture

- Routes: `src/routes/paths.ts` and `src/routes/sections/`.
- Quotation feature: `src/module/quotation/features/quotations/`.
- Blueprint feature: `src/module/quotation/features/blueprints/`.
- Blueprint sharing feature: `src/module/quotation/features/blueprint-sharing/`.
- Rate cards feature: `src/module/quotation/features/rate-cards/`.
- AI settings feature: `src/module/quotation/features/ai-settings/`.
- Contract feature: `src/module/contract/features/contracts/`.
- Shared UI: `src/shared/ui/`.
- Single app provider wiring: `src/app.tsx`.
- Single Axios instance: `src/shared/lib/axios.ts`.

## Workflow

1. Read only the short root `todo.md` index; do not read the whole roadmap history.
2. Open the active plan or specification file.
3. Inspect the existing implementation before editing.
4. Make the smallest correct change.
5. Run focused lint/formatting/build (`yarn lint`, `yarn fm:check`, `yarn build`).
6. Update task checklist only after verification passes.
