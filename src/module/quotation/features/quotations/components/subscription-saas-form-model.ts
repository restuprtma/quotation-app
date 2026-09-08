import { z } from 'zod';

import {
  MAX_SUBSCRIPTION_SAFE_AMOUNT,
  RIGHTS_CLAUSE_VENTURO_SOFTWARE_OWNERSHIP_V1,
} from '../constants/subscription-saas';

export const subscriptionPricePeriodSchema = z.object({
  label: z.string().trim().min(1).max(200),
  start_month_offset: z.number().int().min(0).max(59),
  duration_months: z.number().int().min(1).max(60),
  monthly_rate: z.number().int().min(1).max(MAX_SUBSCRIPTION_SAFE_AMOUNT),
});

export const subscriptionOneTimeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  amount: z.number().int().min(1).max(MAX_SUBSCRIPTION_SAFE_AMOUNT),
});

export const subscriptionPaymentSchema = z.object({
  work_period: z.string().trim().min(1).max(200),
  start_month_offset: z.number().int().min(0).max(59),
  covered_months: z.number().int().min(1).max(60),
  invoice_date_label: z.string().trim().max(200),
  due_date_label: z.string().trim().max(200),
  nominal: z.number().int().min(1).max(MAX_SUBSCRIPTION_SAFE_AMOUNT),
});

export const subscriptionFeatureGroupSchema = z.object({
  name: z.string().trim().min(1).max(200),
  features: z.array(z.string().trim().min(1).max(200)).min(1).max(50),
});

export const incomeSharingSchema = z.object({
  venturo_share_bps: z.number().int().min(0).max(10_000),
  partner_share_bps: z.number().int().min(0).max(10_000),
  eligible_revenue_description: z.string().trim().min(1).max(2_000),
  settlement_business_days: z.number().int().min(1).max(365),
  prohibit_unilateral_discount: z.boolean(),
});

const subscriptionSaaSBaseSchema = z.object({
  product_name: z.string().trim().min(1).max(200),
  quotation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  section_layout: z.enum(['subscription_development', 'development_maintenance']),
  billing_cycle: z.enum(['monthly', 'quarterly', 'yearly']),
  tax_treatment: z.enum(['not_stated', 'exclusive_ppn', 'inclusive_ppn']),
  initial_term_months: z.number().int().min(1).max(60),
  auto_renewal: z.boolean(),
  price_periods: z.array(subscriptionPricePeriodSchema).min(1).max(10),
  one_time_items: z.array(subscriptionOneTimeSchema).max(20),
  payment_schedule: z.array(subscriptionPaymentSchema).min(1).max(60),
  feature_groups: z.array(subscriptionFeatureGroupSchema).max(30),
  rights_clause_code: z.enum(['', RIGHTS_CLAUSE_VENTURO_SOFTWARE_OWNERSHIP_V1]),
  is_partnership: z.boolean(),
  income_sharing: incomeSharingSchema.optional(),
});

export function validateSubscriptionCrossFields(
  data: z.infer<typeof subscriptionSaaSBaseSchema>,
  ctx: z.RefinementCtx
) {
  // 1. Price coverage validation
  let priceOffset = 0;
  for (let i = 0; i < data.price_periods.length; i += 1) {
    const period = data.price_periods[i];
    if (period.duration_months > data.initial_term_months) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duration (${period.duration_months} months) cannot exceed initial term (${data.initial_term_months} months)`,
        path: ['price_periods', i, 'duration_months'],
      });
    }
    if (period.start_month_offset !== priceOffset) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be contiguous and start at 0 (expected ${priceOffset}, got ${period.start_month_offset})`,
        path: ['price_periods', i, 'start_month_offset'],
      });
    }
    priceOffset += period.duration_months;
  }

  if (priceOffset !== data.initial_term_months) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total price duration (${priceOffset} months) must equal initial term (${data.initial_term_months} months)`,
      path: ['price_periods'],
    });
  }

  // 2. Payment coverage and billing cycle validation
  let paymentOffset = 0;
  for (let i = 0; i < data.payment_schedule.length; i += 1) {
    const row = data.payment_schedule[i];
    if (row.start_month_offset !== paymentOffset) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be contiguous and start at 0 (expected ${paymentOffset}, got ${row.start_month_offset})`,
        path: ['payment_schedule', i, 'start_month_offset'],
      });
    }

    switch (data.billing_cycle) {
      case 'monthly': {
        if (row.covered_months !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Covered months must be 1 for monthly billing cycle',
            path: ['payment_schedule', i, 'covered_months'],
          });
        }
        break;
      }
      case 'quarterly': {
        if (i < data.payment_schedule.length - 1) {
          if (row.covered_months !== 3) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Covered months must be 3 for quarterly billing cycle',
              path: ['payment_schedule', i, 'covered_months'],
            });
          }
        } else if (row.covered_months < 1 || row.covered_months > 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Covered months must be between 1 and 3 for quarterly billing cycle',
            path: ['payment_schedule', i, 'covered_months'],
          });
        }
        break;
      }
      case 'yearly': {
        if (i < data.payment_schedule.length - 1) {
          if (row.covered_months !== 12) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Covered months must be 12 for yearly billing cycle',
              path: ['payment_schedule', i, 'covered_months'],
            });
          }
        } else if (row.covered_months < 1 || row.covered_months > 12) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Covered months must be between 1 and 12 for yearly billing cycle',
            path: ['payment_schedule', i, 'covered_months'],
          });
        }
        break;
      }
      default:
        break;
    }

    paymentOffset += row.covered_months;
  }

  if (paymentOffset !== data.initial_term_months) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total payment covered months (${paymentOffset}) must equal initial term (${data.initial_term_months})`,
      path: ['payment_schedule'],
    });
  }

  // 3. Section layout rule
  if (data.section_layout === 'development_maintenance' && data.feature_groups.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Feature groups are required for development & maintenance layout',
      path: ['feature_groups'],
    });
  }

  // 4. Partnership & income sharing rules
  if (data.is_partnership) {
    if (!data.income_sharing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Income sharing is required when is_partnership is true',
        path: ['income_sharing'],
      });
    } else if (
      data.income_sharing.venturo_share_bps + data.income_sharing.partner_share_bps !==
      10_000
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Income sharing shares must total 10,000 basis points',
        path: ['income_sharing'],
      });
    }
  } else if (data.income_sharing) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Income sharing must be empty when is_partnership is false',
      path: ['income_sharing'],
    });
  }

  // 5. Total contract and reconciliation with payment schedule
  let recurringTotal = 0;
  for (const period of data.price_periods) {
    recurringTotal += period.monthly_rate * period.duration_months;
  }

  let oneTimeTotal = 0;
  for (const item of data.one_time_items) {
    oneTimeTotal += item.amount;
  }

  const totalContract = recurringTotal + oneTimeTotal;

  if (totalContract > MAX_SUBSCRIPTION_SAFE_AMOUNT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Total contract exceeds maximum safe amount',
      path: ['price_periods'],
    });
  }

  let paymentTotal = 0;
  for (const row of data.payment_schedule) {
    paymentTotal += row.nominal;
  }

  if (paymentTotal !== totalContract) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total payment schedule (${paymentTotal}) must equal total contract (${totalContract})`,
      path: ['payment_schedule'],
    });
  }
}

export const subscriptionSaaSSchema = subscriptionSaaSBaseSchema.superRefine(
  validateSubscriptionCrossFields
);

export const subscriptionSaaSFormSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().trim().min(1).max(200),
  client_company_name: z.string().trim().max(200).optional(),
  subject: z.string().trim().min(1).max(200),
  solution_type: z.string().trim().min(1).max(100),
  commercial_scheme: z.literal('subscription_saas'),
  subscription_saas: subscriptionSaaSSchema,
});

export type SubscriptionSaaSFormValues = z.infer<typeof subscriptionSaaSFormSchema>;
export type SubscriptionSaaSValidationValues = z.infer<typeof subscriptionSaaSSchema>;
