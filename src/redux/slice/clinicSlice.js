// redux/slice/clinicSlice.js
// clinicSlice is now the single source of truth for clinic identity.
// authSlice retains clinicId only for selector convenience — 
// always prefer clinicSlice for UI rendering.
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  clinicId: null,
  clinicName: "",
  theme: "light",
  parentClinicId: null,
  isSubclinic: false,
  subclinics: [],
};

const clinicSlice = createSlice({
  name: "clinic",
  initialState,
  reducers: {
    setClinic: (state, action) => {
      state.clinicId = action.payload.id;
      state.clinicName = action.payload.name;
      state.parentClinicId = action.payload.parentClinicId || null;
      state.isSubclinic = !!action.payload.parentClinicId;
      state.theme = action.payload.theme || state.theme;
    },

    setClinicTheme: (state, action) => {
      state.theme = action.payload;
    },

    setSubclinics: (state, action) => {
      state.subclinics = action.payload;
    },

    addSubclinic: (state, action) => {
      state.subclinics.push(action.payload);
    },

    updateSubclinic: (state, action) => {
      const index = state.subclinics.findIndex(s => s._id === action.payload._id);
      if (index !== -1) {
        state.subclinics[index] = action.payload;
      }
    },

    removeSubclinic: (state, action) => {
      state.subclinics = state.subclinics.filter(s => s._id !== action.payload);
    },

    clearClinic: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setClinic,
  setClinicTheme,
  setSubclinics,
  addSubclinic,
  updateSubclinic,
  removeSubclinic,
  clearClinic,
} = clinicSlice.actions;

export default clinicSlice.reducer;