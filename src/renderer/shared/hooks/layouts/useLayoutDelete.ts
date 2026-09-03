import { useCallback } from 'react';
import { getApi } from '../../api/restApi';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import { useAsyncAction } from '../ayncAction/useAsyncAction';

interface UseLayoutDeleteParams extends RequestHook<Response<unknown>> {
  id: number;
}

export const useLayoutDelete = ({ id, immediate = true, showLoader = true, onDone }: UseLayoutDeleteParams) => {
  const asyncFn = useCallback(() => getApi().deleteLayout(id), [id]);
  const { data, loading, execute } = useAsyncAction<Response<unknown>>(asyncFn, {
    immediate,
    showLoader,
    onDone
  });

  return { data, loading, execute };
};
