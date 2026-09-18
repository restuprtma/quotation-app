import type { SyntheticEvent } from 'react';
import type { ProviderSection } from '../types';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/shared/ui/iconify';

export interface BlueprintResultPreviewProps {
  contentJson?: Record<string, any> | null;
  activeSection?: ProviderSection;
  onSectionChange?: (section: ProviderSection) => void;
}

const SECTION_TABS: { value: ProviderSection; label: string; icon: string }[] = [
  { value: 'journey', label: 'User Journey', icon: 'solar:user-bold' },
  { value: 'architecture', label: 'Arsitektur', icon: 'solar:layers-bold' },
  { value: 'state_machine', label: 'State Machine', icon: 'solar:round-transfer-vertical-bold' },
  { value: 'workflow', label: 'Workflow', icon: 'solar:tuning-square-2-bold' },
  { value: 'wbs', label: 'WBS', icon: 'solar:checklist-minimalistic-bold' },
];

function EmptySectionState({ sectionLabel }: { sectionLabel: string }) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        bgcolor: 'background.neutral',
        borderRadius: 1.5,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Iconify
        icon="solar:document-medicine-bold"
        width={48}
        sx={{ color: 'text.disabled', mb: 2 }}
      />
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Data {sectionLabel} Belum Tersedia
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 400 }}>
        Tahapan ini belum selesai digenerasi atau belum memiliki output konten yang tersimpan.
      </Typography>
    </Box>
  );
}

function RenderGenericTable({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    return (
      <Stack spacing={1}>
        {data.map((item, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="body2">{String(item)}</Typography>
          </Paper>
        ))}
      </Stack>
    );
  }

  const headers = Object.keys(firstItem);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell key={h} sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                {h.replace(/_/g, ' ')}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rIdx) => (
            <TableRow key={rIdx} hover>
              {headers.map((h) => {
                const cellVal = row[h];
                return (
                  <TableCell key={h}>
                    {Array.isArray(cellVal) ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {cellVal.map((v, i) => (
                          <Chip key={i} size="small" label={String(v)} variant="soft" />
                        ))}
                      </Stack>
                    ) : typeof cellVal === 'object' && cellVal !== null ? (
                      <Typography variant="caption">{JSON.stringify(cellVal)}</Typography>
                    ) : (
                      <Typography variant="body2">
                        {cellVal !== undefined && cellVal !== null ? String(cellVal) : '-'}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function RenderJourneySection({ data }: { data: any }) {
  if (!data) return <EmptySectionState sectionLabel="User Journey" />;

  const journeys = Array.isArray(data)
    ? data
    : Array.isArray(data.journeys)
      ? data.journeys
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.scenarios)
          ? data.scenarios
          : null;

  if (!journeys || journeys.length === 0) {
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      return (
        <Stack spacing={2}>
          {Object.entries(data).map(([key, val]) => (
            <Box key={key}>
              <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                {key.replace(/_/g, ' ')}
              </Typography>
              {Array.isArray(val) ? (
                <RenderGenericTable data={val} />
              ) : (
                <Typography variant="body2">{String(val)}</Typography>
              )}
            </Box>
          ))}
        </Stack>
      );
    }
    return <EmptySectionState sectionLabel="User Journey" />;
  }

  return (
    <Stack spacing={3}>
      {journeys.map((j: any, index: number) => {
        const title = j.title || j.scenario || j.name || `Skenario ${index + 1}`;
        const persona = j.persona || j.actor;
        const goal = j.goal || j.objective || j.description;
        const steps = Array.isArray(j.steps)
          ? j.steps
          : Array.isArray(j.touchpoints)
            ? j.touchpoints
            : [];

        return (
          <Card key={index} variant="outlined">
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1">{title}</Typography>
                  {persona && (
                    <Chip size="small" label={`Aktor: ${persona}`} color="primary" variant="soft" />
                  )}
                </Stack>
              }
              subheader={goal ? `Tujuan: ${goal}` : undefined}
            />
            {steps.length > 0 && (
              <CardContent sx={{ pt: 0 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 60 }}>Langkah</TableCell>
                        <TableCell>Aksi Pengguna</TableCell>
                        <TableCell>Respon Sistem</TableCell>
                        <TableCell>Touchpoint / Kanal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {steps.map((st: any, sIdx: number) => {
                        const stepNum = st.step_number || st.step || sIdx + 1;
                        const action =
                          st.action ||
                          st.user_action ||
                          st.description ||
                          (typeof st === 'string' ? st : '-');
                        const response = st.system_response || st.response || st.outcome || '-';
                        const touchpoint = st.touchpoint || st.channel || '-';

                        return (
                          <TableRow key={sIdx} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                #{stepNum}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{String(action)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {String(response)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{String(touchpoint)}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}
          </Card>
        );
      })}
    </Stack>
  );
}

function RenderArchitectureSection({ data }: { data: any }) {
  if (!data) return <EmptySectionState sectionLabel="Arsitektur Sistem" />;

  const components = Array.isArray(data.components)
    ? data.components
    : Array.isArray(data)
      ? data
      : null;
  const layers = Array.isArray(data.layers) ? data.layers : null;
  const dataStores = Array.isArray(data.database)
    ? data.database
    : Array.isArray(data.data_stores)
      ? data.data_stores
      : Array.isArray(data.databases)
        ? data.databases
        : null;
  const integrations = Array.isArray(data.integrations) ? data.integrations : null;
  const overview = data.overview || data.summary || data.description;

  const hasAnyData = overview || components || layers || dataStores || integrations;
  if (!hasAnyData) {
    return <EmptySectionState sectionLabel="Arsitektur Sistem" />;
  }

  return (
    <Stack spacing={3}>
      {overview && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Ringkasan Arsitektur
          </Typography>
          <Typography variant="body2">{String(overview)}</Typography>
        </Paper>
      )}

      {components && components.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify icon="solar:box-minimalistic-bold" width={18} />
            Daftar Komponen Sistem ({components.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nama Komponen</TableCell>
                  <TableCell>Tipe / Layer</TableCell>
                  <TableCell>Teknologi</TableCell>
                  <TableCell>Tanggung Jawab & Fungsi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {components.map((comp: any, idx: number) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {comp.name || comp.component_name || `Komponen ${idx + 1}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={comp.type || comp.layer || 'Service'}
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>
                        {comp.technology || comp.tech_stack || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {comp.responsibilities || comp.description || comp.purpose || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {dataStores && dataStores.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify icon="solar:database-bold" width={18} />
            Basis Data & Penyimpanan
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nama Database / Store</TableCell>
                  <TableCell>Tipe</TableCell>
                  <TableCell>Deskripsi / Peruntukan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataStores.map((ds: any, idx: number) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {ds.name || ds.database_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ds.type || ds.engine || 'Relational'}
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {ds.description || ds.purpose || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {integrations && integrations.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify icon="solar:link-circle-bold" width={18} />
            Integrasi Eksternal
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Layanan / Target</TableCell>
                  <TableCell>Protokol</TableCell>
                  <TableCell>Fungsi Integrasi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrations.map((integ: any, idx: number) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {integ.name || integ.service || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={integ.protocol || integ.type || 'REST API'}
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {integ.purpose || integ.description || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}

function RenderStateMachineSection({ data }: { data: any }) {
  if (!data) return <EmptySectionState sectionLabel="State Machine" />;

  const states = Array.isArray(data.states) ? data.states : null;
  const transitions = Array.isArray(data.transitions) ? data.transitions : null;
  const entityName = data.entity || data.name || data.title;

  const hasData = states || transitions || entityName;
  if (!hasData) {
    if (Array.isArray(data) && data.length > 0) {
      return <RenderGenericTable data={data} />;
    }
    return <EmptySectionState sectionLabel="State Machine" />;
  }

  return (
    <Stack spacing={3}>
      {entityName && (
        <Typography variant="subtitle1" color="primary">
          Entitas: {entityName}
        </Typography>
      )}

      {states && states.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify icon="solar:circles-concentric-bold" width={18} />
            Daftar Status / States ({states.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nama State</TableCell>
                  <TableCell>Tipe</TableCell>
                  <TableCell>Deskripsi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {states.map((st: any, idx: number) => {
                  const stateName = typeof st === 'string' ? st : st.name || st.state;
                  const stateType = typeof st === 'object' ? st.type || 'intermediate' : 'state';
                  const desc = typeof st === 'object' ? st.description || '-' : '-';

                  return (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={stateName}
                          color={
                            stateType === 'initial'
                              ? 'info'
                              : stateType === 'final'
                                ? 'success'
                                : 'default'
                          }
                          variant="soft"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                          {stateType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {desc}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {transitions && transitions.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify icon="solar:round-transfer-horizontal-bold" width={18} />
            Transisi State ({transitions.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dari State</TableCell>
                  <TableCell>Ke State</TableCell>
                  <TableCell>Event / Trigger</TableCell>
                  <TableCell>Syarat (Guard)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transitions.map((tr: any, idx: number) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Chip size="small" label={tr.from || tr.source || '-'} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tr.to || tr.target || '-'}
                        color="primary"
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {tr.trigger || tr.event || tr.action || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tr.guard || tr.condition || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}

function RenderWorkflowSection({ data }: { data: any }) {
  if (!data) return <EmptySectionState sectionLabel="Workflow Bisnis" />;

  const workflows = Array.isArray(data)
    ? data
    : Array.isArray(data.workflows)
      ? data.workflows
      : Array.isArray(data.processes)
        ? data.processes
        : null;

  if (!workflows || workflows.length === 0) {
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      return (
        <Stack spacing={2}>
          {Object.entries(data).map(([key, val]) => (
            <Box key={key}>
              <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                {key.replace(/_/g, ' ')}
              </Typography>
              {Array.isArray(val) ? (
                <RenderGenericTable data={val} />
              ) : (
                <Typography variant="body2">{String(val)}</Typography>
              )}
            </Box>
          ))}
        </Stack>
      );
    }
    return <EmptySectionState sectionLabel="Workflow Bisnis" />;
  }

  return (
    <Stack spacing={3}>
      {workflows.map((wf: any, idx: number) => {
        const title = wf.name || wf.workflow_name || wf.title || `Workflow ${idx + 1}`;
        const actor = wf.actor || wf.role;
        const trigger = wf.trigger || wf.initiator;
        const steps = Array.isArray(wf.steps) ? wf.steps : [];

        return (
          <Card key={idx} variant="outlined">
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1">{title}</Typography>
                  {actor && (
                    <Chip size="small" label={`PIC: ${actor}`} color="info" variant="soft" />
                  )}
                </Stack>
              }
              subheader={trigger ? `Pemicu / Trigger: ${trigger}` : undefined}
            />
            {steps.length > 0 && (
              <CardContent sx={{ pt: 0 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 60 }}>No</TableCell>
                        <TableCell>Aksi / Proses</TableCell>
                        <TableCell>Aktor</TableCell>
                        <TableCell>Aturan Validasi / Keputusan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {steps.map((st: any, sIdx: number) => {
                        const stepNo = st.step_number || st.step || sIdx + 1;
                        const action =
                          st.action ||
                          st.title ||
                          st.description ||
                          (typeof st === 'string' ? st : '-');
                        const stActor = st.actor || st.role || '-';
                        const rule = st.rule || st.validation || st.decision || '-';

                        return (
                          <TableRow key={sIdx} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                #{stepNo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{String(action)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{String(stActor)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {String(rule)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}
          </Card>
        );
      })}
    </Stack>
  );
}

function RenderWbsSection({ data }: { data: any }) {
  if (!data) return <EmptySectionState sectionLabel="Work Breakdown Structure (WBS)" />;

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.tasks)
      ? data.tasks
      : Array.isArray(data.phases)
        ? data.phases
        : Array.isArray(data)
          ? data
          : null;

  const totalDays = data.total_estimation_days || data.total_days || data.total_effort;

  if (!items || items.length === 0) {
    return <EmptySectionState sectionLabel="Work Breakdown Structure (WBS)" />;
  }

  return (
    <Stack spacing={3}>
      {totalDays && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="subtitle2">Total Estimasi Pengerjaan:</Typography>
          <Chip label={`${totalDays} Hari Kerja (Mandays)`} color="primary" variant="soft" />
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>Kode WBS</TableCell>
              <TableCell>Modul / Deliverable</TableCell>
              <TableCell>Uraian Pekerjaan (Task)</TableCell>
              <TableCell sx={{ width: 140 }}>Role / PIC</TableCell>
              <TableCell sx={{ width: 110, textAlign: 'right' }}>Estimasi (Hari)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((it: any, idx: number) => {
              const code = it.code || it.wbs_id || it.id || `WBS-${idx + 1}`;
              const module = it.module || it.phase || it.deliverable || '-';
              const task = it.task || it.title || it.name || it.description || '-';
              const role = it.role || it.pic || it.assigned_to || '-';
              const effort = it.estimation_days || it.days || it.effort || '-';

              return (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Typography variant="caption" fontWeight={600} color="primary">
                      {String(code)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{String(module)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {String(task)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={String(role)} variant="soft" />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>
                      {String(effort)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export function BlueprintResultPreview({
  contentJson,
  activeSection: controlledSection,
  onSectionChange,
}: BlueprintResultPreviewProps) {
  const [internalSection, setInternalSection] = useState<ProviderSection>('journey');

  const activeSection = controlledSection ?? internalSection;

  const handleTabChange = (_: SyntheticEvent, newValue: ProviderSection) => {
    if (onSectionChange) {
      onSectionChange(newValue);
    } else {
      setInternalSection(newValue);
    }
  };

  const renderActiveSectionContent = () => {
    const rawContent = contentJson ?? {};
    const sectionData = rawContent[activeSection];

    switch (activeSection) {
      case 'journey':
        return <RenderJourneySection data={sectionData} />;
      case 'architecture':
        return <RenderArchitectureSection data={sectionData} />;
      case 'state_machine':
        return <RenderStateMachineSection data={sectionData} />;
      case 'workflow':
        return <RenderWorkflowSection data={sectionData} />;
      case 'wbs':
        return <RenderWbsSection data={sectionData} />;
      default:
        return <EmptySectionState sectionLabel={activeSection} />;
    }
  };

  return (
    <Card>
      <CardHeader
        title="Hasil Blueprint yang Digenerasi"
        subheader="Pratinjau terstruktur dari komponen arsitektur dan spesifikasi teknis."
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs
          value={activeSection}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {SECTION_TABS.map((tab) => {
            const hasData = Boolean(contentJson && contentJson[tab.value]);
            return (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon={tab.icon} width={18} />
                    <span>{tab.label}</span>
                    {hasData && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                        }}
                      />
                    )}
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Box>
      <CardContent>{renderActiveSectionContent()}</CardContent>
    </Card>
  );
}
