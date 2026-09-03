import { useCallback } from 'react';
import { getApi } from '../../api/restApi';
import type { Layout, LayoutUpdate } from '../../types/layouts';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import { useAsyncAction } from '../ayncAction/useAsyncAction';

interface UseLayoutUpdateParams extends RequestHook<Response<Layout>> {
  layout?: LayoutUpdate;
}

export const useLayoutUpdate = ({ layout, immediate = true, showLoader = true, onDone }: UseLayoutUpdateParams) => {
  const asyncFn = useCallback(async (): Promise<Response<Layout>> => {
    if (!layout) return Promise.resolve({ success: false });
    return getApi().updateLayout(layout);
  }, [layout]);

  const { data, loading, execute } = useAsyncAction<Response<Layout>>(asyncFn, {
    immediate,
    showLoader,
    onDone
  });

  return { data, loading, execute };
};
