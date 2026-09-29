import type {
  ValueSource,
  PromptTeamLine,
  CatalogRoleOption,
  PromptCalculation,
  PromptPatchOperation,
  PromptQuotationState,
  PromptWhiteLabelServiceInput,
  PromptKioskQueueServiceInput,
  PromptSubscriptionSaaSServiceInput,
  PromptCustomDevelopmentServiceInput,
  PromptTalentOutsourcingServiceInput,
  PromptCloudInfrastructureServiceInput,
  PromptStandaloneMaintenanceServiceInput,
} from '../types/prompt-first';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { PromptIssueList } from './prompt-issue-list';

export type PromptWorkspaceCopy = {
  title: string;
  open: string;
  close: string;
  facts: string;
  issues: string;
  blocking: string;
  warning: string;
  duration: string;
  team: string;
  role: string;
  seniority: string;
  headcount: string;
  payment: string;
  discount: string;
  initialTotal: string;
  discountedTotal: string;
  priceUnavailable: string;
  subscriptionDetails: string;
  subscriptionProduct: string;
  subscriptionTerm: string;
  subscriptionBilling: string;
  subscriptionFeatures: string;
  totalContract: string;
  whiteLabelDetails: string;
  whiteLabelProduct: string;
  whiteLabelLicenses: string;
  whiteLabelMaintenance: string;
  whiteLabelHosting: string;
  whiteLabelRights: string;
  maintenanceDetails: string;
  maintenanceSystem: string;
  maintenanceMode: string;
  maintenanceRetainerItems: string;
  maintenanceHourlyItems: string;
  maintenanceDefects: string;
  maintenanceTasks: string;
  maintenanceRights: string;
  customDevDetails?: string;
  customDevSystem?: string;
  customDevTableMode?: string;
  customDevCostGroups?: string;
  customDevMonthlyItems?: string;
  customDevScopeModules?: string;
  customDevTimeline?: string;
  customDevRights?: string;
  kioskQueueDetails?: string;
  kioskQueueSystem?: string;
  kioskQueueVariant?: string;
  kioskQueueHardware?: string;
  kioskQueueTax?: string;
  kioskQueueServiceGroups?: string;
  kioskQueueHardwareItems?: string;
  kioskQueueMaintenanceItems?: string;
  kioskQueueTimeline?: string;
  kioskQueueRights?: string;
  talentDetails?: string;
  talentEngagementMode?: string;
  talentCostGroups?: string;
  talentPreparation?: string;
  talentSquad?: string;
  talentPayment?: string;
  cloudDetails?: string;
  cloudPackages?: string;
  cloudSetup?: string;
  cloudScope?: string;
  cloudPayment?: string;
  totalInvestment: string;
  reload: string;
  compare: string;
};

type Props = {
  state: PromptQuotationState;
  calculation?: PromptCalculation;
  catalogRoles: CatalogRoleOption[];
  pending: boolean;
  copy: PromptWorkspaceCopy;
  onPatch: (operations: PromptPatchOperation[]) => void;
  conflict?: boolean;
  onReload?: () => void;
  onCompare?: () => void;
};

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

function SourceChip({ source }: { source: ValueSource }) {
  return (
    <Chip size="small" variant="outlined" label={source} sx={{ textTransform: 'capitalize' }} />
  );
}

function subscriptionSaaSServiceInput(
  state: PromptQuotationState
): PromptSubscriptionSaaSServiceInput | undefined {
  const input = state.service_input;
  if (state.commercial_scheme?.value !== 'subscription_saas' || !input || typeof input !== 'object')
    return undefined;
  const candidate = input as Partial<PromptSubscriptionSaaSServiceInput>;
  if (
    candidate.kind !== 'subscription_saas_v1' ||
    !candidate.product_name ||
    !candidate.initial_term_months ||
    !candidate.billing_cycle
  )
    return undefined;
  return candidate as PromptSubscriptionSaaSServiceInput;
}

function whiteLabelServiceInput(
  state: PromptQuotationState
): PromptWhiteLabelServiceInput | undefined {
  const input = state.service_input;
  if (state.commercial_scheme?.value !== 'white_label' || !input || typeof input !== 'object')
    return undefined;
  const candidate = input as Partial<PromptWhiteLabelServiceInput>;
  if (candidate.kind !== 'white_label_v1' || !candidate.product_name || !candidate.license_items)
    return undefined;
  return candidate as PromptWhiteLabelServiceInput;
}

function standaloneMaintenanceServiceInput(
  state: PromptQuotationState
): PromptStandaloneMaintenanceServiceInput | undefined {
  const input = state.service_input;
  if (
    state.commercial_scheme?.value !== 'standalone_maintenance' ||
    !input ||
    typeof input !== 'object'
  )
    return undefined;
  const candidate = input as Partial<PromptStandaloneMaintenanceServiceInput>;
  if (candidate.kind !== 'standalone_maintenance_v1' || !candidate.system_name || !candidate.mode)
    return undefined;
  return candidate as PromptStandaloneMaintenanceServiceInput;
}

function customDevelopmentServiceInput(
  state: PromptQuotationState
): PromptCustomDevelopmentServiceInput | undefined {
  const input = state.service_input;
  if (
    state.commercial_scheme?.value !== 'custom_development' ||
    !input ||
    typeof input !== 'object'
  )
    return undefined;
  const candidate = input as Partial<PromptCustomDevelopmentServiceInput>;
  if (
    candidate.kind !== 'custom_development_v1' ||
    !candidate.system_name ||
    !candidate.development_table_mode
  )
    return undefined;
  return candidate as PromptCustomDevelopmentServiceInput;
}

function kioskQueueServiceInput(
  state: PromptQuotationState
): PromptKioskQueueServiceInput | undefined {
  const input = state.service_input;
  if (
    state.commercial_scheme?.value !== 'kiosk_queue_system' ||
    !input ||
    typeof input !== 'object'
  )
    return undefined;
  const candidate = input as Partial<PromptKioskQueueServiceInput>;
  if (candidate.kind !== 'kiosk_queue_system_v1' || !candidate.system_name || !candidate.variant)
    return undefined;
  return candidate as PromptKioskQueueServiceInput;
}

function talentOutsourcingServiceInput(
  state: PromptQuotationState
): PromptTalentOutsourcingServiceInput | undefined {
  const input = state.service_input;
  if (
    state.commercial_scheme?.value !== 'talent_outsourcing' ||
    !input ||
    typeof input !== 'object'
  )
    return undefined;
  const candidate = input as Partial<PromptTalentOutsourcingServiceInput>;
  if (candidate.kind !== 'talent_outsourcing_v1' || !candidate.engagement_mode) return undefined;
  return candidate as PromptTalentOutsourcingServiceInput;
}

function cloudInfrastructureServiceInput(
  state: PromptQuotationState
): PromptCloudInfrastructureServiceInput | undefined {
  const input = state.service_input;
  if (
    state.commercial_scheme?.value !== 'cloud_infrastructure' ||
    !input ||
    typeof input !== 'object'
  )
    return undefined;
  const candidate = input as Partial<PromptCloudInfrastructureServiceInput>;
  if (candidate.kind !== 'cloud_infrastructure_v1' || !candidate.package_items) return undefined;
  return candidate as PromptCloudInfrastructureServiceInput;
}

function TeamLine({
  team,
  line,
  index,
  catalogRoles,
  pending,
  copy,
  onPatch,
}: {
  team: PromptTeamLine[];
  line: PromptTeamLine;
  index: number;
  catalogRoles: CatalogRoleOption[];
  pending: boolean;
  copy: PromptWorkspaceCopy;
  onPatch: Props['onPatch'];
}) {
  const [seniority, setSeniority] = useState(line.seniority);
  const [headcount, setHeadcount] = useState(line.headcount_quarters / 4);

  useEffect(() => setSeniority(line.seniority), [line.seniority]);
  useEffect(() => setHeadcount(line.headcount_quarters / 4), [line.headcount_quarters]);

  const update = (change: Partial<PromptTeamLine>) => {
    const nextTeam = team.map((candidate, candidateIndex) =>
      candidateIndex === index
        ? { ...candidate, ...change, source: 'user' as const, evidence: '', confirmed: true }
        : candidate
    );
    onPatch([{ type: 'set_team', team: nextTeam }]);
  };
  const selected = catalogRoles.find(
    (option) => option.rate_item_id === line.resolved_rate_item_id
  );
  const roleValue = selected?.rate_item_id ?? line.resolved_rate_item_id ?? `unresolved-${index}`;

  return (
    <Stack spacing={1.25} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">
          {copy.team} {index + 1}
        </Typography>
        <SourceChip source={line.source} />
      </Stack>
      <TextField
        fullWidth
        select
        label={copy.role}
        value={roleValue}
        disabled={pending || !catalogRoles.length}
        helperText={!catalogRoles.length ? copy.priceUnavailable : undefined}
        onChange={(event) => {
          const option = catalogRoles.find(
            (candidate) => candidate.rate_item_id === event.target.value
          );
          if (!option) return;
          update({
            requested_role: option.role,
            resolved_rate_item_id: option.rate_item_id,
            seniority: option.seniority,
          });
        }}
      >
        {!selected && (
          <MenuItem value={roleValue} disabled>
            {line.requested_role}
          </MenuItem>
        )}
        {catalogRoles.map((option) => (
          <MenuItem key={option.rate_item_id} value={option.rate_item_id}>
            {option.display_name}
          </MenuItem>
        ))}
      </TextField>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 1.25,
        }}
      >
        <TextField
          fullWidth
          label={copy.seniority}
          value={seniority}
          disabled={pending}
          onBlur={() => update({ seniority: seniority.trim() || line.seniority })}
          onChange={(event) => setSeniority(event.target.value)}
        />
        <TextField
          fullWidth
          type="number"
          label={copy.headcount}
          value={headcount}
          disabled={pending}
          inputProps={{ min: 0.25, step: 0.25 }}
          onBlur={() => {
            const value = Number(headcount);
            if (Number.isFinite(value) && value > 0)
              update({ headcount_quarters: Math.round(value * 4) });
          }}
          onChange={(event) => setHeadcount(Number(event.target.value))}
        />
      </Box>
    </Stack>
  );
}

function WorkspaceContents({
  state,
  calculation,
  catalogRoles,
  pending,
  copy,
  onPatch,
  conflict,
  onReload,
  onCompare,
}: Props) {
  const [duration, setDuration] = useState(state.duration_months?.value?.toString() ?? '');
  const [paymentPattern, setPaymentPattern] = useState(state.payment_pattern?.value ?? '');
  const [discount, setDiscount] = useState(((state.additional_discount_bps ?? 0) / 100).toString());

  useEffect(
    () => setDuration(state.duration_months?.value?.toString() ?? ''),
    [state.duration_months?.value]
  );
  useEffect(
    () => setPaymentPattern(state.payment_pattern?.value ?? ''),
    [state.payment_pattern?.value]
  );
  useEffect(
    () => setDiscount(((state.additional_discount_bps ?? 0) / 100).toString()),
    [state.additional_discount_bps]
  );

  const hasBlockingIssue = state.issues.some((issue) => issue.severity === 'blocking');
  const subscription = subscriptionSaaSServiceInput(state);
  const whiteLabel = whiteLabelServiceInput(state);
  const maintenance = standaloneMaintenanceServiceInput(state);
  const customDev = customDevelopmentServiceInput(state);
  const kioskQueue = kioskQueueServiceInput(state);
  const talent = talentOutsourcingServiceInput(state);
  const cloud = cloudInfrastructureServiceInput(state);
  const specialized =
    subscription || whiteLabel || maintenance || customDev || kioskQueue || talent || cloud;
  const initial = subscription
    ? calculation?.total_contract
    : whiteLabel || maintenance || customDev || kioskQueue || talent || cloud
      ? calculation?.total_investment
      : calculation?.total_before_discount;
  const discounted = calculation?.total_investment;

  return (
    <Stack spacing={2} sx={{ p: 2.5, minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="h6">{copy.title}</Typography>
        <Chip size="small" label={state.readiness} color={hasBlockingIssue ? 'error' : 'info'} />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">{copy.facts}</Typography>
        {[state.client_name, state.client_company, state.project_name, state.payment_pattern]
          .filter(Boolean)
          .map((fact, index) => (
            <Stack
              key={`${fact!.value}-${index}`}
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2">{fact!.value}</Typography>
              <SourceChip source={fact!.source} />
            </Stack>
          ))}
      </Stack>

      <Divider />
      <Stack spacing={1}>
        <Typography variant="subtitle2">{copy.issues}</Typography>
        <PromptIssueList
          issues={state.issues}
          blockingLabel={copy.blocking}
          warningLabel={copy.warning}
        />
      </Stack>

      <Divider />
      {subscription ? (
        <Stack spacing={1.25} aria-label={copy.subscriptionDetails}>
          <Typography variant="subtitle2">{copy.subscriptionDetails}</Typography>
          <TextField
            fullWidth
            label={copy.subscriptionProduct}
            value={subscription.product_name.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={subscription.product_name.source} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 1.25,
            }}
          >
            <TextField
              fullWidth
              label={copy.subscriptionTerm}
              value={subscription.initial_term_months.value}
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              fullWidth
              label={copy.subscriptionBilling}
              value={subscription.billing_cycle.value}
              slotProps={{ input: { readOnly: true } }}
            />
          </Box>
          {subscription.feature_groups?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.subscriptionFeatures}
              </Typography>
              {subscription.feature_groups
                .flatMap((group) => group.features)
                .map((feature, index) => (
                  <Stack
                    key={`${feature.value}-${index}`}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography variant="body2">{feature.value}</Typography>
                    <SourceChip source={feature.source} />
                  </Stack>
                ))}
            </Stack>
          ) : null}
        </Stack>
      ) : whiteLabel ? (
        <Stack spacing={1.25} aria-label={copy.whiteLabelDetails}>
          <Typography variant="subtitle2">{copy.whiteLabelDetails}</Typography>
          <TextField
            fullWidth
            label={copy.whiteLabelProduct}
            value={whiteLabel.product_name.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={whiteLabel.product_name.source} />
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {copy.whiteLabelLicenses}
            </Typography>
            {whiteLabel.license_items.map((license, index) => (
              <Stack
                key={`${license.name.value}-${index}`}
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <Typography variant="body2">{license.name.value}</Typography>
                <SourceChip source={license.name.source} />
              </Stack>
            ))}
          </Stack>
          {whiteLabel.maintenance_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.whiteLabelMaintenance}
              </Typography>
              {whiteLabel.maintenance_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{item.name.value}</Typography>
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
          {whiteLabel.hosting_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.whiteLabelHosting}
              </Typography>
              {whiteLabel.hosting_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{item.name.value}</Typography>
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
          {whiteLabel.rights_statements?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.whiteLabelRights}
              </Typography>
              {whiteLabel.rights_statements.map((statement, index) => (
                <Stack
                  key={`${statement.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{statement.value}</Typography>
                  <SourceChip source={statement.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : maintenance ? (
        <Stack spacing={1.25} aria-label={copy.maintenanceDetails}>
          <Typography variant="subtitle2">{copy.maintenanceDetails}</Typography>
          <TextField
            fullWidth
            label={copy.maintenanceSystem}
            value={maintenance.system_name.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={maintenance.system_name.source} />
          <TextField
            fullWidth
            label={copy.maintenanceMode}
            value={maintenance.mode.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={maintenance.mode.source} />

          {maintenance.mode.value === 'retainer' ? (
            <>
              {maintenance.retainer_items?.length ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {copy.maintenanceRetainerItems}
                  </Typography>
                  {maintenance.retainer_items.map((item, index) => (
                    <Stack
                      key={`${item.name.value}-${index}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography variant="body2">
                        {item.name.value} ({item.period_months.value} bln,{' '}
                        {item.fte_quarters.value / 4} FTE)
                      </Typography>
                      <SourceChip source={item.name.source} />
                    </Stack>
                  ))}
                </Stack>
              ) : null}
              {maintenance.defect_groups?.length ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {copy.maintenanceDefects}
                  </Typography>
                  {maintenance.defect_groups
                    .flatMap((group) => group.items)
                    .map((item, index) => (
                      <Stack
                        key={`${item.item_number.value}-${index}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Typography variant="body2">
                          {item.item_number.value} [{item.priority.value}] {item.function.value}
                        </Typography>
                        <SourceChip source={item.function.source} />
                      </Stack>
                    ))}
                </Stack>
              ) : null}
            </>
          ) : (
            <>
              {maintenance.hourly_cost_items?.length ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {copy.maintenanceHourlyItems}
                  </Typography>
                  {maintenance.hourly_cost_items.map((item, index) => (
                    <Stack
                      key={`${item.name.value}-${index}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography variant="body2">
                        {item.name.value} ({item.hours_half_units.value / 2} jam)
                      </Typography>
                      <SourceChip source={item.name.source} />
                    </Stack>
                  ))}
                </Stack>
              ) : null}
              {maintenance.hourly_tasks?.length ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {copy.maintenanceTasks}
                  </Typography>
                  {maintenance.hourly_tasks.map((task, index) => (
                    <Stack
                      key={`${task.description.value}-${index}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography variant="body2">
                        {task.description.value} ({task.platform.value},{' '}
                        {task.hours_half_units.value / 2} jam)
                      </Typography>
                      <SourceChip source={task.description.source} />
                    </Stack>
                  ))}
                </Stack>
              ) : null}
            </>
          )}

          {maintenance.rights_statements?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.maintenanceRights}
              </Typography>
              {maintenance.rights_statements.map((statement, index) => (
                <Stack
                  key={`${statement.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{statement.value}</Typography>
                  <SourceChip source={statement.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : customDev ? (
        <Stack spacing={1.25} aria-label={copy.customDevDetails ?? 'Custom development details'}>
          <Typography variant="subtitle2">
            {copy.customDevDetails ?? 'Custom development details'}
          </Typography>
          <TextField
            fullWidth
            label={copy.customDevSystem ?? 'System name'}
            value={customDev.system_name.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={customDev.system_name.source} />
          <TextField
            fullWidth
            label={copy.customDevTableMode ?? 'Table mode'}
            value={customDev.development_table_mode.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={customDev.development_table_mode.source} />

          {customDev.development_groups?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.customDevCostGroups ?? 'Cost groups'}
              </Typography>
              {customDev.development_groups.map((group, gIdx) => (
                <Stack key={`${group.title.value}-${gIdx}`} spacing={0.5} sx={{ pl: 1 }}>
                  <Typography variant="caption" fontWeight="bold">
                    {group.title.value}
                  </Typography>
                  {group.items.map((item, iIdx) => (
                    <Stack
                      key={`${item.name.value}-${iIdx}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography variant="body2">
                        {item.name.value} ({item.period_label.value}, {item.headcount.value} SDM)
                        {item.pricing_status === 'included' ? ' - Termasuk dalam biaya' : ''}
                      </Typography>
                      <SourceChip source={item.name.source} />
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Stack>
          ) : null}

          {customDev.monthly_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.customDevMonthlyItems ?? 'Monthly items'}
              </Typography>
              {customDev.monthly_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {item.name.value} ({item.quantity.value}x)
                  </Typography>
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {customDev.module_groups?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.customDevScopeModules ?? 'Scope modules'}
              </Typography>
              {customDev.module_groups.map((group, index) => (
                <Stack
                  key={`${group.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {group.name.value} ({group.features.length} fitur)
                  </Typography>
                  <SourceChip source={group.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {customDev.timeline_rows?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.customDevTimeline ?? 'Timeline'}
              </Typography>
              {customDev.timeline_rows.map((row, index) => (
                <Stack
                  key={`${row.description.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {row.description.value}: {row.timeline.value}
                  </Typography>
                  <SourceChip source={row.description.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {customDev.rights_statements?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.customDevRights ?? 'Rights and scope'}
              </Typography>
              {customDev.rights_statements.map((statement, index) => (
                <Stack
                  key={`${statement.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{statement.value}</Typography>
                  <SourceChip source={statement.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : kioskQueue ? (
        <Stack spacing={1.25} aria-label={copy.kioskQueueDetails ?? 'Kiosk & queue details'}>
          <Typography variant="subtitle2">
            {copy.kioskQueueDetails ?? 'Kiosk & queue details'}
          </Typography>
          <TextField
            fullWidth
            label={copy.kioskQueueSystem ?? 'System name'}
            value={kioskQueue.system_name.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={kioskQueue.system_name.source} />
          <TextField
            fullWidth
            label={copy.kioskQueueVariant ?? 'Variant'}
            value={kioskQueue.variant.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={kioskQueue.variant.source} />
          <TextField
            fullWidth
            label={copy.kioskQueueHardware ?? 'Hardware provision'}
            value={kioskQueue.hardware_provision.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={kioskQueue.hardware_provision.source} />

          {kioskQueue.service_groups?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.kioskQueueServiceGroups ?? 'Service groups'}
              </Typography>
              {kioskQueue.service_groups.map((group, gIdx) => (
                <Stack key={`${group.title.value}-${gIdx}`} spacing={0.5} sx={{ pl: 1 }}>
                  <Typography variant="caption" fontWeight="bold">
                    {group.title.value}
                  </Typography>
                  {group.items.map((item, iIdx) => (
                    <Stack
                      key={`${item.name.value}-${iIdx}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography variant="body2">
                        {item.name.value} ({item.period_quarters.value / 4} bln,{' '}
                        {item.headcount.value} SDM)
                      </Typography>
                      <SourceChip source={item.name.source} />
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Stack>
          ) : null}

          {kioskQueue.hardware_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.kioskQueueHardwareItems ?? 'Hardware items'}
              </Typography>
              {kioskQueue.hardware_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {item.name.value} ({item.quantity.value}x)
                  </Typography>
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {kioskQueue.maintenance_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.kioskQueueMaintenanceItems ?? 'Maintenance items'}
              </Typography>
              {kioskQueue.maintenance_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {item.name.value} ({item.period_quarters.value / 4} bln, {item.headcount.value}{' '}
                    SDM)
                  </Typography>
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {kioskQueue.private_timeline_rows?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.kioskQueueTimeline ?? 'Timeline'}
              </Typography>
              {kioskQueue.private_timeline_rows.map((row, index) => (
                <Stack
                  key={`${row.description.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {row.description.value}: {row.timeline.value}
                  </Typography>
                  <SourceChip source={row.description.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {kioskQueue.rights_statements?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.kioskQueueRights ?? 'Rights and scope'}
              </Typography>
              {kioskQueue.rights_statements.map((statement, index) => (
                <Stack
                  key={`${statement.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{statement.value}</Typography>
                  <SourceChip source={statement.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : talent ? (
        <Stack spacing={1.25} aria-label={copy.talentDetails ?? 'Talent outsourcing details'}>
          <Typography variant="subtitle2">
            {copy.talentDetails ?? 'Talent outsourcing details'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              size="small"
              color="primary"
              label={
                talent.engagement_mode.value === 'manpower_supply'
                  ? 'Manpower Supply'
                  : 'Managed Squad'
              }
            />
            <SourceChip source={talent.engagement_mode.source} />
          </Stack>
          <TextField
            fullWidth
            label="Tax Treatment"
            value={talent.tax_treatment.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={talent.tax_treatment.source} />

          {talent.engagement_mode.value === 'manpower_supply' && talent.cost_groups?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.talentCostGroups ?? 'Cost groups'}
              </Typography>
              {talent.cost_groups.map((group, gIdx) => (
                <Stack key={`${group.title.value}-${gIdx}`} spacing={0.5} sx={{ pl: 1 }}>
                  <Typography variant="caption" fontWeight="bold">
                    {group.title.value}
                  </Typography>
                  {group.items.map((item, iIdx) => (
                    <Stack
                      key={`${item.name.value}-${iIdx}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography variant="body2">
                        {item.name.value} ({item.quantity.value} {item.quantity_unit.value},{' '}
                        {item.period_count.value} {item.period_unit})
                      </Typography>
                      {item.unit_rate.amount === undefined && (
                        <Typography variant="caption" color="error">
                          (Harga diperlukan)
                        </Typography>
                      )}
                      <SourceChip source={item.name.source} />
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Stack>
          ) : null}

          {talent.engagement_mode.value === 'managed_squad' && talent.preparation_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.talentPreparation ?? 'Preparation'}
              </Typography>
              {talent.preparation_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {item.name.value} ({item.headcount.value} SDM)
                  </Typography>
                  {item.quoted_line_total.amount === undefined && (
                    <Typography variant="caption" color="error">
                      (Harga diperlukan)
                    </Typography>
                  )}
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {talent.engagement_mode.value === 'managed_squad' && talent.squad_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.talentSquad ?? 'Squad items'}
              </Typography>
              {talent.squad_items.map((item, index) => (
                <Stack
                  key={`${item.role.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {item.role.value} ({item.period_months.value} bln, {item.headcount.value} SDM)
                  </Typography>
                  {item.monthly_rate.amount === undefined && (
                    <Typography variant="caption" color="error">
                      (Harga diperlukan)
                    </Typography>
                  )}
                  <SourceChip source={item.role.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {talent.payment_schedule?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.talentPayment ?? 'Payment schedule'}
              </Typography>
              {talent.payment_schedule.map((row, index) => (
                <Stack
                  key={`${row.work_period.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {row.work_period.value}: {row.terms.value}
                  </Typography>
                  {row.nominal.amount === undefined && (
                    <Typography variant="caption" color="error">
                      (Harga diperlukan)
                    </Typography>
                  )}
                  <SourceChip source={row.work_period.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {talent.rights_statements?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Rights and warranty
              </Typography>
              {talent.rights_statements.map((statement, index) => (
                <Stack
                  key={`${statement.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{statement.value}</Typography>
                  <SourceChip source={statement.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : cloud ? (
        <Stack spacing={1.25} aria-label={copy.cloudDetails ?? 'Cloud infrastructure details'}>
          <Typography variant="subtitle2">
            {copy.cloudDetails ?? 'Cloud infrastructure details'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            {cloud.package_items[0]?.category?.value ? (
              <Chip
                size="small"
                color="primary"
                label={cloud.package_items[0].category.value.toUpperCase()}
              />
            ) : null}
            {cloud.service_name?.value ? (
              <Chip size="small" variant="outlined" label={cloud.service_name.value} />
            ) : null}
            {cloud.package_items[0]?.category?.source ? (
              <SourceChip source={cloud.package_items[0].category.source} />
            ) : null}
          </Stack>
          <TextField
            fullWidth
            label="Tax Treatment"
            value={cloud.tax_treatment.value}
            slotProps={{ input: { readOnly: true } }}
          />
          <SourceChip source={cloud.tax_treatment.source} />

          {cloud.package_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.cloudPackages ?? 'Package items'}
              </Typography>
              {cloud.package_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography variant="body2">
                    {item.name.value} ({item.vcpu.value} vCPU, {item.ram_gb.value} GB RAM,{' '}
                    {item.storage_gb.value} GB)
                  </Typography>
                  {item.unit_rate.amount === undefined && (
                    <Typography variant="caption" color="error">
                      (Harga diperlukan)
                    </Typography>
                  )}
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {cloud.setup_items?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.cloudSetup ?? 'Setup items'}
              </Typography>
              {cloud.setup_items.map((item, index) => (
                <Stack
                  key={`${item.name.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{item.name.value}</Typography>
                  {item.amount.amount === undefined && (
                    <Typography variant="caption" color="error">
                      (Harga diperlukan)
                    </Typography>
                  )}
                  <SourceChip source={item.name.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {cloud.scope_rows?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.cloudScope ?? 'Scope of work'}
              </Typography>
              {cloud.scope_rows.map((row, rIdx) => (
                <Stack key={`scope-row-${rIdx}`} spacing={0.5} sx={{ pl: 1 }}>
                  {row.timeline?.value && (
                    <Typography variant="caption" fontWeight="bold">
                      Timeline: {row.timeline.value}
                    </Typography>
                  )}
                  {row.sections.map((section, sIdx) => (
                    <Stack key={`${section.title.value}-${sIdx}`} spacing={0.25} sx={{ pl: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {section.title.value}
                      </Typography>
                      {section.activities.map((act, aIdx) => (
                        <Stack
                          key={`${act.value}-${aIdx}`}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Typography variant="body2">• {act.value}</Typography>
                          <SourceChip source={act.source} />
                        </Stack>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Stack>
          ) : null}

          {cloud.payment_schedule?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {copy.cloudPayment ?? 'Payment schedule'}
              </Typography>
              {cloud.payment_schedule.map((row, index) => (
                <Stack
                  key={`${row.work_period.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">
                    {row.work_period.value}: {row.terms.value}
                  </Typography>
                  {row.nominal.amount === undefined && (
                    <Typography variant="caption" color="error">
                      (Harga diperlukan)
                    </Typography>
                  )}
                  <SourceChip source={row.work_period.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}

          {cloud.limitation_codes?.length || cloud.additional_limitations?.length ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Limitations
              </Typography>
              {cloud.limitation_codes?.map((code, index) => (
                <Stack
                  key={`limit-code-${code.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{code.value}</Typography>
                  <SourceChip source={code.source} />
                </Stack>
              ))}
              {cloud.additional_limitations?.map((item, index) => (
                <Stack
                  key={`limit-add-${item.value}-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="body2">{item.value}</Typography>
                  <SourceChip source={item.source} />
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : (
        <>
          <TextField
            fullWidth
            type="number"
            label={copy.duration}
            value={duration}
            disabled={pending}
            inputProps={{ min: 1, max: 24, step: 1 }}
            onChange={(event) => setDuration(event.target.value)}
            onBlur={() => {
              const value = Number(duration);
              if (Number.isInteger(value) && value > 0)
                onPatch([{ type: 'set_duration_months', duration_months: value }]);
            }}
          />
          {state.team.map((line, index) => (
            <TeamLine
              key={`${line.requested_role}-${index}`}
              team={state.team}
              line={line}
              index={index}
              catalogRoles={catalogRoles}
              pending={pending}
              copy={copy}
              onPatch={onPatch}
            />
          ))}
          <TextField
            fullWidth
            label={copy.payment}
            value={paymentPattern}
            disabled={pending}
            onChange={(event) => setPaymentPattern(event.target.value)}
            onBlur={() => {
              const value = paymentPattern.trim();
              if (value) onPatch([{ type: 'set_payment_pattern', payment_pattern: value }]);
            }}
          />
          <TextField
            fullWidth
            type="number"
            label={copy.discount}
            value={discount}
            disabled={pending || hasBlockingIssue}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            onChange={(event) => setDiscount(event.target.value)}
            onBlur={() => {
              const percent = Number(discount);
              if (Number.isFinite(percent) && percent >= 0 && percent <= 100) {
                onPatch([{ type: 'set_discount_bps', discount_bps: Math.round(percent * 100) }]);
              }
            }}
          />
        </>
      )}

      <Divider />
      {initial === undefined || (!specialized && discounted === undefined) ? (
        <Typography variant="subtitle2" color="text.secondary">
          {copy.priceUnavailable}
        </Typography>
      ) : (
        <Stack spacing={0.5} aria-live="polite">
          {subscription ? (
            <Typography variant="subtitle1">
              {copy.totalContract}: {formatRupiah(initial)}
            </Typography>
          ) : whiteLabel || maintenance || customDev || kioskQueue || talent || cloud ? (
            <Typography variant="subtitle1">
              {copy.totalInvestment}: {formatRupiah(initial)}
            </Typography>
          ) : (
            <>
              <Typography variant="body2">
                {copy.initialTotal}: <strong>{formatRupiah(initial)}</strong>
              </Typography>
              <Typography variant="subtitle1">
                {copy.discountedTotal}: {formatRupiah(discounted!)}
              </Typography>
            </>
          )}
        </Stack>
      )}

      {conflict && (
        <Stack spacing={1}>
          <Typography variant="body2" color="error.main">
            {copy.blocking}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" onClick={onCompare}>
              {copy.compare}
            </Button>
            <Button variant="contained" onClick={onReload}>
              {copy.reload}
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

export function PromptWorkspacePanel(props: Props) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(false);

  if (!mobile) {
    return (
      <Card
        component="aside"
        aria-label={props.copy.title}
        sx={{ width: 360, flexShrink: 0, alignSelf: 'flex-start' }}
      >
        <WorkspaceContents {...props} />
      </Card>
    );
  }

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {props.copy.open}
      </Button>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Stack direction="row" justifyContent="flex-end" sx={{ px: 1, pt: 1 }}>
          <Button aria-label={props.copy.close} onClick={() => setOpen(false)}>
            {props.copy.close}
          </Button>
        </Stack>
        <WorkspaceContents {...props} />
      </Drawer>
    </>
  );
}
