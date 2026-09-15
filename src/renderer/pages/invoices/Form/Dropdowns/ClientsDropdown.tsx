import AddIcon from '@mui/icons-material/Add';
import { Box, Button, SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CRUDPage } from '../../../../shared/components/layout/crudPage/CRUDPage';
import { FilterType } from '../../../../shared/enums/filterType';
import { useClientsRetrieve } from '../../../../shared/hooks/clients/useClientsRetrieve';
import type { Client, ClientAdd, ClientUpdate } from '../../../../shared/types/client';
import type { Filter, FilterData } from '../../../../shared/types/filter';
import type { Response } from '../../../../shared/types/response';
import { createCommonFilters, createInvoiceFilters } from '../../../../shared/utils/filterSortFunctions';
import { List as ClientsList } from '../../../clients/List';
import { ClientQuickAddModal } from '../Modals/ClientQuickAddModal';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: Client) => void;
}

const ClientsDropdownComponent: FC<Props> = ({ isOpen, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'clients', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'clients' })
  ];
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const useClientsCRUDRetrieve = (args: { filter?: FilterData[]; onDone?: (data: Response<Client[]>) => void }) => {
    const { clients, execute } = useClientsRetrieve({ filter: args.filter, onDone: args.onDone });
    return { items: clients, execute };
  };

  return (
    <>
      <ClientQuickAddModal
        isOpen={isQuickAddOpen}
        onCancel={() => setIsQuickAddOpen(false)}
        onCreated={client => {
          setIsQuickAddOpen(false);
          onClick?.(client);
        }}
      />
      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => onClose?.()}
        onOpen={() => onOpen?.()}
        slotProps={{
          paper: {
            sx: {
              maxWidth: isDesktop ? '40%' : '100%',
              height: '80%',
              mx: 'auto',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              p: 3
            }
          }
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setIsQuickAddOpen(true)}>
            {t('invoices.addBillTo')}
          </Button>
        </Box>
        <CRUDPage<Client, ClientAdd, ClientUpdate>
          componentId="invoices:clients"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useClientsCRUDRetrieve}
          searchField={'name'}
          sortOptions={[
            { label: t('common.name'), value: 'name' },
            { label: t('common.lastUpdate'), value: 'updatedAt' }
          ]}
          noItemText={t('clients.noItem')}
          renderListItem={(item, selectedItem) => (
            <ClientsList
              key={item.id}
              item={item}
              showDeleteButton={false}
              selectedItem={selectedItem}
              onEdit={(editItem: Client) => onClick?.(editItem)}
            />
          )}
        />
      </SwipeableDrawer>
    </>
  );
};
export const ClientsDropdown = memo(ClientsDropdownComponent);
