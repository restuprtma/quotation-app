# AI Contract

## Policy

AI is a writing and structuring assistant. It returns JSON, never executable HTML/CSS. The backend validates the JSON and preserves the user's manual pricing.

## Bundle

The response contains:

- `schema_version`.
- `narrative`.
- `product_or_project_detail`.
- `blueprint`.
- `pricing_labels`.

`pricing_labels` may describe sections/items but is not authoritative pricing.

## Provider Selection

```text
AI_PROVIDER=mock
AI_PROVIDER=ollama
AI_PROVIDER=gemini
AI_PROVIDER=openrouter
AI_PROVIDER=groq
```

- Mock: deterministic tests.
- Ollama: private/local prototype with no API token cost.
- Gemini: hosted prototype after checking current free-tier quota and terms.
- OpenRouter/Groq: optional hosted experiments; availability and quota can change.

API keys belong only in backend environment variables.

## Validation

Validate required keys, schema version, allowed diagram types, string/count limits, and unsafe HTML markers. Invalid output must not overwrite the existing draft.
