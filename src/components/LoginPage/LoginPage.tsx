import { useState, useEffect } from "react";
import { Heart, User, Lock } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/slice/authSlice";
import { useAppDispatch } from "../../redux/hook";

// Define types for better type safety
interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  message?: string;
  clinic?: any;
  doctor?: any;
  reception?: any;
  technician?: any;
  LabTechnician?: any; // Add LabTechnician field
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

export default function HospitalLogin() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState("admin");
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
      
      // Store the auth data
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (clinicId) localStorage.setItem('clinicId', clinicId);
      if (doctorId) localStorage.setItem('doctorId', doctorId);
      if (labVendorId) localStorage.setItem('labVendorId', labVendorId);
      if (isHybrid) localStorage.setItem('isHybrid', 'true');
      
      // Dispatch to Redux
      dispatch(loginSuccess({
        user: { id: doctorId || clinicId || labVendorId },
        token: token,
        role: role,
        clinicId: clinicId,
        doctorId: doctorId,
        labVendorId: labVendorId,
        isHybrid: isHybrid
      }));
      
      // Navigate directly to dashboard
      navigate(`/dashboard/${clinicId}${mode ? `?mode=${mode}` : ''}`);
    }
  }, [dispatch, navigate]);

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
      // Clinic Admin (700)
      "700": (data) => {
        const clinicData = data.clinic || data;
        clinicId = clinicData.id || clinicData._id || null;
        user = clinicData;
        role = clinicData.role || "700";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },

      // Doctor (600)
      "600": (data) => {
        const doctorData = data.doctor || data;
        doctorId = doctorData.id || doctorData._id || null;
        clinicId = doctorData.clinicId || null;
        user = doctorData;
        role = doctorData.role || "600";
        return { clinicId, doctorId, labVendorId: null, user, role };
      },

      // Clinic Doctor (456) - hybrid case
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

      // Technician (400) - handles both technician and LabTechnician fields
      "400": (data) => {
        // Check for LabTechnician first (from your response)
        if (data.LabTechnician) {
          const technicianData = data.LabTechnician;
          clinicId = technicianData.clinicId || technicianData.clinic?.id || null;
          labVendorId = technicianData.labVendorId || null;
          user = technicianData;
          role = technicianData.role || "400";
          console.log("🔧 LabTechnician data extracted:", { clinicId, labVendorId, role });
        } else {
          // Fallback to technician field
          const technicianData = data.technician || data;
          clinicId = technicianData.clinicId || technicianData.clinic?.id || null;
          labVendorId = technicianData.labVendorId || null;
          user = technicianData;
          role = technicianData.role || "400";
        }
        return { clinicId, doctorId: null, labVendorId, user, role };
      },

      // Receptionist (500)
      "500": (data) => {
        const receptionData = data.reception || data;
        clinicId = receptionData.clinicId || receptionData.clinic?.id || null;
        user = receptionData;
        role = receptionData.role || "500";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },

      // Lab (200)
      "200": (data) => {
        const labData = data.lab || data;
        clinicId = labData.clinicId || labData.clinic?.id || null;
        user = labData;
        role = labData.role || "200";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },

      // Staff
      "staff": (data) => {
        const staffData = data.staff || data;
        clinicId = staffData.clinicId || staffData.clinic?.id || null;
        user = staffData;
        role = staffData.role || "staff";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },

      // Nurse (300)
      "300": (data) => {
        const nurseData = data.nurse || data;
        clinicId = nurseData.clinicId || nurseData.clinic?.id || null;
        user = nurseData;
        role = nurseData.role || "300";
        return { clinicId, doctorId: null, labVendorId: null, user, role };
      },

      // Admin (default)
      "admin": (data) => {
        user = data;
        role = "admin";
        return { clinicId: null, doctorId: null, labVendorId: null, user, role };
      }
    };

    // Apply the pattern for the active role
    if (rolePatterns[activeRole]) {
      const extracted = rolePatterns[activeRole](data);
      clinicId = extracted.clinicId ?? clinicId;
      doctorId = extracted.doctorId ?? doctorId;
      labVendorId = extracted.labVendorId ?? labVendorId;
      user = extracted.user ?? user;
      role = extracted.role ?? role;
      isHybrid = extracted.isHybrid ?? isHybrid;
    }

    // Check for hybrid scenarios (user might be both clinic admin and doctor)
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
      
      // Ensure we have both IDs for hybrid users
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

      // Try to extract doctorId from token if still missing
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

    // Final fallback: try to get IDs from anywhere in the response
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

  // Helper function for role-based redirects
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
      // Navigate to lab admin dashboard with labVendorId
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

    try {
      let endpoint = "";
      switch (activeRole) {
        case "700":
          endpoint = "http://localhost:8001/api/v1/auth/clinic/login";
          break;
        case "500":
          endpoint = "http://localhost:8001/api/v1/auth/receptionist/login";
          break;
        case "600":
          endpoint = "http://localhost:8001/api/v1/auth/doctor/login";
          break;
        case "456":
          endpoint = "http://localhost:8003/api/v1/clinic-service/clinic-doctor/login";
          break;
        case "400":
          endpoint = "http://localhost:8001/api/v1/auth/technician/login";
          break;
        case "200":
          endpoint = "http://localhost:8001/api/v1/auth/lab/login";
          break;
        case "300":
          endpoint = "http://localhost:8001/api/v1/auth/nurse/login";
          break;
        case "staff":
          endpoint = "http://localhost:8001/api/v1/auth/staff/login";
          break;
        default:
          endpoint = "http://localhost:8001/api/v1/auth/admin/login";
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

        // Normalized user extraction by role
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

        // Redirect based on role
        redirectUser(role, token, clinicId, doctorId, labVendorId, isHybrid);
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Login failed");
      } else {
        alert("Login failed");
      }
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
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center size-9 bg-primary rounded-lg mb-4">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            MediCare Portal
          </h1>
          <p className="text-sm text-muted-foreground mb-3">
            Hospital Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          {/* Role Selection */}
          <div
            className="grid grid-cols-3 gap-2"
            style={{ marginBottom: "20px" }}
          >
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                  activeRole === role.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Input Fields */}
          <div className="space-y-4 mb-4 mt-10">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground mb-2 flex"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg pl-10 py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring transition-colors"
                  placeholder="doctor@hospital.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground mb-2 flex"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg pl-10 py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div
            className="flex items-center justify-between mb-6"
            style={{ marginBottom: "20px" }}
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border border-input bg-input-background text-primary"
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <button className="text-sm text-primary hover:underline transition-colors">
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}