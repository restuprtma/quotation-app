import type { Control, UseFormRegister } from 'react-hook-form';
import type { CloudInfrastructureFormValues } from './cloud-infrastructure-form-model';

import { useWatch, Controller, useFieldArray } from 'react-hook-form';

import {
  Card,
  Grid,
  Stack,
  Button,
  Checkbox,
  MenuItem,
  CardHeader,
  Typography,
  CardContent,
  FormControlLabel,
} from '@mui/material';

import { useTranslate } from 'src/locales';

import { CloudFormField } from './cloud-form-field';
import { CloudTextList } from './cloud-scope-editor';
import { CLOUD_LIMITATION_CODES } from '../constants/cloud-infrastructure';

export function CloudPaymentLegalEditor({
  control,
  disabled,
}: {
  control: Control<CloudInfrastructureFormValues>;
  register: UseFormRegister<CloudInfrastructureFormValues>;
  disabled?: boolean;
}) {
  const { t } = useTranslate('quotation');
  const payments = useFieldArray({ control, name: 'cloud_infrastructure.payment_schedule' });
  const packageItems = useWatch({ control, name: 'cloud_infrastructure.package_items' });
  const setupItems = useWatch({ control, name: 'cloud_infrastructure.setup_items' });
  const monthlySubtotal = packageItems.reduce((sum, item) => sum + item.unit_rate, 0);
  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title={t('cloudInfrastructure.payment.title')} />
        <CardContent>
          <Stack spacing={2}>
            {Number.isSafeInteger(monthlySubtotal) && (
              <Typography>
                {t('cloudInfrastructure.payment.expectedMonthly', {
                  amount: monthlySubtotal.toLocaleString('id-ID'),
                })}
              </Typography>
            )}
            {payments.fields.map((field, index) => (
              <Grid container spacing={2} key={field.id}>
                {(['work_period', 'terms', 'invoice_date_label', 'due_date_label'] as const).map(
                  (name) => (
                    <Grid key={name} size={{ xs: 12, sm: 6 }}>
                      <CloudFormField
                        name={`cloud_infrastructure.payment_schedule.${index}.${name}`}
                        label={t(`cloudInfrastructure.payment.${name}`)}
                        disabled={disabled}
                      />
                    </Grid>
                  )
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CloudFormField
                    select
                    name={`cloud_infrastructure.payment_schedule.${index}.component`}
                    label={t('cloudInfrastructure.payment.component')}
                    disabled={disabled}
                  >
                    {['monthly_service', 'setup'].map((component) => (
                      <MenuItem
                        key={component}
                        value={component}
                        disabled={component === 'setup' && setupItems.length === 0}
                      >
                        {t(`cloudInfrastructure.payment.components.${component}`)}
                      </MenuItem>
                    ))}
                  </CloudFormField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CloudFormField
                    name={`cloud_infrastructure.payment_schedule.${index}.nominal`}
                    type="number"
                    label={t('cloudInfrastructure.payment.nominal')}
                    disabled={disabled}
                  />
                </Grid>
                <Button
                  onClick={() => payments.remove(index)}
                  disabled={disabled}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  {t('cloudInfrastructure.actions.remove')} {index + 1}
                </Button>
              </Grid>
            ))}
            <Button
              sx={{ minHeight: 44 }}
              onClick={() =>
                payments.append({
                  work_period: '',
                  terms: '',
                  invoice_date_label: '',
                  due_date_label: '',
                  component: 'monthly_service',
                  nominal: 1,
                })
              }
              disabled={disabled || payments.fields.length >= 120}
            >
              {t('cloudInfrastructure.actions.addPayment')}
            </Button>
            <CloudFormField
              name="cloud_infrastructure.payment_due_days"
              type="number"
              label={t('cloudInfrastructure.paymentDueDays')}
              disabled={disabled}
            />
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={t('cloudInfrastructure.limitation.title')} />
        <CardContent>
          <Stack spacing={2}>
            <CloudFormField
              select
              name="cloud_infrastructure.tax_treatment"
              label={t('cloudInfrastructure.taxTreatment')}
              disabled={disabled}
            >
              {['exclusive_ppn', 'inclusive_ppn', 'not_stated'].map((tax) => (
                <MenuItem key={tax} value={tax}>
                  {t(`cloudInfrastructure.tax.${tax}`)}
                </MenuItem>
              ))}
            </CloudFormField>
            <Controller
              control={control}
              name="cloud_infrastructure.limitation_codes"
              render={({ field, fieldState }) => (
                <Stack component="fieldset" sx={{ border: 0, p: 0, minWidth: 0 }}>
                  <Typography component="legend">
                    {t('cloudInfrastructure.limitation.codes')}
                  </Typography>
                  {CLOUD_LIMITATION_CODES.map((code, index) => (
                    <FormControlLabel
                      key={code}
                      sx={{ minHeight: 44 }}
                      label={t(`cloudInfrastructure.limitation.${code}`)}
                      control={
                        <Checkbox
                          inputRef={index === 0 ? field.ref : undefined}
                          disabled={disabled}
                          checked={field.value.includes(code)}
                          onBlur={field.onBlur}
                          onChange={(_, checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, code]
                                : field.value.filter((value) => value !== code)
                            )
                          }
                        />
                      }
                    />
                  ))}
                  {fieldState.error && (
                    <Typography color="error">
                      {t('cloudInfrastructure.validation.invalidField')}
                    </Typography>
                  )}
                </Stack>
              )}
            />
            <CloudTextList
              control={control}
              name="cloud_infrastructure.additional_limitations"
              label={t('cloudInfrastructure.limitation.additional')}
              addLabel={t('cloudInfrastructure.actions.addLimitation')}
              removeLabel={t('cloudInfrastructure.actions.remove')}
              disabled={disabled}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
