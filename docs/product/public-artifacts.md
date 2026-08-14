# Public Artifacts

One quotation revision can publish three independent public artifacts:

| Artifact | Route | Purpose |
|---|---|---|
| Quotation | `/p/q/:artifact_token` | Pricing document and signature |
| Blueprint | `/p/b/:artifact_token` | Journey, architecture, state/workflow, rules |
| Detail | `/p/d/:artifact_token` | Product detail or project detail |

Each token is a server-generated UUID and is tied to one revision and one artifact type. The server must reject a token used for the wrong artifact type or a revoked token.

Only the quotation artifact contains the signature canvas. Public responses exclude tenant ID, creator ID, raw AI response, internal notes, and signed IP.
