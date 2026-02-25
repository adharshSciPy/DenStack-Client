// redux/slice/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  clinicId: null,
  doctorId: null,
  userRole: null,
  isHybrid: false,
  activeMode: 'clinic',
  isSubclinic: false,
  parentClinicId: null,
  subclinicHierarchy: [], // Now stores { clinicId, parentClinicId } objects
  lastAccessedAt: null,
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
      state.lastAccessedAt = new Date().toISOString();
      state.isSubclinic = false;
      state.parentClinicId = null;
      state.subclinicHierarchy = [];

      if (isHybrid) {
        state.activeMode = 'clinic';
      } else if (role === '600' || role === '456') {
        state.activeMode = 'doctor';
      } else {
        state.activeMode = 'clinic';
      }
    },

switchToSubclinic: (state, action) => {
  const { subclinicId, parentClinicId, subclinicName } = action.payload;

  // Guard against stale persisted state
  if (!Array.isArray(state.subclinicHierarchy)) {
    state.subclinicHierarchy = [];
  }

  state.subclinicHierarchy.push({
    clinicId: state.clinicId,
    parentClinicId: state.parentClinicId,
  });

  state.parentClinicId = parentClinicId;
  state.clinicId = subclinicId;
  state.isSubclinic = true;
  state.activeMode = 'clinic';
  state.lastAccessedAt = new Date().toISOString();
},
    switchToParentClinic: (state) => {
      if (state.isSubclinic && state.parentClinicId) {
        state.clinicId = state.parentClinicId;
        state.isSubclinic = false;
        state.parentClinicId = null;
        state.subclinicHierarchy = [];
        state.lastAccessedAt = new Date().toISOString();
      }
    },

    // Fixed: properly restores parentClinicId at each level
    navigateBackInHierarchy: (state) => {
      if (state.subclinicHierarchy.length > 0) {
        const previous = state.subclinicHierarchy.pop();
        state.clinicId = previous.clinicId;
        state.parentClinicId = previous.parentClinicId;

        if (state.subclinicHierarchy.length === 0) {
          state.isSubclinic = false;
          state.parentClinicId = null;
        } else {
          state.isSubclinic = true;
        }

        state.lastAccessedAt = new Date().toISOString();
      }
    },

    toggleUserMode: (state) => {
      if (state.isHybrid) {
        state.activeMode = state.activeMode === 'clinic' ? 'doctor' : 'clinic';
      }
    },

    setUserMode: (state, action) => {
      if (state.isHybrid && (action.payload === 'clinic' || action.payload === 'doctor')) {
        state.activeMode = action.payload;
      }
    },

    refreshToken: (state, action) => {
      state.token = action.payload.token;
      state.lastAccessedAt = new Date().toISOString();
    },

    logout: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  loginSuccess,
  logout,
  toggleUserMode,
  setUserMode,
  switchToSubclinic,
  switchToParentClinic,
  navigateBackInHierarchy,
  refreshToken,
} = authSlice.actions;

export default authSlice.reducer;