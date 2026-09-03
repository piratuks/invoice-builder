import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import { useExportLayout } from '../../shared/hooks/layouts/useLayoutExport';
import type { Layout } from '../../shared/types/layouts';

export const List = ({
  item,
  selectedItem,
  onEdit,
  onDelete
}: {
  item: Layout;
  selectedItem?: Layout;
  onEdit: (item: Layout) => void;
  onDelete: (id: number) => void;
}) => {
  const { execute: exportLayout } = useExportLayout({ id: item.id, immediate: false });

  return (
    <GenericList
      item={item}
      selectedItem={selectedItem}
      onEdit={onEdit}
      onDelete={onDelete}
      onExport={exportLayout}
      getName={layout => layout.schema.meta.name}
      getInvoiceCount={layout => layout.invoiceCount}
      getQuotesCount={layout => layout.quotesCount}
      getIsArchived={layout => layout.isArchived}
    />
  );
};
