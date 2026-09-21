import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../i18n';
import { Language } from '../../../enums/language';
import { usePdfTexts } from '../usePdfTexts';
import { useUppercaseTranslation } from '../useUppercaseTranslation';

const wrapper = ({ children }: { children: ReactNode }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

describe('useUppercaseTranslation', () => {
  it('returns lowercase/normal-case translations when not enabled', () => {
    const { result } = renderHook(() => useUppercaseTranslation(false, Language.en), { wrapper });
    expect(result.current.tt('common.date')).toBe(i18n.t('common.date', { lng: 'en' }));
  });

  it('uppercases the translation when enabled', () => {
    const { result } = renderHook(() => useUppercaseTranslation(true, Language.en), { wrapper });
    const expected = i18n.t('common.date', { lng: 'en' }).toLocaleUpperCase('en');
    expect(result.current.tt('common.date')).toBe(expected);
  });

  it('falls back to the current i18n language when none is specified', () => {
    const { result } = renderHook(() => useUppercaseTranslation(false, undefined), { wrapper });
    expect(result.current.tt('common.date')).toBe(i18n.t('common.date', { lng: i18n.language }));
  });
});

describe('usePdfTexts', () => {
  it('builds a full set of pdf text labels', () => {
    const { result } = renderHook(() => usePdfTexts({ labelUpperCase: false, language: Language.en }), { wrapper });
    expect(result.current.billTo).toBe(i18n.t('invoices.billTo', { lng: 'en' }));
    expect(result.current.totalLabel).toBe(i18n.t('common.total', { lng: 'en' }));
  });

  it('uppercases labels when labelUpperCase is true', () => {
    const { result } = renderHook(() => usePdfTexts({ labelUpperCase: true, language: Language.en }), { wrapper });
    expect(result.current.billTo).toBe(i18n.t('invoices.billTo', { lng: 'en' }).toLocaleUpperCase('en'));
  });

  it('works without any data argument', () => {
    const { result } = renderHook(() => usePdfTexts(), { wrapper });
    expect(result.current.billTo).toBeTruthy();
  });
});
