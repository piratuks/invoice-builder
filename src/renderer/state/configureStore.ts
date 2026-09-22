import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { banksApi } from '../shared/api/banksApi';
import { businessesApi } from '../shared/api/businessesApi';
import { pageSlice } from './pageSlice';

// Entity payloads carry binary fields (logos, QR codes, signatures, watermarks) as Uint8Array,
// which RTK's default serializableCheck flags even though it's fine to store in Redux.
const isSerializableValue = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return true;
  if (value instanceof Uint8Array || Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

export const store = configureStore({
  reducer: {
    [pageSlice.name]: pageSlice.reducer,
    [businessesApi.reducerPath]: businessesApi.reducer,
    [banksApi.reducerPath]: banksApi.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: { isSerializable: isSerializableValue }
    }).concat(businessesApi.middleware, banksApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

setupListeners(store.dispatch);
