import { type FC } from 'react';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Unit } from '@invoice-builder/contracts';

interface Props {
  item: Unit;
  selectedItem?: Unit;
  onEdit: (item: Unit) => void;
  onDelete: (id: number) => void;
}
export const List: FC<Props> = ({ item, selectedItem, onEdit, onDelete }) => {
  return (
    <GenericList
      item={item}
      selectedItem={selectedItem}
      onEdit={onEdit}
      onDelete={onDelete}
      getName={c => c.name}
      getInvoiceCount={c => c.invoiceCount}
      getQuotesCount={c => c.quotesCount}
      getIsArchived={c => c.isArchived}
    />
  );
};
