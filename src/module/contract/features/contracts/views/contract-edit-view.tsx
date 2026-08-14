import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { useContract, useShareContract, useUpdateContract } from '../hooks/use-contracts';

type FormValues = {
  scope_data: string;
  deliverables_data: string;
  commercial_terms: string;
  payment_terms: string;
  timeline_data: string;
  additional_terms: string;
};

export function ContractEditView({ id }: { id: string }) {
  const router = useRouter();
  
  const { data: contract, isLoading } = useContract(id);
  const updateContract = useUpdateContract(id);
  const shareContract = useShareContract(id);

  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<FormValues>({
    defaultValues: {
      scope_data: '',
      deliverables_data: '',
      commercial_terms: '',
      payment_terms: '',
      timeline_data: '',
      additional_terms: '',
    },
  });

  useEffect(() => {
    if (contract) {
      reset({
        scope_data: contract.scope_data || '',
        deliverables_data: contract.deliverables_data || '',
        commercial_terms: contract.commercial_terms || '',
        payment_terms: contract.payment_terms || '',
        timeline_data: contract.timeline_data || '',
        additional_terms: contract.additional_terms || '',
      });
    }
  }, [contract, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateContract.mutateAsync(data);
      toast.success('Contract updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update contract');
    }
  };

  const handleShare = async () => {
    try {
      await shareContract.mutateAsync();
      toast.success('Contract shared successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to share contract');
    }
  };

  if (isLoading) {
    return (
      <DashboardContent maxWidth="md">
        <Stack spacing={3}>
          <Skeleton height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </DashboardContent>
    );
  }

  if (!contract) {
    return (
      <DashboardContent maxWidth="md">
        <Typography>Contract not found</Typography>
      </DashboardContent>
    );
  }

  const isDraft = contract.status === 'draft';

  return (
    <DashboardContent maxWidth="md">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<Iconify icon="eva:arrow-ios-back-fill" />} onClick={() => router.push(paths.dashboard.contract.root)}>
            Back
          </Button>
          <Typography variant="h4">Edit Contract {contract.contract_number}</Typography>
        </Stack>
        {isDraft && (
          <Button variant="contained" color="secondary" onClick={handleShare}>
            Share with Client
          </Button>
        )}
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              {...register('scope_data')}
              label="Scope of Work"
              multiline
              rows={4}
              disabled={!isDraft}
              fullWidth
            />
            <TextField
              {...register('deliverables_data')}
              label="Deliverables"
              multiline
              rows={4}
              disabled={!isDraft}
              fullWidth
            />
            <TextField
              {...register('commercial_terms')}
              label="Commercial Terms"
              multiline
              rows={4}
              disabled={!isDraft}
              fullWidth
            />
            <TextField
              {...register('payment_terms')}
              label="Payment Terms"
              multiline
              rows={4}
              disabled={!isDraft}
              fullWidth
            />
            <TextField
              {...register('timeline_data')}
              label="Timeline"
              multiline
              rows={4}
              disabled={!isDraft}
              fullWidth
            />
            <TextField
              {...register('additional_terms')}
              label="Additional Terms"
              multiline
              rows={4}
              disabled={!isDraft}
              fullWidth
            />

            {isDraft && (
              <Box display="flex" justifyContent="flex-end">
                <LoadingButton type="submit" variant="contained" loading={isSubmitting || updateContract.isPending} disabled={!isDirty}>
                  Save Changes
                </LoadingButton>
              </Box>
            )}
          </Stack>
        </Card>
      </form>
    </DashboardContent>
  );
}
