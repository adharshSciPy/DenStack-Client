// hooks/useAuth.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hook';
import {
  switchToSubclinic,
  switchToParentClinic,
  navigateBackInHierarchy,
  logout,
  refreshToken,
  toggleUserMode,
  setUserMode,
} from '../redux/slice/authSlice';
import { clearClinic, setClinic } from '../redux/slice/clinicSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const clinic = useAppSelector((state) => state.clinic);

  const handleSwitchToSubclinic = useCallback((subclinicId, parentClinicId, subclinicName, theme = 'green') => {
    if (!subclinicId || !parentClinicId) {
      console.error('handleSwitchToSubclinic: missing required IDs');
      return;
    }

    dispatch(switchToSubclinic({ subclinicId, parentClinicId, subclinicName }));
    dispatch(setClinic({
      id: subclinicId,
      name: subclinicName,
      parentClinicId,
      theme,
    }));
  }, [dispatch]);

  const handleSwitchToParent = useCallback(() => {
    if (!auth.parentClinicId) {
      console.warn('handleSwitchToParent: no parentClinicId available');
      return;
    }

    dispatch(switchToParentClinic());
    dispatch(setClinic({
      id: auth.parentClinicId,
      name: auth.user?.clinicName || 'Parent Clinic',
      parentClinicId: null,
    }));
  }, [dispatch, auth.parentClinicId, auth.user]);

const handleNavigateBack = useCallback(() => {
  const hierarchy = auth.subclinicHierarchy ?? [];
  if (hierarchy.length === 0) return;

  const previous = hierarchy[hierarchy.length - 1];
  dispatch(navigateBackInHierarchy());
  dispatch(setClinic({
    id: previous.clinicId,
    parentClinicId: previous.parentClinicId,
    name: '',
  }));
}, [dispatch, auth.subclinicHierarchy]);

  // Fixed: uses React Router navigate instead of window.location.href
const handleLogout = useCallback(async () => {
  try {
    localStorage.clear(); // use clear() not removeItem — catches any stale keys too
    sessionStorage.clear();
    dispatch(logout());
    dispatch(clearClinic());
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
    dispatch(logout());
    dispatch(clearClinic());
    navigate('/login');
  }
}, [dispatch, navigate]);

  const handleRefreshToken = useCallback((newToken) => {
    dispatch(refreshToken({ token: newToken }));
  }, [dispatch]);

  const getActiveId = useCallback(() => {
    return auth.activeMode === 'doctor' ? auth.doctorId : auth.clinicId;
  }, [auth.activeMode, auth.doctorId, auth.clinicId]);

  return {
    // Auth state
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    clinicId: auth.clinicId,
    doctorId: auth.doctorId,
    userRole: auth.userRole,
    isHybrid: auth.isHybrid,
    activeMode: auth.activeMode,
    isSubclinic: auth.isSubclinic,           // Fixed: direct boolean, no shadowing
    parentClinicId: auth.parentClinicId,
    subclinicHierarchy: auth.subclinicHierarchy,
    canNavigateBack: (auth.subclinicHierarchy ?? []).length > 0,

    // Clinic state
    clinicName: clinic.clinicName,
    theme: clinic.theme,
    subclinics: clinic.subclinics,

    // Actions
    handleSwitchToSubclinic,
    handleSwitchToParent,
    handleNavigateBack,
    handleLogout,
    handleRefreshToken,
    toggleUserMode: () => dispatch(toggleUserMode()),
    setUserMode: (mode) => dispatch(setUserMode(mode)),

    // Utilities
    getActiveId,
    isDoctorMode: auth.activeMode === 'doctor',   // direct values, no useCallback overhead
    isClinicMode: auth.activeMode === 'clinic',
  };
};