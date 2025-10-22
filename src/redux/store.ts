import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice.js";
import clinicReducer from "./slice/clinicSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clinic: clinicReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;