import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Reducers
import uiReducer from "./slices/uiSlice";
import multiAgentReducer from "./slices/multiAgentSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    multiAgent: multiAgentReducer,
  },
  // API çağrıları için middleware eklenebilir
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// RTK Query için middleware eklenebilir
setupListeners(store.dispatch);

// RootState ve AppDispatch tip tanımları
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
