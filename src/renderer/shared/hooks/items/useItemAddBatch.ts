import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { useAppDispatch } from '../../../state/configureStore';
import { addToast } from '../../../state/pageSlice';
import { categoriesApi } from '../../api/categoriesApi';
import { getApi } from '../../api/restApi';
import type { Item, ItemAdd } from '../../types/item';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import type { Unit } from '../../types/unit';
import { useAsyncAction } from '../ayncAction/useAsyncAction';
import { useUnitsRetrieve } from '../units/useUnitsRetrieve';

interface UseItemAddParams extends RequestHook<Response<ItemAdd[]>> {
  items?: ItemAdd[];
}

export const useItemAddBatch = ({ items, immediate = true, showLoader = true, onDone }: UseItemAddParams) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { execute: reloadUnits } = useUnitsRetrieve({
    immediate: false,
    onDone: (data: Response<Unit[]>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const asyncFn = useCallback(() => {
    if (!items) return Promise.resolve({ success: false });
    return getApi().addBatchItem(items);
  }, [items]);

  const { data, loading, execute } = useAsyncAction<Response<Item[]>>(asyncFn, {
    immediate,
    showLoader,
    onDone: (data: Response<Item[]>) => {
      // Batch item import can implicitly create new categories, so any active category subscribers must refetch.
      dispatch(categoriesApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }]));
      reloadUnits();
      if (onDone) onDone(data);
    }
  });

  return { data, loading, execute };
};
