import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { CloudInfrastructureFormValues } from './cloud-infrastructure-form-model';
import type { RateCardDetailResponse, RateCardSummaryResponse } from '../../rate-cards/types';

import { useFieldArray } from 'react-hook-form';

import {
  Card,
  Grid,
  Stack,
  Button,
  MenuItem,
  TextField,
  CardHeader,
  Typography,
  CardContent,
} from '@mui/material';

import { useTranslate } from 'src/locales';

import { CloudFormField } from './cloud-form-field';
import { copyInfrastructurePackage } from '../constants/cloud-infrastructure';

type Props = {
  control: Control<CloudInfrastructureFormValues>;
  register: UseFormRegister<CloudInfrastructureFormValues>;
  errors: FieldErrors<CloudInfrastructureFormValues>;
  rateCards?: Pick<RateCardSummaryResponse, 'id' | 'name'>[];
  selectedRateCard?: RateCardDetailResponse | null;
  onSelectRateCard?: (id: string) => void;
  onLoadRateCard?: () => void;
  disabled?: boolean;
};

export function CloudPackageEditor({
  control,
  rateCards = [],
  selectedRateCard,
  onSelectRateCard,
  onLoadRateCard,
  disabled,
}: Props) {
  const { t } = useTranslate('quotation');
  const packages = useFieldArray({ control, name: 'cloud_infrastructure.package_items' });
  const setup = useFieldArray({ control, name: 'cloud_infrastructure.setup_items' });
  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title={t('cloudInfrastructure.packageCatalog.title')}
          subheader={t('cloudInfrastructure.packageCatalog.helper')}
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                select
                fullWidth
                label={t('cloudInfrastructure.packageCatalog.rateCard')}
                defaultValue=""
                disabled={disabled}
                onChange={(event) => onSelectRateCard?.(event.target.value)}
              >
                <MenuItem value="">{t('cloudInfrastructure.packageCatalog.choose')}</MenuItem>
                {rateCards.map((card) => (
                  <MenuItem key={card.id} value={card.id}>
                    {card.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                sx={{ minWidth: 100, minHeight: 44 }}
                onClick={onLoadRateCard}
                disabled={disabled || !selectedRateCard}
              >
                {t('cloudInfrastructure.packageCatalog.load')}
              </Button>
            </Stack>
            {(selectedRateCard?.infra_packages ?? []).map((pkg) => (
              <Button
                key={pkg.id}
                variant="outlined"
                sx={{ minHeight: 44 }}
                onClick={() => packages.append(copyInfrastructurePackage(pkg))}
                disabled={disabled || packages.fields.length >= 100}
              >
                {pkg.package_name} · {pkg.vcpu} vCPU / {pkg.ram_gb} GB / {pkg.storage_gb} GB · Rp
                {pkg.amount_per_month.toLocaleString('id-ID')}
              </Button>
            ))}
            <Typography variant="caption">
              {t('cloudInfrastructure.packageCatalog.copyOnly')}
            </Typography>
            {packages.fields.map((field, index) => (
              <Grid
                container
                spacing={2}
                key={field.id}
                component="fieldset"
                sx={{ border: 1, borderColor: 'divider', p: 2, minWidth: 0 }}
              >
                <Typography component="legend">
                  {t('cloudInfrastructure.packageName')} {index + 1}
                </Typography>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CloudFormField
                    select
                    name={`cloud_infrastructure.package_items.${index}.category`}
                    label={t('cloudInfrastructure.category')}
                    disabled={disabled}
                  >
                    {['shared_hosting', 'vps_cloud'].map((category) => (
                      <MenuItem key={category} value={category}>
                        {t(`cloudInfrastructure.categories.${category}`)}
                      </MenuItem>
                    ))}
                  </CloudFormField>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <CloudFormField
                    name={`cloud_infrastructure.package_items.${index}.name`}
                    label={t('cloudInfrastructure.packageName')}
                    disabled={disabled}
                  />
                </Grid>
                {(['vcpu', 'ram_gb', 'storage_gb', 'unit_rate'] as const).map((name) => (
                  <Grid key={name} size={{ xs: 6, sm: 3 }}>
                    <CloudFormField
                      name={`cloud_infrastructure.package_items.${index}.${name}`}
                      type="number"
                      label={t(`cloudInfrastructure.${name}`)}
                      disabled={disabled}
                    />
                  </Grid>
                ))}
                <Button
                  aria-label={`${t('cloudInfrastructure.accessibility.removePackage')} ${index + 1}`}
                  sx={{ minWidth: 44, minHeight: 44 }}
                  onClick={() => packages.remove(index)}
                  disabled={disabled}
                >
                  {t('cloudInfrastructure.actions.remove')}
                </Button>
              </Grid>
            ))}
            <Button
              variant="outlined"
              sx={{ minHeight: 44 }}
              onClick={() =>
                packages.append({
                  category: 'vps_cloud',
                  name: '',
                  vcpu: 1,
                  ram_gb: 1,
                  storage_gb: 1,
                  unit_rate: 1,
                })
              }
              disabled={disabled || packages.fields.length >= 100}
            >
              {t('cloudInfrastructure.actions.addPackage')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={t('cloudInfrastructure.setupFee.title')} />
        <CardContent>
          <Stack spacing={2}>
            {setup.fields.map((field, index) => (
              <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <CloudFormField
                  name={`cloud_infrastructure.setup_items.${index}.name`}
                  label={t('cloudInfrastructure.setupFee.name')}
                  disabled={disabled}
                />
                <CloudFormField
                  name={`cloud_infrastructure.setup_items.${index}.amount`}
                  type="number"
                  label={t('cloudInfrastructure.setupFee.amount')}
                  disabled={disabled}
                />
                <Button
                  sx={{ minWidth: 44, minHeight: 44 }}
                  onClick={() => setup.remove(index)}
                  disabled={disabled}
                >
                  {t('cloudInfrastructure.actions.remove')} {index + 1}
                </Button>
              </Stack>
            ))}
            <Button
              sx={{ minHeight: 44 }}
              onClick={() => setup.append({ name: '', amount: 1 })}
              disabled={disabled || setup.fields.length >= 30}
            >
              {t('cloudInfrastructure.actions.addSetup')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
