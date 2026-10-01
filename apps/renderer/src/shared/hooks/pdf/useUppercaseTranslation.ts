import type { Language } from '@invoice-builder/contracts';
import type { TOptions } from 'i18next';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useUppercaseTranslation = (enabled?: boolean, language?: Language) => {
  const { t, i18n } = useTranslation();

  const tt = useCallback(
    (key: string, options?: TOptions) => {
      const text = t(key, {
        ...options,
        lng: language ?? i18n.language
      });
      return enabled ? text.toLocaleUpperCase(i18n.language) : text;
    },
    [enabled, i18n.language, language, t]
  );

  return { tt };
};
