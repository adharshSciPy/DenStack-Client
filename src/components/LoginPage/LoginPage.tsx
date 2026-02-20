import { useState,useEffect } from "react";
import { Heart, User, Lock } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/slice/authSlice";
import { useAppDispatch } from "../../redux/hook";

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
  const isHybrid = params.get('isHybrid') === 'true';
  const mode = params.get('mode');

  if (token && role && clinicId) {
    console.log("🚀 Direct dashboard access detected:", { token, role, clinicId, doctorId, isHybrid, mode });
    
    // Store the auth data
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (clinicId) localStorage.setItem('clinicId', clinicId);
    if (doctorId) localStorage.setItem('doctorId', doctorId);
    if (isHybrid) localStorage.setItem('isHybrid', 'true');
    
    // Dispatch to Redux
    dispatch(loginSuccess({
      user: { id: doctorId || clinicId },
      token: token,
      role: role,
      clinicId: clinicId,
      doctorId: doctorId,
      isHybrid: isHybrid
    }));
    
    // Navigate directly to dashboard
    navigate(`/dashboard/${clinicId}${mode ? `?mode=${mode}` : ''}`);
  }
}, [dispatch, navigate]);
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
      default:
        endpoint = "/api/admin/login";
    }

    const payload =
      activeRole === "456"
        ? { clinicEmail: email, clinicPassword: password }
        : { email, password };

    const res = await axios.post(endpoint, payload);

    if (res.status === 200) {
      console.log("✅ Login success:", res.data);
      localStorage.clear();
      sessionStorage.clear();

      const isHybrid = 
        (res.data.clinic && res.data.doctor) ||
        res.data.clinic?.isClinicAdminDoctor === true ||
        res.data.clinic?.role === "760" ||
        res.data.doctor?.role === "760" ||
        res.data.role === "760" ||
        res.data.doctor?.isClinicAdmin === true;

      let clinicId = null;
      let doctorId = null;
      let role = activeRole; 
      
      if (res.data.clinic) {
        clinicId = res.data.clinic.id || res.data.clinic._id;
        role = res.data.clinic.role || role;
        
        if (res.data.doctor) {
          doctorId = res.data.doctor.id || res.data.doctor._id;
        }
        else if (res.data.clinic.linkedDoctorId) {
          doctorId = res.data.clinic.linkedDoctorId;
        }
      }
      
      if (res.data.doctor && !res.data.clinic) {
        doctorId = res.data.doctor.id || res.data.doctor._id;
        role = res.data.doctor.role || role;
      }
      
      if (res.data.doctorClinic) {
        clinicId = res.data.doctorClinic.clinic?.id || res.data.doctorClinic.clinic?._id;
        doctorId = res.data.doctorClinic.doctor?.id || res.data.doctorClinic.doctor?._id;
        role = "456";
      }
      
      if (res.data.reception) {
        clinicId = res.data.reception.clinicId || res.data.reception.clinic?.id;
        role = res.data.reception.role || "500";
      }

      if (isHybrid) {
        role = "760";
        
        if (!doctorId && clinicId) {
          try {
            const token = res.data.accessToken;
            if (token) {
              const tokenParts = token.split('.');
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
            }
          } catch (e) {
            console.log("Could not parse token for doctorId");
          }
        }
      }

      console.log("🔍 Extracted values:", {
        clinicId,
        doctorId,
        role,
        isHybrid,
        hasDoctor: !!res.data.doctor,
        rawData: res.data
      });

      if (isHybrid && !doctorId) {
        console.warn("⚠️ Hybrid user but no doctorId found - this might cause issues");
      }

      dispatch(
        loginSuccess({
          user: res.data.doctorClinic || res.data.doctor || res.data.clinic || res.data.reception,
          token: res.data.accessToken,
          role: role,
          clinicId: clinicId,
          doctorId: doctorId,
          isHybrid: isHybrid
        })
      );

      const token = res.data.accessToken;
      if (token) {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('role', role);
        if (clinicId) localStorage.setItem('clinicId', clinicId);
        if (doctorId) localStorage.setItem('doctorId', doctorId);
        if (isHybrid) localStorage.setItem('isHybrid', 'true');
      }

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
        // Clinic doctor
        if (!clinicId) {
          console.error("❌ No clinicId found for clinic doctor login!");
          alert("Login error: Clinic ID not found");
          return;
        }
        const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(token)}&role=456&clinicId=${clinicId}`;
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
      else if (role === "500") {
        if (!clinicId) {
          console.error("❌ No clinicId found for receptionist login!");
          alert("Login error: Clinic ID not found");
          return;
        }
        navigate(`/receptionist?clinicId=${clinicId}`);
      } 
      else {
        navigate("/dashboard");
      }
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
    { id: "700", label: "Admin" },
    { id: "600", label: "Doctor" },
    { id: "lab", label: "Lab" },
    { id: "200", label: "Pharmacy" },
    { id: "tech", label: "Tech" },
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
        <div className="bg-card border border-border rounded-xl p-6 ">
          {/* Role Selection */}
          <div
            className="grid grid-cols-3 gap-2 "
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
                className="text-sm font-medium text-foreground mb-2 flex "
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
