# Product Contract - Quotation & Contract Generator v2

**Audience:** IT Business Analyst, Presales, Project Manager, and delivery team.  
**Updated:** 2026-08-12

This is the short product contract. Read the detail document only when the task requires it. Index: `docs/product/README.md`.

## Product

The app creates IT product/project quotations, uses AI as a structured writing assistant, renders three public documents, and later turns signed quotations into contracts.

Internal users authenticate with JWT. Clients use secret UUID artifact links without login.

## Two Quotation Modes

### Product based

Packages/modules/subscriptions. Lines support feature bullets, unit label, unit price, quantity/seat, billing period, setup fee, and recurring fee.

```text
line_total = unit_price * quantity
```

### Project based

Custom delivery/squad/phase pricing. Lines support phase, resource role, rate, employee count, duration, duration unit, and milestone.

```text
line_total = rate * employee_count * duration
```

Fixed lines use `line_total = fixed_amount`. All money is integer Rupiah. The server recalculates totals.

Detailed fields: `docs/product/pricing-model.md`.

## AI Rules

AI is a co-pilot. It may draft narrative, scope, deliverables, product/project detail, blueprint, and pricing descriptions.

AI must not decide or modify price, rate, quantity, employee count, duration, discount, tax, or total. AI returns versioned JSON, never executable HTML/CSS. Backend validates and sanitizes the bundle before saving. Provider keys are backend-only.

Bundle keys:

- `schema_version`
- `narrative`
- `product_or_project_detail`
- `blueprint`
- `pricing_labels`

Detailed contract/provider rules: `docs/product/ai-contract.md`.

## Public Artifacts

One revision produces three independent public artifacts:

| Artifact | URL | Purpose |
|---|---|---|
| Quotation | `/p/q/:artifact_token` | Pricing document and signature |
| Blueprint | `/p/b/:artifact_token` | Journey, architecture, workflow/state, business rules |
| Detail | `/p/d/:artifact_token` | Product detail or project detail |

Each token is a server-generated UUID tied to one revision and artifact type. Only the quotation page has a signature canvas. Public DTOs never expose tenant ID, creator ID, raw AI response, internal notes, or signed IP.

Detailed public rules: `docs/product/public-artifacts.md` and `docs/product/security-rules.md`.

## Blueprint

Blueprint is versioned JSON rendered by controlled components. It supports `journey`, `architecture`, `state_machine`, `workflow`, `timeline`, and `comparison` diagrams plus actors, rules, assumptions, edge cases, and outputs.

Detailed schema: `docs/product/blueprint-schema.md`.

## Contract

Only a quotation with status `signed` can create a contract. Lifecycle: `draft -> shared -> signed`. AI can draft wording, but users approve legal/commercial content.

Detailed contract rules: `docs/product/contract-generator.md`.

## Security

- Internal API: JWT plus tenant/company context.
- Public API: UUID artifact token and artifact-type check.
- Server calculates pricing.
- Signature is bounded PNG data URL with server timestamp/IP and cannot be overwritten.
- No raw AI HTML execution.
- No API keys in frontend.

## Source of Truth Rules

- Use this file for general product decisions.
- Use the linked detail file for task-specific schemas and contracts.
- If code conflicts with this file, update the implementation or explicitly update the PRD before coding.
