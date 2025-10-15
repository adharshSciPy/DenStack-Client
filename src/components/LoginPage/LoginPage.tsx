import { useState } from "react";
import { Heart, User, Lock } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function HospitalLogin() {
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
        case "600":
          endpoint = "/api/doctor/login";
          break;
        case "lab":
          endpoint = "/api/lab/login";
          break;
        case "200":
          endpoint = "/api/pharmacy/login";
          break;
        case "tech":
          endpoint = "/api/tech/login";
          break;
        case "staff":
          endpoint = "/api/staff/login";
          break;
        case "300":
          endpoint = "/api/nurse/login";
          break;
        default:
          endpoint = "/api/admin/login";
      }

      const res = await axios.post(endpoint, {
        email,
        password,
      });
      console.log(res);

      if (res.status === 200) {
        const clinicId = res.data.clinic.id; // Adjust based on actual response structure
        navigate(`/dashboard/${clinicId}`); // Redirect to dashboard with a sample clinicId
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
