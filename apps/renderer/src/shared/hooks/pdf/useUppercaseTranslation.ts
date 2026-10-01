import type { TOptions } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { Language } from '@invoice-builder/contracts';

export const useUppercaseTranslation = (enabled?: boolean, language?: Language) => {
  const { t, i18n } = useTranslation();

  const tt = (key: string, options?: TOptions) => {
    const text = t(key, {
      ...options,
      lng: language ?? i18n.language
    });
    return enabled ? text.toLocaleUpperCase(i18n.language) : text;
  };

  return { tt };
};
