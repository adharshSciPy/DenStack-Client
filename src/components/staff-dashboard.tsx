import React, { useState } from "react";
import {
  UserPlus,
  Users,
  Stethoscope,
  Activity,
  Pill,
  Calculator,
  Briefcase,
} from "lucide-react";
import axios from "axios"
interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  experience?: string;
}

interface StaffStats {
  doctor: number;
  nurse: number;
  technician: number;
  accountant: number;
  pharmacist: number;
}

const StaffRegistration: React.FC = () => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [staffStats, setStaffStats] = useState<StaffStats>({
    doctor: 12,
    nurse: 28,
    technician: 15,
    accountant: 8,
    pharmacist: 10,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedRole) {
    setMessage("Please select a staff role.");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    // Define role-based endpoints
    const roleEndpoints: Record<string, string> = {
      doctor: "/api/doctors/register",
      nurse: "/api/nurses/register",
      technician: "/api/technicians/register",
      accountant: "/api/accountants/register",
      pharmacist: "/api/pharmacists/register",
    };

    const url = roleEndpoints[selectedRole];
    if (!url) {
      throw new Error("Invalid staff role selected.");
    }

    const response = await axios.post(url, formData);

    if (response.status === 201 || response.status === 200) {
      setMessage(
        `✅ ${
          selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
        } registered successfully!`
      );

      setStaffStats((prev) => ({
        ...prev,
        [selectedRole]: prev[selectedRole as keyof StaffStats] + 1,
      }));

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
      setSelectedRole("");
    } else {
      setMessage("❌ Registration failed. Please try again.");
    }
  } catch (error: any) {
    console.error(error);
    setMessage(
      error.response?.data?.message || "An error occurred during registration."
    );
  } finally {
    setLoading(false);
  }
};


  const renderRoleSpecificFields = () => {
    switch (selectedRole) {
      case "doctor":
        return (
          <div className="space-y-4">
            <input
              type="text"
              name="specialization"
              placeholder="Specialization (e.g., Cardiology)"
              value={formData.specialization || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <input
              type="text"
              name="licenseNumber"
              placeholder="Medical License Number"
              value={formData.licenseNumber || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        );

      case "technician":
        return (
          <input
            type="text"
            name="department"
            placeholder="Department (e.g., Radiology)"
            value={formData.department || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        );

      case "nurse":
        return (
          <input
            type="text"
            name="experience"
            placeholder="Experience (in years)"
            value={formData.experience || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        );

      default:
        return null;
    }
  };

  const totalStaff = Object.values(staffStats).reduce((a, b) => a + b, 0);

  const roleIcons: Record<string, React.ReactNode> = {
    doctor: <Stethoscope className="w-5 h-5" />,
    nurse: <Activity className="w-5 h-5" />,
    technician: <Briefcase className="w-5 h-5" />,
    accountant: <Calculator className="w-5 h-5" />,
    pharmacist: <Pill className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-gray-200 mb-6 shadow-sm">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total Staff Registered
              </p>
              <p className="text-3xl font-bold text-gray-900">{totalStaff}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8" style={{marginTop:"20px",marginBottom:"20px"}}>
          {Object.entries(staffStats).map(([role, count]) => {
            const bgColorMap: Record<string, string> = {
              doctor: "#3b82f6",
              nurse: "#16a34a",
              technician: "#f59e0b",
              accountant: "#ea580c",
              pharmacist: "#facc15",
            };

            return (
              <div
                key={role}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3"
                  style={{ backgroundColor: bgColorMap[role] }}
                >
                  {roleIcons[role]}
                </div>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 font-medium">
                  {role.charAt(0).toUpperCase() + role.slice(1)}s
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6" style={{marginBottom:"20px"}}>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Register New Staff
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <select
              name="role"
              value={selectedRole}
              onChange={handleRoleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
              required
            >
              <option value="">Select Role</option>
              <option value="doctor">👨‍⚕️ Doctor</option>
              <option value="nurse">👩‍⚕️ Nurse</option>
              <option value="technician">🔬 Technician</option>
              <option value="accountant">💼 Accountant</option>
              <option value="pharmacist">💊 Pharmacist</option>
            </select>

            {renderRoleSpecificFields()}

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
                {message}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{padding:"10px"}}
              className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register Staff Member
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRegistration;