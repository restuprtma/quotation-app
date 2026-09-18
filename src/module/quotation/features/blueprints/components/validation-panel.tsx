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
  severity: 'error' | 'warning';
}

export interface ValidationPanelProps {
  validationResult?: Record<string, any> | null;
  crossValidationResult?: Record<string, any> | null;
  onOpenManual?: (section: ProviderSection) => void;
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

export function ValidationPanel({
  validationResult,
  crossValidationResult,
  onOpenManual,
}: ValidationPanelProps) {
  // Extract issues from validation_result
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const parseIssues = (resultObj: any, defaultSeverity: 'error' | 'warning' = 'error') => {
    if (!resultObj || typeof resultObj !== 'object') return;

    // Errors extraction
    const rawErrors = resultObj.errors || resultObj.error_list || resultObj.inconsistencies || [];
    if (Array.isArray(rawErrors)) {
      rawErrors.forEach((err: any) => {
        if (typeof err === 'string') {
          errors.push({
            section: 'General',
            message: err,
            severity: 'error',
          });
        } else if (typeof err === 'object' && err !== null) {
          errors.push({
            section: err.section || err.target_section || err.source_section || 'General',
            code: err.code || err.rule_name || err.error_code,
            message: err.message || err.detail || err.description || JSON.stringify(err),
            field: err.field,
            severity: 'error',
          });
        }
      });
    }

    // Warnings extraction
    const rawWarnings = resultObj.warnings || resultObj.warning_list || [];
    if (Array.isArray(rawWarnings)) {
      rawWarnings.forEach((warn: any) => {
        if (typeof warn === 'string') {
          warnings.push({
            section: 'General',
            message: warn,
            severity: 'warning',
          });
        } else if (typeof warn === 'object' && warn !== null) {
          warnings.push({
            section: warn.section || warn.target_section || warn.source_section || 'General',
            code: warn.code || warn.rule_name || warn.warning_code,
            message: warn.message || warn.suggestion || warn.detail || JSON.stringify(warn),
            field: warn.field,
            severity: 'warning',
          });
        }
      });
    }
  };

  parseIssues(validationResult);
  parseIssues(crossValidationResult);

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
                    {onOpenManual && (
                      <TableCell sx={{ width: 110, textAlign: 'right' }}>Aksi</TableCell>
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
                        </TableCell>
                        {onOpenManual && (
                          <TableCell sx={{ textAlign: 'right' }}>
                            {targetSec ? (
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                startIcon={<Iconify icon="solar:pen-new-square-bold" width={14} />}
                                onClick={() => onOpenManual(targetSec)}
                              >
                                Koreksi
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                -
                              </Typography>
                            )}
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
                    {onOpenManual && (
                      <TableCell sx={{ width: 110, textAlign: 'right' }}>Aksi</TableCell>
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
                        </TableCell>
                        {onOpenManual && (
                          <TableCell sx={{ textAlign: 'right' }}>
                            {targetSec ? (
                              <Button
                                size="small"
                                variant="text"
                                color="warning"
                                startIcon={<Iconify icon="solar:pen-new-square-bold" width={14} />}
                                onClick={() => onOpenManual(targetSec)}
                              >
                                Koreksi
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                -
                              </Typography>
                            )}
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
