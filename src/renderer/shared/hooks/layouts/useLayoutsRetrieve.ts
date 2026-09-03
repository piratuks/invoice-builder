import { useCallback } from 'react';
import { getApi } from '../../api/restApi';
import type { Layout } from '../../types/layouts';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import { useAsyncAction } from '../ayncAction/useAsyncAction';

export const useLayoutsRetrieve = ({
  immediate = true,
  showLoader = true,
  filter,
  onDone
}: RequestHook<Response<Layout[]>>) => {
  const asyncFn = useCallback(() => getApi().getAllLayouts(filter), [filter]);
  const { data: layouts, execute } = useAsyncAction<Response<Layout[]>>(asyncFn, {
    showLoader,
    immediate,
    onDone
  });

  return { layouts: layouts?.data ?? [], execute };
};
