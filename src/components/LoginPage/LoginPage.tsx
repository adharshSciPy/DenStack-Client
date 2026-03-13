import { useState, useEffect } from "react";
import { Heart, User, Lock, X, ArrowLeft, CheckCircle, AlertCircle,Eye,EyeOff } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/slice/authSlice";
import { useAppDispatch } from "../../redux/hook";
import  baseUrl  from "../../baseUrl";
// import { useToast } from "../../hooks/useToast";

// Define types for better type safety
interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  message?: string;
  clinic?: any;
  doctor?: any;
  reception?: any;
  technician?: any;
  LabTechnician?: any;
  lab?: any;
  nurse?: any;
  staff?: any;
  doctorClinic?: any;
  role?: string;
  clinicId?: string;
  doctorId?: string;
  labVendorId?: string;
  isHybrid?: boolean;
  [key: string]: any;
}

interface ExtractedUserData {
  user: any;
  clinicId: string | null;
  doctorId: string | null;
  labVendorId: string | null;
  role: string;
  isHybrid: boolean;
}

interface ResetData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function HospitalLogin() {
  const dispatch = useAppDispatch();
  // const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [roleSelectionError, setRoleSelectionError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [resetData, setResetData] = useState<ResetData>({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const clinicId = params.get('clinicId');
    const doctorId = params.get('doctorId');
    const labVendorId = params.get('labVendorId');
    const isHybrid = params.get('isHybrid') === 'true';
    const mode = params.get('mode');

    if (token && role && clinicId) {
      console.log("🚀 Direct dashboard access detected:", { token, role, clinicId, doctorId, labVendorId, isHybrid, mode });
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (clinicId) localStorage.setItem('clinicId', clinicId);
      if (doctorId) localStorage.setItem('doctorId', doctorId);
      if (labVendorId) localStorage.setItem('labVendorId', labVendorId);
      if (isHybrid) localStorage.setItem('isHybrid', 'true');
      
      dispatch(loginSuccess({
        user: { id: doctorId || clinicId || labVendorId },
        token: token,
        role: role,
        clinicId: clinicId,
        doctorId: doctorId,
        labVendorId: labVendorId,
        isHybrid: isHybrid
      }));
      
      navigate(`/dashboard/${clinicId}${mode ? `?mode=${mode}` : ''}`);
    }
  }, [dispatch, navigate]);

  // Update password strength when newPassword changes
  useEffect(() => {
    if (resetData.newPassword) {
      setPasswordStrength({
        hasMinLength: resetData.newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(resetData.newPassword),
        hasLowerCase: /[a-z]/.test(resetData.newPassword),
        hasNumber: /[0-9]/.test(resetData.newPassword),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(resetData.newPassword)
      });
    } else {
      setPasswordStrength({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
    }
  }, [resetData.newPassword]);

  const handleForgotPasswordClick = () => {
    setRoleSelectionError(null);
    
    if (!activeRole) {
      setRoleSelectionError("Please select a user type first");
      return;
    }
    
    setShowForgotPasswordModal(true);
    setResetStep(1);
    setResetData({
      email: email, // Pre-fill with login email
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
    setResetMessage(null);
  };

  const handleCloseModal = () => {
    setShowForgotPasswordModal(false);
    setResetStep(1);
    setResetData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
    setResetMessage(null);
    setResetLoading(false);
  };

  const getPasswordStrengthColor = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength === 0) return "bg-gray-200";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const strength = Object.values(passwordStrength).filter(Boolean).length;
    if (strength === 0) return "Enter password";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Medium";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const sendOTP = async () => {
    if (!resetData.email) {
      setResetMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    if (!validateEmail(resetData.email)) {
      setResetMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setResetLoading(true);
    setResetMessage(null);

    try {
      // Determine the correct endpoint based on active role
      let endpoint = "";
      switch (activeRole) {
        case "700":
          endpoint = `${baseUrl}api/v1/auth/clinic/forgot-password`;
          break;
        case "500":
          endpoint = `${baseUrl}api/v1/auth/receptionist/forgot-password`;
          break;
        case "600":
          endpoint = `${baseUrl}api/v1/auth/doctor/forgot-password`;
          break;
        case "456":
          endpoint = "http://localhost:8003/api/v1/clinic-service/clinic-doctor/forgot-password";
          break;
        case "400":
          endpoint = `${baseUrl}api/v1/auth/technician/forgot-password`;
          break;
        case "200":
          endpoint = `${baseUrl}api/v1/auth/lab/forgot-password`;
          break;
        case "300":
          endpoint =`${baseUrl}api/v1/auth/nurse/forgot-password`;
          break;
        case "staff":
          endpoint = `${baseUrl}api/v1/auth/staff/forgot-password`;
          break;
        default:
          endpoint = `${baseUrl}api/v1/auth/admin/forgot-password`;
      }

      const payload = {
        email: resetData.email,
        role: activeRole
      };

      const res = await axios.post(endpoint, payload);

      if (res.status === 200) {
        setResetMessage({ 
          type: 'success', 
          text: 'OTP has been sent to your email. Please check your inbox.' 
        });
        // toast.showSuccess("OTP sent to your email");
        setResetStep(2);
      }
    } catch (error) {
      console.error("Failed to send OTP:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to send OTP. Please try again.";
        setResetMessage({ type: 'error', text: errorMessage });
        // toast.showError(errorMessage);
      } else {
        const errorMessage = "An unexpected error occurred. Please try again.";
        setResetMessage({ type: 'error', text: errorMessage });
        // toast.showError(errorMessage);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const resetPassword = async () => {
    // Validate OTP
    if (!resetData.otp || resetData.otp.length < 4) {
      setResetMessage({ type: 'error', text: 'Please enter a valid OTP' });
      return;
    }

    // Validate new password
    if (!resetData.newPassword) {
      setResetMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }

    if (resetData.newPassword.length < 8) {
      setResetMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
    if (strengthCount < 3) {
      setResetMessage({ 
        type: 'error', 
        text: 'Please use a stronger password (mix of uppercase, lowercase, numbers, and special characters)' 
      });
      return;
    }

    // Validate password confirmation
    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setResetLoading(true);
    setResetMessage(null);

    try {
      // Determine the correct endpoint based on active role
      let endpoint = "";
      switch (activeRole) {
        case "700":
          endpoint = `${baseUrl}api/v1/auth/clinic/reset-password`;
          break;
        case "500":
          endpoint = `${baseUrl}api/v1/auth/receptionist/reset-password`;
          break;
        case "600":
          endpoint = `${baseUrl}api/v1/auth/doctor/reset-password`;
          break;
        case "456":
          endpoint = "http://localhost:8003/api/v1/clinic-service/clinic-doctor/reset-password";
          break;
        case "400":
          endpoint = `${baseUrl}api/v1/auth/technician/reset-password`;
          break;
        case "200":
          endpoint =`${baseUrl}api/v1/auth/lab/reset-password`;
          break;
        case "300":
          endpoint = `${baseUrl}api/v1/auth/nurse/reset-password`;
          break;
        case "staff":
          endpoint = `${baseUrl}api/v1/auth/staff/reset-password`;
          break;
        default:
          endpoint = `${baseUrl}api/v1/auth/admin/reset-password`;
      }

      const payload = {
        email: resetData.email,
        otp: resetData.otp,
        newPassword: resetData.newPassword,
        role: activeRole
      };

      const res = await axios.post(endpoint, payload);

      if (res.status === 200) {
        setResetMessage({ 
          type: 'success', 
          text: 'Password reset successful! You can now login with your new password.' 
        });
        // toast.showSuccess("Password reset successful!");
        
        // Auto-fill the login form with the email
        setEmail(resetData.email);
        
        // Close modal after 3 seconds
        setTimeout(() => {
          handleCloseModal();
        }, 3000);
      }
    } catch (error) {
      console.error("Password reset failed:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to reset password. Please try again.";
        setResetMessage({ type: 'error', text: errorMessage });
        // toast.showError(errorMessage);
      } else {
        const errorMessage = "An unexpected error occurred. Please try again.";
        setResetMessage({ type: 'error', text: errorMessage });
        // toast.showError(errorMessage);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const goBackToEmail = () => {
    setResetStep(1);
    setResetMessage(null);
    setResetData({
      ...resetData,
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  // Helper function to extract user data normalized by role
  const extractUserData = (data: LoginResponse, activeRole: string): ExtractedUserData => {
    let clinicId: string | null = null;
    let doctorId: string | null = null;
    let labVendorId: string | null = null;
    let role: string = activeRole;
    let user: any = null;
    let isHybrid: boolean = false;

    console.log("📦 Raw response data:", data);

    // Role-based extraction patterns with proper typing
    const rolePatterns: Record<string, (data: LoginResponse) => Partial<ExtractedUserData>> = {
      "700": (data) => {
        const clinicData = data.clinic || data;
        clinicId = clinicData.id || clinicData._id || null;
        user = clinicData;
        role = clinicData.role || "700";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },
      "600": (data) => {
        const doctorData = data.doctor || data;
        doctorId = doctorData.id || doctorData._id || null;
        clinicId = doctorData.clinicId || null;
        user = doctorData;
        role = doctorData.role || "600";
        return { clinicId, doctorId, labVendorId: null, user, role };
      },
      "456": (data) => {
        if (data.doctorClinic) {
          clinicId = data.doctorClinic.clinic?.id || data.doctorClinic.clinic?._id || null;
          doctorId = data.doctorClinic.doctor?.id || data.doctorClinic.doctor?._id || null;
          user = data.doctorClinic;
        } else if (data.clinic && data.doctor) {
          clinicId = data.clinic.id || data.clinic._id || null;
          doctorId = data.doctor.id || data.doctor._id || null;
          user = { clinic: data.clinic, doctor: data.doctor };
        }
        role = "456";
        isHybrid = true;
        return { clinicId, doctorId, labVendorId: null, user, role, isHybrid };
      },
      "400": (data) => {
        if (data.LabTechnician) {
          const technicianData = data.LabTechnician;
          clinicId = technicianData.clinicId || technicianData.clinic?.id || null;
          labVendorId = technicianData.labVendorId || null;
          user = { ...technicianData, labType: technicianData.labType || null }; 
          role = technicianData.role || "400";
          console.log("🔧 LabTechnician data extracted:", { clinicId, labVendorId, role });
        } else {
          const technicianData = data.technician || data;
          clinicId = technicianData.clinicId || technicianData.clinic?.id || null;
          labVendorId = technicianData.labVendorId || null;
          user = technicianData;
          role = technicianData.role || "400";
        }
        return { clinicId, doctorId: null, labVendorId, user, role };
      },
      "500": (data) => {
        const receptionData = data.reception || data;
        clinicId = receptionData.clinicId || receptionData.clinic?.id || null;
        user = receptionData;
        role = receptionData.role || "500";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },
      "200": (data) => {
        const labData = data.lab || data;
        clinicId = labData.clinicId || labData.clinic?.id || null;
        user = labData;
        role = labData.role || "200";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },
      "staff": (data) => {
        const staffData = data.staff || data;
        clinicId = staffData.clinicId || staffData.clinic?.id || null;
        user = staffData;
        role = staffData.role || "staff";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },
      "300": (data) => {
        const nurseData = data.nurse || data;
        clinicId = nurseData.clinicId || nurseData.clinic?.id || null;
        user = nurseData;
        role = nurseData.role || "300";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },
      "admin": (data) => {
        user = data;
        role = "admin";
        return { clinicId: null, doctorId: null, labVendorId: null, user, role };
      }
    };

    if (rolePatterns[activeRole]) {
      const extracted = rolePatterns[activeRole](data);
      clinicId = extracted.clinicId ?? clinicId;
      doctorId = extracted.doctorId ?? doctorId;
      labVendorId = extracted.labVendorId ?? labVendorId;
      user = extracted.user ?? user;
      role = extracted.role ?? role;
      isHybrid = extracted.isHybrid ?? isHybrid;
    }

    const hybridCheck = 
      (data.clinic && data.doctor) ||
      data.clinic?.isClinicAdminDoctor === true ||
      data.clinic?.role === "760" ||
      data.doctor?.role === "760" ||
      data.role === "760" ||
      data.doctor?.isClinicAdmin === true ||
      data.isHybrid === true;

    if (hybridCheck) {
      isHybrid = true;
      role = "760";
      
      if (!clinicId) {
        if (data.clinic) {
          clinicId = data.clinic.id || data.clinic._id || null;
        } else if (data.doctor?.clinicId) {
          clinicId = data.doctor.clinicId;
        }
      }
      
      if (!doctorId) {
        if (data.doctor) {
          doctorId = data.doctor.id || data.doctor._id || null;
        } else if (data.clinic?.linkedDoctorId) {
          doctorId = data.clinic.linkedDoctorId;
        }
      }

      if (!doctorId && clinicId && data.accessToken) {
        try {
          const tokenParts = data.accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.doctorId) {
              doctorId = payload.doctorId;
              console.log("✅ Extracted doctorId from token:", doctorId);
            }
            if (payload.doctorUniqueId) {
              console.log("✅ Doctor uniqueId from token:", payload.doctorUniqueId);
            }
          }
        } catch (e) {
          console.log("Could not parse token for doctorId");
        }
      }
    }

    if (!clinicId && data.clinicId) clinicId = data.clinicId;
    if (!clinicId && data.clinic?.id) clinicId = data.clinic.id;
    if (!clinicId && data.clinic?._id) clinicId = data.clinic._id;
    if (!clinicId && data.LabTechnician?.clinicId) clinicId = data.LabTechnician.clinicId;
    
    if (!doctorId && data.doctorId) doctorId = data.doctorId;
    if (!doctorId && data.doctor?.id) doctorId = data.doctor.id;
    if (!doctorId && data.doctor?._id) doctorId = data.doctor._id;
    
    if (!labVendorId && data.labVendorId) labVendorId = data.labVendorId;
    if (!labVendorId && data.LabTechnician?.labVendorId) labVendorId = data.LabTechnician.labVendorId;

    return { user, clinicId, doctorId, labVendorId, role, isHybrid };
  };

  const redirectUser = (
    role: string, 
    token: string, 
    clinicId: string | null, 
    doctorId: string | null, 
    labVendorId: string | null,
    isHybrid: boolean
  ) => {
    if (isHybrid) {
      console.log("🧠 Hybrid user - redirecting to clinic dashboard with hybrid mode");
      navigate(`/dashboard/${clinicId}?mode=clinic&hybrid=true`);
    } 
    else if (role === "600") {
      if (!doctorId) {
        console.error("❌ No doctorId found for doctor login!");
        alert("Login error: Doctor ID not found");
        return;
      }
      const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(token)}&role=600&doctorId=${doctorId}`;
      window.location.href = redirectURL;
    } 
    else if (role === "456") {
      if (!clinicId) {
        console.error("❌ No clinicId found for clinic doctor login!");
        alert("Login error: Clinic ID not found");
        return;
      }
      const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(token)}&role=456&clinicId=${clinicId}${doctorId ? `&doctorId=${doctorId}` : ''}`;
      window.location.href = redirectURL;
    } 
    else if (role === "700") {
      if (!clinicId) {
        console.error("❌ No clinicId found for clinic admin login!");
        alert("Login error: Clinic ID not found");
        return;
      }
      navigate(`/dashboard/${clinicId}`);
    } 
    else if (role === "400") {
      if (!labVendorId) {
        console.error("❌ No labVendorId found for technician login!");
        alert("Login error: Lab Vendor ID not found");
        return;
      }
      navigate(`/labadmin/dashboard/${labVendorId}`);
    } 
    else if (role === "200") {
      if (!labVendorId) {
        console.error("❌ No labVendorId found for lab login!");
        alert("Login error: Lab Vendor ID not found");
        return;
      }
      navigate(`/lab/dashboard/${labVendorId}`);
    }
    else if (role === "500" || role === "300" || role === "staff") {
      if (!clinicId) {
        console.error(`❌ No clinicId found for ${role} login!`);
        alert("Login error: Clinic ID not found");
        return;
      }
      navigate(`/receptionist?clinicId=${clinicId}&role=${role}`);
    } 
    else if (role === "admin") {
      navigate("/admin/dashboard");
    }
    else {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a role is selected
    if (!activeRole) {
      setLoginError("Please select a user type");
      return;
    }
    
    // Clear any previous errors
    setLoginError(null);
    setRoleSelectionError(null);

    try {
      let endpoint = "";
      switch (activeRole) {
        case "700":
          endpoint = `${baseUrl}api/v1/auth/clinic/login`;
          break;
        case "500":
          endpoint = `${baseUrl}api/v1/auth/receptionist/login`;
          break;
        case "600":
          endpoint =`${baseUrl}api/v1/auth/doctor/login`;
          break;
        case "456":
          endpoint = "http://localhost:8003/api/v1/clinic-service/clinic-doctor/login";
          break;
        case "400":
          endpoint = `${baseUrl}api/v1/auth/technician/login`;
          break;
        case "200":
          endpoint = `${baseUrl}api/v1/auth/lab/login`;
          break;
        case "300":
          endpoint = `${baseUrl}api/v1/auth/nurse/login`;
          break;
        case "staff":
          endpoint = `${baseUrl}api/v1/auth/staff/login`;
          break;
        default:
          endpoint = `${baseUrl}api/v1/auth/admin/login`;
      }

      const payload =
        activeRole === "456"
          ? { clinicEmail: email, clinicPassword: password }
          : { email, password };

      const res = await axios.post<LoginResponse>(endpoint, payload);

      if (res.status === 200) {
        console.log("✅ Login success:", res.data);
        localStorage.clear();
        sessionStorage.clear();

        const { user, clinicId, doctorId, labVendorId, role, isHybrid } = extractUserData(res.data, activeRole);

        console.log("🔍 Extracted values:", {
          clinicId,
          doctorId,
          labVendorId,
          role,
          isHybrid,
          userData: user
        });

        if (isHybrid && !doctorId) {
          console.warn("⚠️ Hybrid user but no doctorId found - this might cause issues");
        }

        if (role === "400" && !labVendorId) {
          console.warn("⚠️ Technician but no labVendorId found - this might cause issues");
        }

        dispatch(
          loginSuccess({
            user,
            token: res.data.accessToken,
            role,
            clinicId: clinicId || undefined,
            doctorId: doctorId || undefined,
            labVendorId: labVendorId || undefined,
            isHybrid
          })
        );

        const token = res.data.accessToken;
        if (token) {
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('role', role);
          if (clinicId) localStorage.setItem('clinicId', clinicId);
          if (doctorId) localStorage.setItem('doctorId', doctorId);
          if (labVendorId) localStorage.setItem('labVendorId', labVendorId);
          if (isHybrid) localStorage.setItem('isHybrid', 'true');
        }

        redirectUser(role, token, clinicId, doctorId, labVendorId, isHybrid);
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Login failed");
      } else {
        alert("Login failed");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const roles = [
    { id: "700", label: "Clinic Admin" },
    { id: "600", label: "Doctor" },
    { id: "200", label: "Lab" },
    { id: "400", label: "Technician" },
    { id: "staff", label: "Staff" },
    { id: "300", label: "Nurse" },
    { id: "456", label: "Clinic Doctor" },
    { id: "500", label: "Receptionist" },
  ];

  return (
    <div className="h-screen w-full bg-background flex items-center justify-center p-4">

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && activeRole && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reset Password</h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {resetStep === 1 ? (
                <>Enter your email to receive OTP for: 
                  <span className="font-medium text-primary ml-1">
                    {roles.find(r => r.id === activeRole)?.label || activeRole}
                  </span>
                </>
              ) : (
                <>Enter the OTP sent to <span className="font-medium">{resetData.email}</span></>
              )}
            </p>

            {/* Step 1: Email Input */}
            {resetStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }}>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 flex">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={resetData.email}
                      onChange={(e) => setResetData({...resetData, email: e.target.value})}
                      className="w-full border rounded-lg pl-10 py-3 px-3 text-sm"
                      placeholder="Enter your email"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </div>

                {resetMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
                      resetMessage.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {resetMessage.type === "success" ? (
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{resetMessage.text}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 border rounded-lg py-3 hover:bg-gray-50 transition-colors"
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP + New Password */}
            {resetStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); resetPassword(); }}>
                <div className="mb-3">
                  <label className="text-sm font-medium mb-2 flex">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={resetData.otp}
                    onChange={(e) => setResetData({...resetData, otp: e.target.value})}
                    className="w-full border rounded-lg py-3 px-3 text-sm"
                    placeholder="Enter 6-digit OTP"
                    required
                    disabled={resetLoading}
                    maxLength={6}
                  />
                </div>

               <div className="mb-3">
  <label className="text-sm font-medium mb-2 flex">
    New Password
  </label>

  <div className="flex items-center border rounded-lg px-3">
    
    <input
      type={showPassword ? "text" : "password"}
      value={resetData.newPassword}
      onChange={(e) =>
        setResetData({ ...resetData, newPassword: e.target.value })
      }
      className="flex-1 py-3 text-sm outline-none"
      placeholder="Enter new password"
      required
      disabled={resetLoading}
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-gray-400 hover:text-gray-600"
    >
      {showPassword ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>

  </div>
</div>


               <div className="mb-4">
  <label className="text-sm font-medium mb-2 flex">
    Confirm Password
  </label>

  <div className="flex items-center border rounded-lg px-3">

    <input
      type={showConfirmPassword ? "text" : "password"}
      value={resetData.confirmPassword}
      onChange={(e) =>
        setResetData({ ...resetData, confirmPassword: e.target.value })
      }
      className="flex-1 py-3 text-sm outline-none"
      placeholder="Confirm new password"
      required
      disabled={resetLoading}
    />

    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword(!showConfirmPassword)
      }
      className="text-gray-400 hover:text-gray-600"
    >
      {showConfirmPassword ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>

  </div>
</div>


                {resetMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
                      resetMessage.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {resetMessage.type === "success" ? (
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{resetMessage.text}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="flex items-center justify-center gap-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={resetLoading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center size-9 bg-primary rounded-lg mb-4">
            <Heart className="w-5 h-5 text-white" />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            MediCare Portal
          </h1>

          <p className="text-sm text-muted-foreground">
            Hospital Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border rounded-xl p-6">

          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  setActiveRole(role.id);
                  setRoleSelectionError(null);
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border ${
                  activeRole === role.id
                    ? "bg-primary text-white border-primary"
                    : "border-border hover:bg-gray-50"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {roleSelectionError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{roleSelectionError}</span>
            </div>
          )}

          {loginError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 flex">
              Email Address
            </label>

            <div className="relative">
              <div className="absolute left-3 top-3 text-muted-foreground">
                <User className="w-4 h-4" />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg pl-10 py-3 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="doctor@hospital.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
  <label className="text-sm font-medium mb-2 flex">
    Password
  </label>

  <div className="relative">
    <div className="flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary px-3">
      
      {/* Lock Icon */}
      <Lock className="w-4 h-4 text-muted-foreground mr-2" />

      {/* Input */}
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="flex-1 py-3 text-sm outline-none bg-transparent"
        placeholder="Enter your password"
        required
      />

      {/* Eye Toggle */}
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="text-gray-400 hover:text-gray-600"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>

    </div>
  </div>
</div>


          {/* Remember + Forgot */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm text-muted-foreground">
                Remember me
              </span>
            </label>

            <button
              onClick={handleForgotPasswordClick}
              className="text-sm text-primary hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            disabled={resetLoading}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Sign In
          </button>

        </div>
      </div>
    </div>
  );
}