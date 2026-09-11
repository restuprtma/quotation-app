import type { Control, UseFormRegister } from 'react-hook-form';
import type { CloudInfrastructureFormValues } from './cloud-infrastructure-form-model';

import { useRef, useState } from 'react';
import { useController, useFieldArray } from 'react-hook-form';

import { Card, Stack, Button, TextField, CardHeader, Typography, CardContent } from '@mui/material';

import { useTranslate } from 'src/locales';

import { CloudFormField } from './cloud-form-field';

type Props = {
  control: Control<CloudInfrastructureFormValues>;
  register: UseFormRegister<CloudInfrastructureFormValues>;
  disabled?: boolean;
};
type TextListName =
  | 'cloud_infrastructure.additional_limitations'
  | `cloud_infrastructure.scope_rows.${number}.sections.${number}.activities`;

// Primitive string arrays use a controller: useFieldArray only supports objects.
// Separate UI identities preserve focus when a preceding activity is removed.
export function CloudTextList({
  control,
  name,
  label,
  addLabel,
  removeLabel,
  disabled,
}: {
  control: Control<CloudInfrastructureFormValues>;
  name: TextListName;
  label: string;
  addLabel: string;
  removeLabel: string;
  disabled?: boolean;
}) {
  const { field, fieldState } = useController({ control, name });
  const nextId = useRef(field.value.length);
  const [keys, setKeys] = useState(() => field.value.map((_, index) => index));
  const { t } = useTranslate('quotation');
  return (
    <Stack spacing={1}>
      {field.value.map((value, index) => (
        <Stack key={keys[index]} direction="row" spacing={1} alignItems="start">
          <TextField
            id={`${name}.${index}`}
            name={`${name}.${index}`}
            inputRef={index === 0 ? field.ref : undefined}
            fullWidth
            multiline
            label={`${label} ${index + 1}`}
            value={value}
            disabled={disabled}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(
                field.value.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item
                )
              )
            }
            error={Boolean(fieldState.error) && (!value.trim() || /[<>]/.test(value))}
          />
          <Button
            aria-label={`${removeLabel} ${index + 1}`}
            disabled={disabled}
            sx={{ minWidth: 44, minHeight: 44 }}
            onClick={() => {
              setKeys((current) => current.filter((_, itemIndex) => itemIndex !== index));
              field.onChange(field.value.filter((_, itemIndex) => itemIndex !== index));
            }}
          >
            {removeLabel}
          </Button>
        </Stack>
      ))}
      {fieldState.error && (
        <Typography color="error" variant="caption">
          {t('cloudInfrastructure.validation.invalidField')}
        </Typography>
      )}
      <Button
        disabled={disabled || field.value.length >= 30}
        sx={{ minHeight: 44 }}
        onClick={() => {
          setKeys((current) => [...current, nextId.current++]);
          field.onChange([...field.value, '']);
        }}
      >
        {addLabel}
      </Button>
    </Stack>
  );
}

function ScopeRow({ control, rowIndex, disabled }: Omit<Props, 'register'> & { rowIndex: number }) {
  const { t } = useTranslate('quotation');
  const sections = useFieldArray({
    control,
    name: `cloud_infrastructure.scope_rows.${rowIndex}.sections`,
  });
  return (
    <Stack spacing={2}>
      {sections.fields.map((section, sectionIndex) => (
        <Stack
          component="fieldset"
          key={section.id}
          spacing={2}
          sx={{ border: 1, borderColor: 'divider', p: 2, minWidth: 0 }}
        >
          <Typography component="legend">
            {t('cloudInfrastructure.scope.sectionTitle')} {sectionIndex + 1}
          </Typography>
          <CloudFormField
            name={`cloud_infrastructure.scope_rows.${rowIndex}.sections.${sectionIndex}.title`}
            label={t('cloudInfrastructure.scope.sectionTitle')}
            disabled={disabled}
          />
          <CloudTextList
            control={control}
            name={`cloud_infrastructure.scope_rows.${rowIndex}.sections.${sectionIndex}.activities`}
            label={t('cloudInfrastructure.scope.activity')}
            addLabel={t('cloudInfrastructure.actions.addActivity')}
            removeLabel={t('cloudInfrastructure.actions.removeActivity')}
            disabled={disabled}
          />
          <Button
            disabled={disabled}
            sx={{ minHeight: 44 }}
            onClick={() => sections.remove(sectionIndex)}
          >
            {t('cloudInfrastructure.actions.removeSection')} {sectionIndex + 1}
          </Button>
        </Stack>
      ))}
      <Button
        disabled={disabled || sections.fields.length >= 10}
        sx={{ minHeight: 44 }}
        onClick={() => sections.append({ title: '', activities: [''] })}
      >
        {t('cloudInfrastructure.actions.addSection')}
      </Button>
      <CloudFormField
        name={`cloud_infrastructure.scope_rows.${rowIndex}.timeline`}
        label={t('cloudInfrastructure.timeline')}
        disabled={disabled}
      />
    </Stack>
  );
}

export function CloudScopeEditor({ control, disabled }: Props) {
  const { t } = useTranslate('quotation');
  const rows = useFieldArray({ control, name: 'cloud_infrastructure.scope_rows' });
  return (
    <Card>
      <CardHeader
        title={t('cloudInfrastructure.scope.title')}
        subheader={t('cloudInfrastructure.scope.helper')}
      />
      <CardContent>
        <Stack spacing={2}>
          {rows.fields.map((row, index) => (
            <Stack
              component="fieldset"
              key={row.id}
              spacing={2}
              sx={{ border: 1, borderColor: 'divider', p: 2, minWidth: 0 }}
            >
              <Typography component="legend">
                {t('cloudInfrastructure.scope.title')} {index + 1}
              </Typography>
              <ScopeRow control={control} rowIndex={index} disabled={disabled} />
              <Button disabled={disabled} sx={{ minHeight: 44 }} onClick={() => rows.remove(index)}>
                {t('cloudInfrastructure.actions.removeScope')} {index + 1}
              </Button>
            </Stack>
          ))}
          <Button
            disabled={disabled || rows.fields.length >= 30}
            sx={{ minHeight: 44 }}
            onClick={() =>
              rows.append({ sections: [{ title: '', activities: [''] }], timeline: '' })
            }
          >
            {t('cloudInfrastructure.actions.addScope')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
