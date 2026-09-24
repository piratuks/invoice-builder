import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { AmountFormat } from '../shared/enums/amountFormat';
import type { DateFormat } from '../shared/enums/dateFormat';
import type { Language } from '../shared/enums/language';
import type { PageState } from '../shared/types/pageState';
import type { Settings } from '../shared/types/settings';
import type { ToastProps } from '../shared/types/toastProps';
import type { RootState } from './configureStore';

const initialState: PageState = {
  isLoading: false,
  loadingCount: 0,
  loadingCursorCount: 0,
  dbReady: false,
  toasts: [],
  settings: undefined,
  clientSnapshotOptions: [],
  businessSnapshotOptions: [],
  version: undefined,
  updateMessage: undefined,
  newVersion: undefined,
  isAllowedToLeave: true
};

export const pageSlice = createSlice({
  name: 'pageSlice',
  initialState,
  reducers: {
    // Reference-counted so concurrent loading sources don't clear the cursor while another is still busy.
    enableLoadingCursor: state => {
      state.loadingCursorCount += 1;
      document.body.style.cursor = 'wait';
    },
    disableLoadingCursor: state => {
      state.loadingCursorCount = Math.max(0, state.loadingCursorCount - 1);
      if (state.loadingCursorCount === 0) document.body.style.cursor = 'default';
    },
    enableLoading: state => {
      state.loadingCount += 1;
      state.isLoading = true;
    },
    disableLoading: state => {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
      state.isLoading = state.loadingCount > 0;
    },
    setVersion: (state, action: PayloadAction<string>) => {
      state.version = action.payload;
    },
    setNewVersion: (state, action: PayloadAction<string | undefined>) => {
      state.newVersion = action.payload;
    },
    setAllowed: (state, action: PayloadAction<boolean>) => {
      state.isAllowedToLeave = action.payload;
    },
    setDbReady: (state, action: PayloadAction<boolean>) => {
      state.dbReady = action.payload;
    },
    logout: state => {
      state.dbReady = false;
      state.settings = undefined;
      state.clientSnapshotOptions = [];
      state.businessSnapshotOptions = [];
      // Logout is a hard reset boundary: any stuck/mis-tracked in-flight counter shouldn't survive it.
      state.isLoading = false;
      state.loadingCount = 0;
      state.loadingCursorCount = 0;
      document.body.style.cursor = 'default';
    },
    setUpdateMessage: (state, action: PayloadAction<string | undefined>) => {
      state.updateMessage = action.payload;
    },
    addToast: (state, action: PayloadAction<ToastProps>) => {
      state.toasts.push({
        ...action.payload,
        id: uuidv4()
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    setSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
    },
    setClientSnapshotOptions: (state, action: PayloadAction<Array<{ label: string; value: string }>>) => {
      state.clientSnapshotOptions = action.payload;
    },
    setBusinessSnapshotOptions: (state, action: PayloadAction<Array<{ label: string; value: string }>>) => {
      state.businessSnapshotOptions = action.payload;
    },
    setMode: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        isDarkMode: action.payload
      };
    },
    setPresets: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        presetsON: action.payload
      };
    },
    setStyleProfiles: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        styleProfilesON: action.payload
      };
    },
    setEInvoiceUBL: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        ublON: action.payload
      };
    },
    setEInvoiceXRechnung: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        xrechnungON: action.payload
      };
    },
    setQuotes: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        quotesON: action.payload
      };
    },
    setInvoiceSchedules: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        invoiceSchedulesON: action.payload
      };
    },
    setReceiptPrintingOn: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        receiptPrintingOn: action.payload
      };
    },
    setSmtpSettings: (
      state,
      action: PayloadAction<{
        smtpHost?: string;
        smtpPort?: number;
        smtpSecure: boolean;
        smtpUser?: string;
        smtpFromEmail?: string;
        smtpFromName?: string;
        deliveryProvider?: Settings['deliveryProvider'];
      }>
    ) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },
    setReports: (state, action: PayloadAction<boolean>) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        reportsON: action.payload
      };
    },
    setCustomInvoiseSettings: (
      state,
      action: PayloadAction<{
        invoiceSuffix?: string;
        invoicePrefix?: string;
        shouldIncludeMonth: boolean;
        shouldIncludeYear: boolean;
        shouldIncludeBusinessName: boolean;
      }>
    ) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        invoicePrefix: action.payload.invoicePrefix,
        invoiceSuffix: action.payload.invoiceSuffix,
        shouldIncludeMonth: action.payload.shouldIncludeMonth,
        shouldIncludeYear: action.payload.shouldIncludeYear,
        shouldIncludeBusinessName: action.payload.shouldIncludeBusinessName
      };
    },
    setLanguageDate: (
      state,
      action: PayloadAction<{
        language: Language;
        amountFormat: AmountFormat;
        dateFormat: DateFormat;
      }>
    ) => {
      if (!state.settings) return;
      state.settings = {
        ...state.settings,
        language: action.payload.language,
        amountFormat: action.payload.amountFormat,
        dateFormat: action.payload.dateFormat
      };
    }
  }
});

export const selectState = (state: RootState) => state.pageSlice;
export const selectIsLoading = createSelector(selectState, state => state.isLoading);
export const selectToasts = createSelector(selectState, state => state.toasts);
export const selectSettings = createSelector(selectState, state => state.settings);
export const selectClientsSnapshotsOptions = createSelector(selectState, state => state.clientSnapshotOptions ?? []);
export const selectBusinessesSnapshotsOptions = createSelector(
  selectState,
  state => state.businessSnapshotOptions ?? []
);
export const selectVersion = createSelector(selectState, state => state.version);
export const selectNewVersion = createSelector(selectState, state => state.newVersion);
export const selectUpdateMessage = createSelector(selectState, state => state.updateMessage);
export const selectAllowed = createSelector(selectState, state => state.isAllowedToLeave);
export const selectDbReady = createSelector(selectState, state => state.dbReady);

export const {
  enableLoading,
  enableLoadingCursor,
  disableLoadingCursor,
  disableLoading,
  addToast,
  removeToast,
  setSettings,
  setMode,
  setQuotes,
  setInvoiceSchedules,
  setReports,
  setStyleProfiles,
  setEInvoiceUBL,
  setEInvoiceXRechnung,
  setPresets,
  setVersion,
  setNewVersion,
  setUpdateMessage,
  setCustomInvoiseSettings,
  setLanguageDate,
  setBusinessSnapshotOptions,
  setClientSnapshotOptions,
  setAllowed,
  setReceiptPrintingOn,
  setSmtpSettings,
  setDbReady,
  logout
} = pageSlice.actions;

export const pageReducer = pageSlice.reducer;
