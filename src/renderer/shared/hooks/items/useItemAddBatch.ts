import { useCallback } from 'react';
import { useAppDispatch } from '../../../state/configureStore';
import { categoriesApi } from '../../api/categoriesApi';
import { getApi } from '../../api/restApi';
import { unitsApi } from '../../api/unitsApi';
import type { Item, ItemAdd } from '../../types/item';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import { useAsyncAction } from '../ayncAction/useAsyncAction';

interface UseItemAddParams extends RequestHook<Response<ItemAdd[]>> {
  items?: ItemAdd[];
}

export const useItemAddBatch = ({ items, immediate = true, showLoader = true, onDone }: UseItemAddParams) => {
  const dispatch = useAppDispatch();

  const asyncFn = useCallback(() => {
    if (!items) return Promise.resolve({ success: false });
    return getApi().addBatchItem(items);
  }, [items]);

  const { data, loading, execute } = useAsyncAction<Response<Item[]>>(asyncFn, {
    immediate,
    showLoader,
    onDone: (data: Response<Item[]>) => {
      // Batch item import can implicitly create new categories/units, so any active subscribers must refetch.
      dispatch(categoriesApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }]));
      dispatch(unitsApi.util.invalidateTags([{ type: 'Unit', id: 'LIST' }]));
      if (onDone) onDone(data);
    }
  });

  return { data, loading, execute };
};
