import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  clinicId: null,
  clinicName: "",
  theme: "light",
};

const clinicSlice = createSlice({
  name: "clinic",
  initialState,
  reducers: {
    setClinic: (state, action) => {
      state.clinicId = action.payload.id;
      state.clinicName = action.payload.name;
    },
    setClinicTheme: (state, action) => {
      state.theme = action.payload;
    },
    clearClinic: (state) => {
      state.clinicId = null;
      state.clinicName = "";
      state.theme = "light";
    },
  },
});

export const { setClinic, setClinicTheme, clearClinic } = clinicSlice.actions;
export default clinicSlice.reducer;
