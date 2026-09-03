import { useCallback } from 'react';
import { getApi } from '../../api/restApi';
import type { Layout, LayoutAdd } from '../../types/layouts';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import { useAsyncAction } from '../ayncAction/useAsyncAction';

interface UseLayoutAddParams extends RequestHook<Response<Layout>> {
  layout?: LayoutAdd;
}

export const useLayoutAdd = ({ layout, immediate = true, showLoader = true, onDone }: UseLayoutAddParams) => {
  const asyncFn = useCallback(() => {
    if (!layout) return Promise.resolve({ success: false });
    return getApi().addLayout(layout);
  }, [layout]);

  const { data, loading, execute } = useAsyncAction<Response<Layout>>(asyncFn, {
    immediate,
    showLoader,
    onDone
  });

  return { data: data?.data, loading, execute };
};
