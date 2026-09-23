import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { banksApi } from '../shared/api/banksApi';
import { businessesApi } from '../shared/api/businessesApi';
import { categoriesApi } from '../shared/api/categoriesApi';
import { clientsApi } from '../shared/api/clientsApi';
import { currenciesApi } from '../shared/api/currenciesApi';
import { itemsApi } from '../shared/api/itemsApi';
import { layoutsApi } from '../shared/api/layoutsApi';
import { presetsApi } from '../shared/api/presetsApi';
import { settingsApi } from '../shared/api/settingsApi';
import { styleProfilesApi } from '../shared/api/styleProfilesApi';
import { unitsApi } from '../shared/api/unitsApi';
import { pageSlice } from './pageSlice';

// Entity payloads carry binary fields (logos, QR codes, signatures, watermarks) as Uint8Array,
// which RTK's default serializableCheck flags even though it's fine to store in Redux.
const isSerializableValue = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return true;
  if (value instanceof Uint8Array || Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

// RTK Query caches (layout schemas, invoice snapshots, binary blobs) are large enough that
// recursively walking them on every action makes serializableCheck itself the bottleneck.
// This data only ever comes from our own baseQueries, so it's safe to skip the deep walk here.
const apiReducerPaths = [
  businessesApi.reducerPath,
  banksApi.reducerPath,
  categoriesApi.reducerPath,
  clientsApi.reducerPath,
  currenciesApi.reducerPath,
  unitsApi.reducerPath,
  styleProfilesApi.reducerPath,
  presetsApi.reducerPath,
  layoutsApi.reducerPath,
  itemsApi.reducerPath,
  settingsApi.reducerPath
];
const ignoredApiStatePaths = apiReducerPaths.map(path => new RegExp(`^${path}\\.`));

export const store = configureStore({
  reducer: {
    [pageSlice.name]: pageSlice.reducer,
    [businessesApi.reducerPath]: businessesApi.reducer,
    [banksApi.reducerPath]: banksApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [currenciesApi.reducerPath]: currenciesApi.reducer,
    [unitsApi.reducerPath]: unitsApi.reducer,
    [styleProfilesApi.reducerPath]: styleProfilesApi.reducer,
    [presetsApi.reducerPath]: presetsApi.reducer,
    [layoutsApi.reducerPath]: layoutsApi.reducer,
    [itemsApi.reducerPath]: itemsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable: isSerializableValue,
        ignoredPaths: ignoredApiStatePaths,
        ignoredActionPaths: ['payload', 'meta.baseQueryMeta']
      }
    }).concat(
      businessesApi.middleware,
      banksApi.middleware,
      categoriesApi.middleware,
      clientsApi.middleware,
      currenciesApi.middleware,
      unitsApi.middleware,
      styleProfilesApi.middleware,
      presetsApi.middleware,
      layoutsApi.middleware,
      itemsApi.middleware,
      settingsApi.middleware
    )
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

setupListeners(store.dispatch);
