import type { ReferenceOption } from '../../validation/manual-section';

import React from 'react';

import {
  Box,
  Chip,
  TextField,
  Typography,
  FormControl,
  Autocomplete,
  FormHelperText,
} from '@mui/material';

export interface ReferenceSelectProps {
  label: string;
  options: ReferenceOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  filterSection?: string;
  id?: string;
}

export function ReferenceSelect({
  label,
  options,
  value,
  onChange,
  multiple = false,
  error = false,
  helperText,
  disabled = false,
  placeholder = 'Pilih referensi canonical...',
  filterSection,
  id,
}: ReferenceSelectProps) {
  const selectId = id || `ref-select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const helperId = `${selectId}-helper`;

  const filteredOptions = React.useMemo(() => {
    if (!filterSection) return options;
    return options.filter((o) => o.section === filterSection);
  }, [options, filterSection]);

  if (multiple) {
    const selectedValues = Array.isArray(value) ? value : [];
    const selectedOptions = filteredOptions.filter((o) => selectedValues.includes(o.value));

    return (
      <FormControl fullWidth error={error} disabled={disabled} sx={{ mt: 1, mb: 1 }}>
        <Autocomplete
          multiple
          id={selectId}
          disabled={disabled}
          options={filteredOptions}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
          isOptionEqualToValue={(opt, val) =>
            typeof val === 'string' ? opt.value === val : opt.value === val.value
          }
          value={selectedOptions}
          onChange={(_, newValue) => {
            const result = newValue.map((item) => (typeof item === 'string' ? item : item.value));
            onChange(result);
          }}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const opt = typeof option === 'string' ? { label: option, value: option } : option;
              return (
                <Chip
                  {...getTagProps({ index })}
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={selectedValues.length === 0 ? placeholder : ''}
              error={error}
              inputProps={{
                ...params.inputProps,
                'aria-describedby': helperText ? helperId : undefined,
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.value}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.value}
                </Typography>
              </Box>
            </Box>
          )}
        />
        {helperText && (
          <FormHelperText id={helperId} error={error}>
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }

  const selectedValue = typeof value === 'string' ? value : '';
  const selectedOption = filteredOptions.find((o) => o.value === selectedValue) || null;

  return (
    <FormControl fullWidth error={error} disabled={disabled} sx={{ mt: 1, mb: 1 }}>
      <Autocomplete
        id={selectId}
        disabled={disabled}
        options={filteredOptions}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
        isOptionEqualToValue={(opt, val) =>
          typeof val === 'string' ? opt.value === val : opt.value === val.value
        }
        value={selectedOption}
        onChange={(_, newValue) => {
          if (!newValue) {
            onChange('');
          } else {
            onChange(typeof newValue === 'string' ? newValue : newValue.value);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            inputProps={{
              ...params.inputProps,
              'aria-describedby': helperText ? helperId : undefined,
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.value}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.value}
              </Typography>
            </Box>
          </Box>
        )}
      />
      {helperText && (
        <FormHelperText id={helperId} error={error}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
