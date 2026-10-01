import { type Api, webApi } from './platformApi';

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

export const getApi = (): Api => {
  if (!isWebMode()) {
    return window.electronAPI as Api;
  }
  return webApi();
};

export const isWebMode = () => !(isElectron && window.electronAPI);
