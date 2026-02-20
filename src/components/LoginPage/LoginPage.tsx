import { useState } from "react";
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
          endpoint =
            "http://localhost:8003/api/v1/clinic-service/clinic-doctor/login";
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

        dispatch(
          loginSuccess({
            user:
              res.data.doctorClinic ||
              res.data.doctor ||
              res.data.clinic ||
              res.data.reception,
            token: res.data.accessToken,
          })
        );

        const token = res.data.accessToken;

        // ✅ FIX: Extract doctorId correctly based on role
        let doctorId = null;
        let clinicId = null;

        if (activeRole === "600") {
          // For doctor login (role 600)
          doctorId = res.data.doctor?.id;
          console.log("🔍 Doctor ID extracted:", doctorId);
        } else if (activeRole === "456") {
          // For clinic doctor login (role 456)
          doctorId = res.data.doctorClinic?.doctor?.id;
          clinicId = res.data.doctorClinic?.clinic?.id;
          console.log("🔍 Clinic Doctor ID extracted:", { doctorId, clinicId });
        } else if (activeRole === "700") {
          // For clinic/admin login (role 700)
          clinicId = res.data.clinic?.id;
          console.log("🔍 Clinic ID extracted:", clinicId);
        } else if (activeRole === "500") {
          // For clinic/admin login (role 700)
          clinicId = res.data.clinic?._id;
          console.log("🔍 Clinic ID extracted:", clinicId);
        }

        // ✅ Detect role properly for all types
        const role =
          activeRole === "700"
            ? "700"
            : activeRole === "500"
            ? "500"
            : activeRole === "456"
            ? "456"
            : res.data.reception?.role ||
              res.data.doctor?.role ||
              res.data.clinic?.role ||
              "unknown";

        console.log("🔍 Final computed values:", {
          role,
          doctorId,
          clinicId,
          token: !!token,
        });

        // ✅ Redirects
        if (role === "600") {
          console.log("🧠 Redirecting Doctor to 3001 —", {
            token: !!token,
            role,
            doctorId,
          });

          if (!doctorId) {
            console.error("❌ No doctorId found for doctor login!");
            alert("Login error: Doctor ID not found");
            return;
          }

          const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(
            token
          )}&role=${role}&doctorId=${doctorId}`;
          window.location.href = redirectURL;
        } else if (role === "456") {
          console.log("🧠 Redirecting Clinic Doctor to 3001 —", {
            token: !!token,
            role,
            clinicId,
          });

          if (!clinicId) {
            console.error("❌ No clinicId found for clinic doctor login!");
            alert("Login error: Clinic ID not found");
            return;
          }

          const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(
            token
          )}&role=${role}&clinicId=${clinicId}`;
          window.location.href = redirectURL;
        } else if (role === "700") {
          console.log("🧠 Redirecting Admin to Dashboard —", {
            token: !!token,
            role,
            clinicId,
          });
          navigate(`/dashboard/${clinicId}`);
        } else if (role === "500") {
          navigate(`/receptionist`);
        } else {
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
    { id: "400", label: "Tech" },
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
