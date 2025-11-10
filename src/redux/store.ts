import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

import authReducer from "./slice/authSlice";
import clinicReducer from "./slice/clinicSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  clinic: clinicReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "clinic"], // ✅ Persist both slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
