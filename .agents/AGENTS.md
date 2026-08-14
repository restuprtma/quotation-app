# Agent Guide - quotation-app

## Token-efficient reading

Before coding, read this file and the short `PRD.md`. Do **not** read every product document.

Read only the document matching the task:

- Pricing form/calculation: `docs/product/pricing-model.md`.
- AI request/response/provider: `docs/product/ai-contract.md`.
- Blueprint editor/renderer: `docs/product/blueprint-schema.md`.
- Public pages/tokens: `docs/product/public-artifacts.md` and `docs/product/security-rules.md`.
- Contract UI: `docs/product/contract-generator.md`.

Read `docs/CONVENTIONS.md` for any new feature. Read a `docs/patterns/*.md` file only when the task uses that pattern.

## Project scope

This frontend is only for Quotation & Contract Generator. Active business surfaces are:

- Internal `/quotation` workspace.
- Internal `/contract` foundation or Contract feature.
- Public `/p/q/:token`, `/p/b/:token`, and `/p/d/:token` artifacts.
- JWT auth and core client/tenant context.

Do not reintroduce finance, sales, monitoring, demo, generic admin, or company-skeleton features.

## Commands

- Node >=22; Yarn v1.
- `yarn dev` starts Vite on port 8081.
- `yarn build` runs TypeScript and Vite production build.
- `yarn eslint "src/**/*.{js,jsx,ts,tsx}"` runs full lint.
- `yarn eslint "src/module/quotation/**/*.{ts,tsx}"` runs focused quotation lint.
- There is no test runner. Do not invent `yarn test`.

## Non-negotiable rules

- Use `src/...` imports.
- Use shared Axios; never create a second client.
- Use React Hook Form + Zod for forms.
- Use `RHFNumericField` for money.
- Use MUI `sx`, not Tailwind.
- Use i18n for every user-facing string.
- Never execute raw AI HTML/CSS/script. Render validated JSON with controlled components.
- Never let AI overwrite manual pricing.
- Never put API keys in frontend code.

## Architecture

- Routes: `src/routes/paths.ts` and `src/routes/sections/`.
- Quotation feature: `src/module/quotation/features/quotations/`.
- Future public artifact components: `src/module/quotation/features/artifacts/`.
- Contract feature: `src/module/contract/features/contracts/`.
- Shared UI: `src/shared/ui/`.
- Single app provider wiring: `src/app.tsx`.
- Single Axios instance: `src/shared/lib/axios.ts`.

## Workflow

1. Read only the short root `todo.md` index; do not read the whole roadmap history.
2. Open the linked phase file, for example `docs/roadmap/phase-06-frontend-pricing.md`.
3. Read only the product/pattern documents listed inside that phase file.
4. Inspect the existing implementation before editing.
5. Make the smallest correct change.
6. Run focused lint/build, then the full relevant verification.
7. Update the phase file checkbox and root `todo.md` status only after verification.
