import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { useTable, TableSkeleton, TableHeadCustom } from 'src/shared/ui/table';

import { useContracts } from '../hooks/use-contracts';

// Reusing formatDate for simplicity
function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ContractListView() {
  const router = useRouter();
  const table = useTable();
  const { data = [], isLoading } = useContracts();

  const TABLE_HEAD = [
    { id: 'contract_number', label: 'Contract No.' },
    { id: 'status', label: 'Status' },
    { id: 'created_at', label: 'Created At' },
    { id: 'actions', label: 'Actions', align: 'right' as const },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Contracts"
        subtitle="Manage your contracts"
      />
      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rowCount={5} cellCount={4} />
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.contract_number}</TableCell>
                      <TableCell>
                        <Label color={row.status === 'signed' ? 'success' : row.status === 'draft' ? 'default' : 'info'}>
                          {row.status}
                        </Label>
                      </TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => router.push(paths.dashboard.contract.edit(row.id))}>
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                        {row.status !== 'draft' && (
                          <Tooltip title="View Link">
                            <IconButton onClick={() => {
                              const url = `${window.location.origin}${paths.public.contract(row.public_token)}`;
                              navigator.clipboard.writeText(url);
                            }}>
                              <Iconify icon="eva:link-2-fill" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>
    </DashboardContent>
  );
}
