import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useExportLayoutMutation } from '../../shared/api/layoutsApi';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Layout } from '../../shared/types/layouts';
import { useAppDispatch } from '../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor } from '../../state/pageSlice';

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
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [exportLayoutTrigger, { isLoading: isExporting }] = useExportLayoutMutation();

  useEffect(() => {
    if (!isExporting) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [isExporting, dispatch]);

  const exportLayout = async () => {
    const result = await exportLayoutTrigger(item.id);
    if ('error' in result && result.error) {
      const { message, key } = (result.error as { message?: string; key?: string }) ?? {};
      if (message) {
        dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
      } else if (key) {
        dispatch(addToast({ message: t(key), severity: 'error' }));
      }
    }
  };

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
