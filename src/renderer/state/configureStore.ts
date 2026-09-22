import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { businessesApi } from '../shared/api/businessesApi';
import { pageSlice } from './pageSlice';

export const store = configureStore({
  reducer: {
    [pageSlice.name]: pageSlice.reducer,
    [businessesApi.reducerPath]: businessesApi.reducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(businessesApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

setupListeners(store.dispatch);
