import { useState } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/shared/ui/iconify';
import { fDateTime } from 'src/shared/utils/format-time';

import { useSharedBlueprint } from '../hooks/use-shared-blueprint';
import { BlueprintResultPreview } from '../../blueprints/components/blueprint-result-preview';

export function SharedBlueprintView({ token }: { token: string }) {
  const { data: blueprint, isLoading, isError } = useSharedBlueprint(token);
  const [activeSection, setActiveSection] = useState<'journey' | 'architecture' | 'state_machine' | 'workflow' | 'wbs'>('journey');

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }} data-testid="shared-blueprint-loading">
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={80} />
          <Skeleton variant="rounded" height={480} />
        </Stack>
      </Container>
    );
  }

  if (isError || !blueprint) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Iconify
            icon="solar:shield-warning-bold-duotone"
            width={64}
            sx={{ color: 'warning.main', mx: 'auto', mb: 2 }}
          />
          <Typography variant="h5" sx={{ mb: 1.5 }}>
            Blueprint Tidak Ditemukan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tautan blueprint ini tidak valid, telah dicabut, atau dokumen belum dipublikasikan.
          </Typography>
        </Card>
      </Container>
    );
  }

  const isPartial = blueprint.completeness_status === 'partial';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Permanent Partial Banner */}
        {isPartial && (
          <Alert severity="warning" variant="filled">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Blueprint Parsial - Revision {blueprint.revision_number}
            </Typography>
            <Typography variant="body2">
              Dokumen ini belum lengkap dan dapat berubah pada revision berikutnya.
            </Typography>
          </Alert>
        )}

        {/* Header Information */}
        <Card sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h4">{blueprint.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              Revisi {blueprint.revision_number} • Dipublikasikan pada: {fDateTime(blueprint.published_at)}
            </Typography>
            {blueprint.summary && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                {blueprint.summary}
              </Typography>
            )}
          </Stack>
        </Card>

        {/* Read-Only Visual Bundle Preview */}
        <Card sx={{ p: 2 }}>
          <BlueprintResultPreview
            contentJson={{
              journey: blueprint.completeness_matrix?.journey === 'pending' ? undefined : blueprint.journey,
              architecture: blueprint.completeness_matrix?.architecture === 'pending' ? undefined : blueprint.architecture,
              state_machine: blueprint.completeness_matrix?.state_machine === 'pending' ? undefined : blueprint.state_machine,
              workflow: blueprint.completeness_matrix?.workflow === 'pending' ? undefined : blueprint.workflow,
              wbs: blueprint.completeness_matrix?.wbs === 'pending' ? undefined : blueprint.wbs,
            }}
            activeSection={activeSection}
            onSectionChange={(s) => setActiveSection(s as any)}
            emptyDescription={`Bagian ini belum tersedia pada Revision ${blueprint.revision_number}. Hubungi Business Analyst untuk revision berikutnya.`}
          />
        </Card>
      </Stack>
    </Container>
  );
}
