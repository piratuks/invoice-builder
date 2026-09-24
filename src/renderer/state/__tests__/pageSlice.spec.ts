import { AmountFormat } from '../../shared/enums/amountFormat';
import { DateFormat } from '../../shared/enums/dateFormat';
import { DeliveryProvider } from '../../shared/enums/deliveryProvider';
import { Language } from '../../shared/enums/language';
import type { Settings } from '../../shared/types/settings';
import {
  addToast,
  disableLoading,
  disableLoadingCursor,
  enableLoading,
  enableLoadingCursor,
  logout,
  pageReducer,
  removeToast,
  selectAllowed,
  selectBusinessesSnapshotsOptions,
  selectClientsSnapshotsOptions,
  selectDbReady,
  selectIsLoading,
  selectNewVersion,
  selectSettings,
  selectToasts,
  selectUpdateMessage,
  selectVersion,
  setAllowed,
  setBusinessSnapshotOptions,
  setClientSnapshotOptions,
  setCustomInvoiseSettings,
  setDbReady,
  setEInvoiceUBL,
  setEInvoiceXRechnung,
  setInvoiceSchedules,
  setLanguageDate,
  setMode,
  setNewVersion,
  setPresets,
  setQuotes,
  setReceiptPrintingOn,
  setReports,
  setSettings,
  setStyleProfiles,
  setUpdateMessage,
  setVersion
} from '../pageSlice';

const makeSettings = (overrides: Partial<Settings> = {}): Settings => ({
  id: 1,
  language: Language.en,
  amountFormat: AmountFormat.enUS,
  dateFormat: DateFormat.MMddyyyy,
  isDarkMode: false,
  shouldIncludeYear: true,
  shouldIncludeMonth: true,
  shouldIncludeBusinessName: true,
  quotesON: false,
  invoiceSchedulesON: false,
  deliveryProvider: DeliveryProvider.smtp,
  styleProfilesON: false,
  ublON: false,
  xrechnungON: false,
  presetsON: false,
  reportsON: false,
  receiptPrintingOn: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
  smtpSecure: overrides.smtpSecure ?? true
});

const initialState = pageReducer(undefined, { type: '@@INIT' });

describe('pageSlice reducer', () => {
  it('toggles the loading flag', () => {
    const loading = pageReducer(initialState, enableLoading());
    expect(loading.isLoading).toBe(true);
    expect(pageReducer(loading, disableLoading()).isLoading).toBe(false);
  });

  it('keeps the loading flag set while any concurrent loading source is still active', () => {
    let state = pageReducer(initialState, enableLoading());
    state = pageReducer(state, enableLoading());
    expect(state.isLoading).toBe(true);

    state = pageReducer(state, disableLoading());
    expect(state.isLoading).toBe(true);

    expect(pageReducer(state, disableLoading())).toMatchObject({ isLoading: false, loadingCount: 0 });
  });

  it('sets the document cursor for loading indicators', () => {
    pageReducer(initialState, enableLoadingCursor());
    expect(document.body.style.cursor).toBe('wait');

    pageReducer(initialState, disableLoadingCursor());
    expect(document.body.style.cursor).toBe('default');
  });

  it('keeps the cursor waiting while any concurrent loading source is still active', () => {
    let state = pageReducer(initialState, enableLoadingCursor());
    state = pageReducer(state, enableLoadingCursor());
    expect(document.body.style.cursor).toBe('wait');

    state = pageReducer(state, disableLoadingCursor());
    expect(document.body.style.cursor).toBe('wait');

    expect(pageReducer(state, disableLoadingCursor())).toMatchObject({ loadingCursorCount: 0 });
    expect(document.body.style.cursor).toBe('default');
  });

  it('never lets the cursor counter go negative on an unbalanced disable', () => {
    const state = pageReducer(initialState, disableLoadingCursor());
    expect(state.loadingCursorCount).toBe(0);
    expect(document.body.style.cursor).toBe('default');
  });

  it('sets version, newVersion and updateMessage', () => {
    let state = pageReducer(initialState, setVersion('1.2.3'));
    expect(state.version).toBe('1.2.3');

    state = pageReducer(state, setNewVersion('1.3.0'));
    expect(state.newVersion).toBe('1.3.0');

    state = pageReducer(state, setUpdateMessage('Update available'));
    expect(state.updateMessage).toBe('Update available');

    state = pageReducer(state, setNewVersion(undefined));
    expect(state.newVersion).toBeUndefined();
  });

  it('sets allowed-to-leave and db-ready flags', () => {
    let state = pageReducer(initialState, setAllowed(false));
    expect(state.isAllowedToLeave).toBe(false);

    state = pageReducer(state, setDbReady(true));
    expect(state.dbReady).toBe(true);
  });

  it('adds and removes toasts, assigning a generated id', () => {
    const withToast = pageReducer(initialState, addToast({ message: 'Saved', type: 'success' } as never));
    expect(withToast.toasts).toHaveLength(1);
    const toastId = withToast.toasts[0].id;
    expect(toastId).toBeTruthy();
    expect(withToast.toasts[0].message).toBe('Saved');

    const withoutToast = pageReducer(withToast, removeToast(toastId));
    expect(withoutToast.toasts).toHaveLength(0);
  });

  it('resets db/session state on logout', () => {
    const populated = {
      ...initialState,
      dbReady: true,
      settings: makeSettings(),
      clientSnapshotOptions: [{ label: 'C', value: 'c' }],
      businessSnapshotOptions: [{ label: 'D', value: 'd' }]
    };

    const result = pageReducer(populated, logout());
    expect(result.dbReady).toBe(false);
    expect(result.settings).toBeUndefined();
    expect(result.clientSnapshotOptions).toEqual([]);
    expect(result.businessSnapshotOptions).toEqual([]);
  });

  it('clears any stuck loading counters and cursor on logout', () => {
    let state = pageReducer(initialState, enableLoading());
    state = pageReducer(state, enableLoadingCursor());
    expect(state.isLoading).toBe(true);
    expect(document.body.style.cursor).toBe('wait');

    const result = pageReducer(state, logout());
    expect(result.isLoading).toBe(false);
    expect(result.loadingCount).toBe(0);
    expect(result.loadingCursorCount).toBe(0);
    expect(document.body.style.cursor).toBe('default');
  });

  it('sets client/business options', () => {
    let state = pageReducer(initialState, setClientSnapshotOptions([{ label: 'Client', value: 'c1' }]));
    expect(state.clientSnapshotOptions).toEqual([{ label: 'Client', value: 'c1' }]);

    state = pageReducer(state, setBusinessSnapshotOptions([{ label: 'Biz', value: 'b1' }]));
    expect(state.businessSnapshotOptions).toEqual([{ label: 'Biz', value: 'b1' }]);
  });

  describe('settings-dependent reducers', () => {
    it('are no-ops when settings are not loaded yet', () => {
      expect(pageReducer(initialState, setMode(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setPresets(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setStyleProfiles(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setEInvoiceUBL(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setEInvoiceXRechnung(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setInvoiceSchedules(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setQuotes(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setReceiptPrintingOn(true)).settings).toBeUndefined();
      expect(pageReducer(initialState, setReports(true)).settings).toBeUndefined();
      expect(
        pageReducer(
          initialState,
          setCustomInvoiseSettings({
            shouldIncludeMonth: true,
            shouldIncludeYear: true,
            shouldIncludeBusinessName: true
          })
        ).settings
      ).toBeUndefined();
      expect(
        pageReducer(
          initialState,
          setLanguageDate({ language: Language.fr, amountFormat: AmountFormat.enUS, dateFormat: DateFormat.MMddyyyy })
        ).settings
      ).toBeUndefined();
    });

    it('toggle individual settings flags once settings are loaded', () => {
      const withSettings = pageReducer(initialState, setSettings(makeSettings()));
      expect(withSettings.settings).toEqual(makeSettings());

      expect(pageReducer(withSettings, setMode(true)).settings?.isDarkMode).toBe(true);
      expect(pageReducer(withSettings, setPresets(true)).settings?.presetsON).toBe(true);
      expect(pageReducer(withSettings, setStyleProfiles(true)).settings?.styleProfilesON).toBe(true);
      expect(pageReducer(withSettings, setEInvoiceUBL(true)).settings?.ublON).toBe(true);
      expect(pageReducer(withSettings, setEInvoiceXRechnung(true)).settings?.xrechnungON).toBe(true);
      expect(pageReducer(withSettings, setInvoiceSchedules(true)).settings?.invoiceSchedulesON).toBe(true);
      expect(pageReducer(withSettings, setQuotes(true)).settings?.quotesON).toBe(true);
      expect(pageReducer(withSettings, setReceiptPrintingOn(true)).settings?.receiptPrintingOn).toBe(true);
      expect(pageReducer(withSettings, setReports(true)).settings?.reportsON).toBe(true);
    });

    it('updates custom invoice numbering settings', () => {
      const withSettings = pageReducer(initialState, setSettings(makeSettings()));
      const updated = pageReducer(
        withSettings,
        setCustomInvoiseSettings({
          invoicePrefix: 'INV-',
          invoiceSuffix: '-A',
          shouldIncludeMonth: false,
          shouldIncludeYear: false,
          shouldIncludeBusinessName: false
        })
      );
      expect(updated.settings).toMatchObject({
        invoicePrefix: 'INV-',
        invoiceSuffix: '-A',
        shouldIncludeMonth: false,
        shouldIncludeYear: false,
        shouldIncludeBusinessName: false
      });
    });

    it('updates language/date/amount format settings', () => {
      const withSettings = pageReducer(initialState, setSettings(makeSettings()));
      const updated = pageReducer(
        withSettings,
        setLanguageDate({
          language: Language.de,
          amountFormat: AmountFormat.deDE,
          dateFormat: DateFormat.ddMMyyyy
        })
      );
      expect(updated.settings).toMatchObject({
        language: Language.de,
        amountFormat: AmountFormat.deDE,
        dateFormat: DateFormat.ddMMyyyy
      });
    });
  });
});

describe('pageSlice selectors', () => {
  const buildRootState = (overrides: Partial<ReturnType<typeof pageReducer>> = {}) =>
    ({
      pageSlice: { ...initialState, ...overrides }
    }) as never;

  it('selects primitive and collection fields', () => {
    const rootState = buildRootState({
      isLoading: true,
      toasts: [{ id: '1', message: 'hi', type: 'info' } as never],
      dbReady: true,
      version: '1.0.0',
      newVersion: '1.1.0',
      updateMessage: 'msg',
      isAllowedToLeave: false,
      clientSnapshotOptions: [{ label: 'c', value: 'c' }],
      businessSnapshotOptions: [{ label: 'd', value: 'd' }],
      settings: makeSettings()
    });

    expect(selectIsLoading(rootState)).toBe(true);
    expect(selectToasts(rootState)).toHaveLength(1);
    expect(selectDbReady(rootState)).toBe(true);
    expect(selectVersion(rootState)).toBe('1.0.0');
    expect(selectNewVersion(rootState)).toBe('1.1.0');
    expect(selectUpdateMessage(rootState)).toBe('msg');
    expect(selectAllowed(rootState)).toBe(false);
    expect(selectClientsSnapshotsOptions(rootState)).toEqual([{ label: 'c', value: 'c' }]);
    expect(selectBusinessesSnapshotsOptions(rootState)).toEqual([{ label: 'd', value: 'd' }]);
    expect(selectSettings(rootState)).toEqual(makeSettings());
  });

  it('falls back to empty arrays when option lists are undefined', () => {
    const rootState = buildRootState({
      clientSnapshotOptions: undefined as never,
      businessSnapshotOptions: undefined as never
    });

    expect(selectClientsSnapshotsOptions(rootState)).toEqual([]);
    expect(selectBusinessesSnapshotsOptions(rootState)).toEqual([]);
  });
});
