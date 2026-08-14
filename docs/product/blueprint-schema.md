# Blueprint Schema

Blueprint is a versioned JSON document rendered by controlled React components.

Required concepts:

- `schema_version`.
- title/version/summary.
- actors with channels and responsibilities.
- diagrams.
- business rules.
- assumptions.
- edge cases.
- outputs.

Supported diagram types:

- `journey`: columns and cards for an end-to-end journey.
- `architecture`: nodes and directed edges.
- `state_machine`: states and transitions.
- `workflow`: ordered operational steps.
- `timeline`: milestones and dates.
- `comparison`: optional package/solution comparison.

The renderer must show a safe empty state for missing optional data and must not execute AI-provided HTML or scripts.
