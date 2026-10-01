import { type FC } from 'react';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Client } from '@invoice-builder/contracts';

interface Props {
  item: Client;
  selectedItem?: Client;
  showDeleteButton?: boolean;
  onEdit?: (item: Client) => void;
  onDelete?: (id: number) => void;
}
export const List: FC<Props> = ({
  item,
  selectedItem,
  onEdit = () => {},
  onDelete = () => {},
  showDeleteButton = true
}) => {
  return (
    <GenericList
      item={item}
      showDeleteButton={showDeleteButton}
      selectedItem={selectedItem}
      onEdit={onEdit}
      onDelete={onDelete}
      getShortName={c => c.shortName}
      getName={c => c.name}
      getEmail={c => c.email}
      getPhone={c => c.phone}
      getInvoiceCount={c => c.invoiceCount}
      getQuotesCount={c => c.quotesCount}
      getIsArchived={c => c.isArchived}
    />
  );
};
