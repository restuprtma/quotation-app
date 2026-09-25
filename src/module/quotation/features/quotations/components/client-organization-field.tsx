import type { ClientSummary } from '../types';

import React, { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

export type ClientOrganizationFieldProps = {
  value?: ClientSummary | null;
  options: ClientSummary[];
  isLoading?: boolean;
  loadError?: Error | null;
  createError?: Error | null;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  error?: boolean;
  onChange: (value: ClientSummary | null) => void;
  onCreate?: (name: string) => Promise<ClientSummary>;
  isCreating?: boolean;
};

export function ClientOrganizationField({
  value,
  options = [],
  isLoading = false,
  loadError = null,
  createError = null,
  disabled = false,
  required = false,
  label = 'Klien / Organisasi',
  placeholder = 'Pilih atau cari organisasi...',
  helperText,
  error = false,
  onChange,
  onCreate,
  isCreating = false,
}: ClientOrganizationFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [localCreating, setLocalCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenDialog = () => {
    setErrorMessage(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (localCreating || isCreating) return;
    setDialogOpen(false);
    setErrorMessage(null);
  };

  const handleCreateSubmit = useCallback(async () => {
    const trimmed = newOrgName.trim();
    if (!trimmed) return;

    if (!onCreate) {
      setDialogOpen(false);
      return;
    }

    setLocalCreating(true);
    setErrorMessage(null);

    try {
      const created = await onCreate(trimmed);
      onChange(created);
      setNewOrgName('');
      setDialogOpen(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan organisasi';
      setErrorMessage(msg);
    } finally {
      setLocalCreating(false);
    }
  }, [newOrgName, onCreate, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubmit();
    }
  };

  const creating = isCreating || localCreating;
  const activeError = errorMessage || createError?.message;

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete<ClientSummary, false, false, false>
        value={value ?? null}
        options={options}
        loading={isLoading}
        disabled={disabled}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
        isOptionEqualToValue={(option, val) => option?.id === val?.id}
        filterOptions={(opts, state) => {
          const filterText = (state.inputValue ?? '').toLowerCase().trim();
          if (!filterText) return opts;
          return opts.filter((opt) => opt.name.toLowerCase().includes(filterText));
        }}
        onChange={(_, newValue) => {
          onChange(newValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error || Boolean(loadError)}
            helperText={
              helperText ?? (loadError ? loadError.message || 'Gagal memuat klien' : undefined)
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          type="button"
          size="small"
          variant="text"
          disabled={disabled}
          onClick={handleOpenDialog}
          sx={{ textTransform: 'none', px: 0.5, py: 0.25 }}
        >
          + Tambah organisasi baru
        </Button>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
        aria-labelledby="create-client-dialog-title"
      >
        <DialogTitle id="create-client-dialog-title">Tambah Organisasi Baru</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Masukkan nama organisasi atau perusahaan klien baru.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Nama Organisasi"
            placeholder="misal: PT Maju Bersama"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={creating}
            error={Boolean(activeError)}
          />

          {activeError && (
            <Alert severity="error" sx={{ mt: 0.5 }}>
              {activeError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button type="button" onClick={handleCloseDialog} disabled={creating}>
            Batal
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={creating || !newOrgName.trim()}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
