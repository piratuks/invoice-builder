import { type FC } from 'react';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Currency } from '@invoice-builder/contracts';

interface Props {
  item: Currency;
  selectedItem?: Currency;
  showDeleteButton?: boolean;
  onEdit?: (item: Currency) => void;
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
      getName={c => c.text}
      getAdditional={c => `${c.code} / ${c.symbol}`}
      getInvoiceCount={c => c.invoiceCount}
      getQuotesCount={c => c.quotesCount}
      getIsArchived={c => c.isArchived}
    />
  );
};
