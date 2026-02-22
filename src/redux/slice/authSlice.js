// redux/slice/authSlice.js - UPDATE THIS

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  clinicId: null,
  doctorId: null,           // 👈 NEW
  userRole: null,           // 👈 NEW
  isHybrid: false,          // 👈 NEW
  activeMode: 'clinic',      // 👈 NEW: 'clinic' or 'doctor'
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token, role, clinicId, doctorId, isHybrid } = action.payload;
      
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.userRole = role;
      state.clinicId = clinicId || user?.id || null;
      state.doctorId = doctorId || user?.doctorId || null;
      state.isHybrid = isHybrid || false;
      
      // Set initial mode based on user type
      if (isHybrid) {
        state.activeMode = 'clinic'; // Default to clinic mode for hybrid users
      } else if (role === '600' || role === '456') {
        state.activeMode = 'doctor';
      } else {
        state.activeMode = 'clinic';
      }
    },
    
    // 👈 NEW: Toggle between clinic and doctor mode
    toggleUserMode: (state) => {
      if (state.isHybrid) {
        state.activeMode = state.activeMode === 'clinic' ? 'doctor' : 'clinic';
      }
    },
    
    // 👈 NEW: Set mode explicitly
    setUserMode: (state, action) => {
      if (state.isHybrid && (action.payload === 'clinic' || action.payload === 'doctor')) {
        state.activeMode = action.payload;
      }
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.clinicId = null;
      state.doctorId = null;
      state.userRole = null;
      state.isHybrid = false;
      state.activeMode = 'clinic';
    },
  },
});

export const { loginSuccess, logout, toggleUserMode, setUserMode } = authSlice.actions;
export default authSlice.reducer;