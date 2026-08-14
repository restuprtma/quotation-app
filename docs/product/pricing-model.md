# Pricing Model

## Product Based

Product offers use sections and packages/modules. A line may contain features, unit label, unit price, quantity, billing period, setup fee, and recurring fee.

```text
line_total = unit_price * quantity
```

Example: `Rp 4.000 * 200 santri = Rp 800.000 / bulan`.

## Project Based

Project offers use sections/phases and resources. A line may contain role, rate, employee count, duration, duration unit, and milestone.

```text
line_total = rate * employee_count * duration
```

Example: `Rp 11.550.000 * 1 employee * 1 month = Rp 11.550.000`.

## Rules

- Money is integer Rupiah, never floating point.
- AI never creates or changes prices, quantity, rate, employee count, duration, discounts, tax, or totals.
- Server recalculates every line total.
- Separate one-time and recurring totals.
- Frontend must not silently discard pricing when project type changes.
- Product editor and project editor use different fields but share section/item primitives where practical.
