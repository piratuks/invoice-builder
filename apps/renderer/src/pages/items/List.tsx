import { type FC } from 'react';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Item } from '@invoice-builder/contracts';
import { formatAmount } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface Props {
  item: Item;
  selectedItem?: Item;
  showDeleteButton?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (id: number) => void;
}
export const List: FC<Props> = ({
  item,
  selectedItem,
  onEdit = () => {},
  onDelete = () => {},
  showDeleteButton = true
}) => {
  const settings = useAppSelector(selectSettings);
  return (
    <GenericList
      item={item}
      selectedItem={selectedItem}
      showDeleteButton={showDeleteButton}
      onEdit={onEdit}
      onDelete={onDelete}
      getName={c => c.name}
      getAdditional={c => `${formatAmount(Number(c.amount ?? 0), settings?.amountFormat)}`}
      getInvoiceCount={c => c.invoiceCount}
      getQuotesCount={c => c.quotesCount}
      getIsArchived={c => c.isArchived}
    />
  );
};
