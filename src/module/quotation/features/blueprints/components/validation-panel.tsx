import type { ProviderSection } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import AlertTitle from '@mui/material/AlertTitle';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/shared/ui/iconify';

export interface ValidationIssue {
  section: string;
  code?: string;
  message: string;
  field?: string;
  path?: string;
  target_id?: string;
  severity: 'error' | 'warning';
  blocking?: boolean;
  remediation?: string;
}

export interface ValidationPanelProps {
  validationResult?: Record<string, any> | null;
  crossValidationResult?: Record<string, any> | null;
  onOpenManual?: (section: ProviderSection) => void;
  onFocusIssue?: (issue: ValidationIssue) => void;
}

const PROVIDER_SECTIONS: ProviderSection[] = [
  'journey',
  'architecture',
  'state_machine',
  'workflow',
  'wbs',
];

export function mapToProviderSection(secName: string): ProviderSection | null {
  if (!secName) return null;
  const clean = secName.toLowerCase().trim().replace(/[-\s]/g, '_');
  if (clean === 'state' || clean === 'states' || clean === 'state_machine') return 'state_machine';
  if (clean === 'workflows' || clean === 'workflow') return 'workflow';
  if (clean === 'cross_reference' || clean === 'cross_references' || clean === 'cross_validation') {
    return 'wbs';
  }
  if (PROVIDER_SECTIONS.includes(clean as ProviderSection)) return clean as ProviderSection;
  return null;
}

function parseSingleIssue(
  raw: any,
  defaultSec: string = 'General',
  defaultSeverity: 'error' | 'warning' = 'error'
): ValidationIssue {
  if (typeof raw === 'string') {
    return {
      section: defaultSec,
      message: raw,
      severity: defaultSeverity,
    };
  }
  const section = raw.section || raw.target_section || raw.source_section || defaultSec;
  const severity: 'error' | 'warning' =
    raw.severity === 'warning' && !raw.blocking
      ? 'warning'
      : raw.severity === 'error' || raw.blocking
        ? 'error'
        : defaultSeverity;

  return {
    section,
    code: raw.code || raw.rule_name || raw.error_code || raw.warning_code,
    message: raw.message || raw.detail || raw.description || raw.suggestion || JSON.stringify(raw),
    field: raw.field,
    path: raw.path,
    target_id: raw.target_id,
    severity,
    blocking: Boolean(raw.blocking),
    remediation: raw.remediation,
  };
}

export function ValidationPanel({
  validationResult,
  crossValidationResult,
  onOpenManual,
  onFocusIssue,
}: ValidationPanelProps) {
  // Extract issues from validation_result
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const processObject = (obj: any, sectionName?: string) => {
    if (!obj || typeof obj !== 'object') return;

    // 1. Direct canonical `issues` array
    if (Array.isArray(obj.issues)) {
      obj.issues.forEach((raw: any) => {
        const parsed = parseSingleIssue(raw, sectionName || 'General', 'error');
        if (parsed.severity === 'error') {
          errors.push(parsed);
        } else {
          warnings.push(parsed);
        }
      });
    }

    // 2. Legacy `errors`, `error_list`, `inconsistencies`
    const rawErrors = obj.errors || obj.error_list || obj.inconsistencies || [];
    if (Array.isArray(rawErrors)) {
      rawErrors.forEach((raw: any) => {
        const parsed = parseSingleIssue(raw, sectionName || 'General', 'error');
        errors.push(parsed);
      });
    }

    // 3. Legacy `warnings`, `warning_list`
    const rawWarnings = obj.warnings || obj.warning_list || [];
    if (Array.isArray(rawWarnings)) {
      rawWarnings.forEach((raw: any) => {
        const parsed = parseSingleIssue(raw, sectionName || 'General', 'warning');
        warnings.push(parsed);
      });
    }

    // 4. Per-section children if at top-level
    if (!sectionName) {
      for (const sec of PROVIDER_SECTIONS) {
        if (obj[sec] && typeof obj[sec] === 'object') {
          processObject(obj[sec], sec);
        }
      }
    }
  };

  processObject(validationResult);
  processObject(crossValidationResult);

  // Coverage score parsing
  const rawScore =
    validationResult?.coverage_score ??
    validationResult?.score ??
    crossValidationResult?.coverage_score ??
    crossValidationResult?.score;

  const coverageScore: number | null =
    typeof rawScore === 'number'
      ? rawScore > 1
        ? Math.min(100, Math.round(rawScore))
        : Math.round(rawScore * 100)
      : null;

  const checkedRulesCount =
    (validationResult?.checked_rules || validationResult?.total_checks || 0) +
    (crossValidationResult?.checked_rules || crossValidationResult?.total_checks || 0);

  const isEvaluated =
    (validationResult && Object.keys(validationResult).length > 0) ||
    (crossValidationResult && Object.keys(crossValidationResult).length > 0);

  const totalIssuesCount = errors.length + warnings.length;

  if (!isEvaluated) {
    return (
      <Card>
        <CardHeader
          title="Panel Validasi & Konsistensi"
          subheader="Pemeriksaan integritas skema dan keselarasan antar-section."
        />
        <CardContent>
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
              icon="solar:shield-warning-bold"
              width={48}
              sx={{ color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Validasi Belum Dijalankan
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 450 }}>
              Hasil validasi skema dan integritas silang akan muncul secara otomatis setelah semua
              tahapan provider selesai digenerasi.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const hasActionColumn = Boolean(onOpenManual || onFocusIssue);

  return (
    <Card>
      <CardHeader
        title="Panel Validasi & Konsistensi"
        subheader="Pemeriksaan integritas skema dan keselarasan antar-section."
        action={
          errors.length > 0 ? (
            <Chip
              icon={<Iconify icon="solar:danger-triangle-bold" width={16} />}
              label={`${errors.length} Error Ditemukan`}
              color="error"
              variant="soft"
            />
          ) : warnings.length > 0 ? (
            <Chip
              icon={<Iconify icon="solar:info-circle-bold" width={16} />}
              label={`${warnings.length} Peringatan`}
              color="warning"
              variant="soft"
            />
          ) : (
            <Chip
              icon={<Iconify icon="solar:check-circle-bold" width={16} />}
              label="Validasi Lolos (100% Valid)"
              color="success"
              variant="soft"
            />
          )
        }
      />

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Metric Overview */}
        <Grid container spacing={2}>
          {coverageScore !== null && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  SKOR CAKUPAN / COVERAGE
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, mb: 1 }}>
                  <Typography
                    variant="h4"
                    color={coverageScore >= 80 ? 'success.main' : 'warning.main'}
                  >
                    {coverageScore}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={coverageScore}
                  color={coverageScore >= 80 ? 'success' : 'warning'}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Paper>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL ATURAN DIPERIKSA
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {checkedRulesCount > 0 ? checkedRulesCount : 'Semua Standar'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aturan skema & validasi silang
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                STATUS ISU
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  color:
                    errors.length > 0
                      ? 'error.main'
                      : warnings.length > 0
                        ? 'warning.main'
                        : 'success.main',
                }}
              >
                {totalIssuesCount === 0 ? 'Bersih' : `${totalIssuesCount} Isu`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {errors.length} Error, {warnings.length} Peringatan
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Success Alert if zero issues */}
        {totalIssuesCount === 0 && (
          <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" width={24} />}>
            <AlertTitle>Semua Validasi Berhasil</AlertTitle>
            Seluruh struktur data, relasi antar-section, spesifikasi teknis, dan estimasi WBS
            konsisten serta memenuhi standar integritas sistem.
          </Alert>
        )}

        {/* Errors Table */}
        {errors.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              color="error.main"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
            >
              <Iconify icon="solar:danger-triangle-bold" width={18} />
              Daftar Error Validasi ({errors.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140 }}>Target Section</TableCell>
                    <TableCell sx={{ width: 160 }}>Kode / Rule</TableCell>
                    <TableCell>Pesan Error</TableCell>
                    {hasActionColumn && (
                      <TableCell sx={{ width: 160, textAlign: 'right' }}>Aksi</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((err, idx) => {
                    const targetSec = mapToProviderSection(err.section);
                    return (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip
                            size="small"
                            label={err.section}
                            color="error"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontWeight={600} color="error.dark">
                            {err.code || (err.field ? `Field: ${err.field}` : '-')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{String(err.message)}</Typography>
                          {err.remediation && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              Saran: {err.remediation}
                            </Typography>
                          )}
                        </TableCell>
                        {hasActionColumn && (
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              {onFocusIssue && (
                                <Button
                                  size="small"
                                  variant="text"
                                  color="error"
                                  startIcon={<Iconify icon="solar:magnifier-bold" width={14} />}
                                  onClick={() => onFocusIssue(err)}
                                  aria-label={`Fokus pada isu ${err.code || err.section}`}
                                >
                                  Fokus
                                </Button>
                              )}
                              {onOpenManual &&
                                (targetSec ? (
                                  <Button
                                    size="small"
                                    variant="text"
                                    color="error"
                                    startIcon={
                                      <Iconify icon="solar:pen-new-square-bold" width={14} />
                                    }
                                    onClick={() => onOpenManual(targetSec)}
                                  >
                                    Koreksi
                                  </Button>
                                ) : !onFocusIssue ? (
                                  <Typography variant="caption" color="text.disabled">
                                    -
                                  </Typography>
                                ) : null)}
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Warnings Table */}
        {warnings.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              color="warning.main"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
            >
              <Iconify icon="solar:info-circle-bold" width={18} />
              Daftar Peringatan Konsistensi ({warnings.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140 }}>Target Section</TableCell>
                    <TableCell sx={{ width: 160 }}>Kode / Rule</TableCell>
                    <TableCell>Saran Perbaikan / Peringatan</TableCell>
                    {hasActionColumn && (
                      <TableCell sx={{ width: 160, textAlign: 'right' }}>Aksi</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warnings.map((warn, idx) => {
                    const targetSec = mapToProviderSection(warn.section);
                    return (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip
                            size="small"
                            label={warn.section}
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontWeight={600} color="warning.dark">
                            {warn.code || (warn.field ? `Field: ${warn.field}` : '-')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{String(warn.message)}</Typography>
                          {warn.remediation && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              Saran: {warn.remediation}
                            </Typography>
                          )}
                        </TableCell>
                        {hasActionColumn && (
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              {onFocusIssue && (
                                <Button
                                  size="small"
                                  variant="text"
                                  color="warning"
                                  startIcon={<Iconify icon="solar:magnifier-bold" width={14} />}
                                  onClick={() => onFocusIssue(warn)}
                                  aria-label={`Fokus pada isu ${warn.code || warn.section}`}
                                >
                                  Fokus
                                </Button>
                              )}
                              {onOpenManual &&
                                (targetSec ? (
                                  <Button
                                    size="small"
                                    variant="text"
                                    color="warning"
                                    startIcon={
                                      <Iconify icon="solar:pen-new-square-bold" width={14} />
                                    }
                                    onClick={() => onOpenManual(targetSec)}
                                  >
                                    Koreksi
                                  </Button>
                                ) : !onFocusIssue ? (
                                  <Typography variant="caption" color="text.disabled">
                                    -
                                  </Typography>
                                ) : null)}
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
