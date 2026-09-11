import type { FieldPath } from 'react-hook-form';
import type { TextFieldProps } from '@mui/material/TextField';
import type { CloudInfrastructureFormValues } from './cloud-infrastructure-form-model';

import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';

import { useTranslate } from 'src/locales';

export function CloudFormField({
  name,
  type,
  ...props
}: TextFieldProps & { name: FieldPath<CloudInfrastructureFormValues> }) {
  const { control } = useFormContext<CloudInfrastructureFormValues>();
  const { t } = useTranslate('quotation');
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          inputRef={field.ref}
          id={name}
          value={
            typeof field.value === 'number' && Number.isNaN(field.value) ? '' : (field.value ?? '')
          }
          type={type}
          fullWidth
          onChange={(event) =>
            field.onChange(
              type === 'number'
                ? event.target.value === ''
                  ? NaN
                  : Number(event.target.value)
                : event.target.value
            )
          }
          error={Boolean(fieldState.error)}
          helperText={
            fieldState.error ? t('cloudInfrastructure.validation.invalidField') : props.helperText
          }
          {...props}
        />
      )}
    />
  );
}
