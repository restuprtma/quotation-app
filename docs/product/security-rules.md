# Security Rules

- Internal API calls require JWT and tenant/company context.
- Public artifact access uses server-generated UUID tokens.
- Public endpoint verifies artifact type and revoked state.
- Never expose company ID, creator ID, raw AI response, internal notes, or signed IP.
- Signature accepts only a bounded PNG data URL and server records timestamp/IP.
- A signed quotation cannot be overwritten.
- AI provider keys stay on the backend.
- Do not execute raw AI HTML/CSS/scripts.
