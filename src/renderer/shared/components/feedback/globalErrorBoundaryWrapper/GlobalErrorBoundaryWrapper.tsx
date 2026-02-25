import { useEffect, type FC, type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast } from '../../../../state/pageSlice';

const ErrorFallback: FC<FallbackProps> = ({ error }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(addToast({ message: error instanceof Error ? error.message : 'An error occurred', severity: 'error' }));
  }, [dispatch, error]);

  return null;
};

export const GlobalErrorBoundaryWrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
);
