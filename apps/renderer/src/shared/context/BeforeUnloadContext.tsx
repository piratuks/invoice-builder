import { createContext, useContext } from 'react';

type BeforeUnloadContextType = {
  attemptNavigation?: (action: () => void) => void;
  setBlocked?: (v: boolean) => void;
};

const BeforeUnloadContext = createContext<BeforeUnloadContextType>({});

export const BeforeUnloadProvider = BeforeUnloadContext.Provider;

export const useBeforeUnloadContext = () => useContext(BeforeUnloadContext);
