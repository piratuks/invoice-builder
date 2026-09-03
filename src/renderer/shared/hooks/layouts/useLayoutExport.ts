import { useCallback } from 'react';
import { getApi } from '../../api/restApi';
import type { ExportMeta } from '../../types/exportMeta';
import type { RequestHook } from '../../types/requestHook';
import type { Response } from '../../types/response';
import { useAsyncAction } from '../ayncAction/useAsyncAction';

export const useExportLayout = ({
  id,
  showLoader = true,
  immediate = true,
  onDone
}: RequestHook<Response<ExportMeta>> & { id?: number }) => {
  const asyncFn = useCallback(
    () => (id === undefined ? Promise.resolve({ success: false }) : getApi().exportLayout(id)),
    [id]
  );
  const { data, execute } = useAsyncAction<Response<ExportMeta>>(asyncFn, { showLoader, immediate, onDone });

  return { data, execute };
};
