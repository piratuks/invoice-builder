import SearchIcon from '@mui/icons-material/Search';
import { IconButton, InputBase, Paper, useTheme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SearchInputProps {
  value: string;
  onChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        p: '2px 4px',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        minHeight: 50
      }}
    >
      <IconButton type="submit" sx={{ p: '10px' }} aria-label={t('ariaLabel.search')}>
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={t('common.search')}
        value={value}
        onChange={e => {
          if (onChange) {
            onChange(e.target.value);
          }
        }}
        inputProps={{ 'aria-label': t('ariaLabel.search') }}
      />
    </Paper>
  );
};
