import AddIcon from '@mui/icons-material/Add';
import { IconButton, SwipeableDrawer, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { memo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetClientsQuery } from '../../../../shared/api/clientsApi';
import { CRUDPageRTK } from '../../../../shared/components/layout/crudPage/CRUDPageRTK';
import { FilterType } from '../../../../shared/enums/filterType';
import type { Client, ClientAdd, ClientUpdate } from '../../../../shared/types/client';
import type { Filter } from '../../../../shared/types/filter';
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
  const [reopenAfterQuickAdd, setReopenAfterQuickAdd] = useState(false);
  const filters: Filter[] = [
    ...createCommonFilters({ t, namespace: 'clients', initial: FilterType.active }),
    ...createInvoiceFilters({ t, namespace: 'clients' })
  ];
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <>
      <ClientQuickAddModal
        isOpen={isQuickAddOpen}
        onCancel={() => {
          setIsQuickAddOpen(false);
          if (reopenAfterQuickAdd) {
            setReopenAfterQuickAdd(false);
            onOpen?.();
          }
        }}
        onCreated={client => {
          setIsQuickAddOpen(false);
          setReopenAfterQuickAdd(false);
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
        <CRUDPageRTK<Client, ClientAdd, ClientUpdate>
          componentId="invoices:clients"
          filters={filters}
          showRightSide={false}
          showAddButton={false}
          useRetrieve={useGetClientsQuery}
          renderListToolbarActions={() => (
            <Tooltip title={t('invoices.addBillTo')}>
              <IconButton
                aria-label={t('invoices.addBillTo')}
                color="primary"
                onClick={() => {
                  setIsQuickAddOpen(true);
                  if (isOpen) {
                    setReopenAfterQuickAdd(true);
                    onClose?.();
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
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
