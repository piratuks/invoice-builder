import { type FC } from 'react';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Bank } from '@invoice-builder/contracts';

interface Props {
  item: Bank;
  selectedItem?: Bank;
  showDeleteButton?: boolean;
  onEdit?: (item: Bank) => void;
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
      selectedItem={selectedItem}
      showDeleteButton={showDeleteButton}
      onEdit={onEdit}
      onDelete={onDelete}
      getName={c => c.name}
      getAdditional={c => c.bankName}
      getInvoiceCount={c => c.invoiceCount}
      getQuotesCount={c => c.quotesCount}
      getIsArchived={c => c.isArchived}
    />
  );
};
