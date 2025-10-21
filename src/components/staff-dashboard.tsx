import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import baseUrl from "../baseUrl";
import {
  UserPlus,
  Users,
  Activity,
  Pill,
  Calculator,
  Briefcase,
} from "lucide-react";
import axios from "axios";

interface StaffFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  experience?: string;
}

interface StaffStats {
  nurse: number;
  technician: number;
  accountant: number;
  pharmacist: number;
  receptionist: number;
}
interface StaffCounts {
  accountants: number;
  nurses: number;
  pharmacists: number;
  receptionists: number;
  technicians: number;
}

interface ClinicStaffResponse {
  success: boolean;
  message: string;
  clinicId: string;
  total: number;
  staffCounts: StaffCounts;
}

const StaffRegistration: React.FC = () => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const { clinicId } = useParams();
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffData,setStaffData]=useState<ClinicStaffResponse>()
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
 

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
    // Clear role-specific fields when role changes
    setFormData((prev) => ({
      ...prev,
      specialization: "",
      licenseNumber: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setMessage("Please select a staff role.");
      setMessageType("error");
      return;
    }

    // Validate phone number
    if (!formData.phoneNumber || isNaN(Number(formData.phoneNumber))) {
      setMessage("Please enter a valid phone number.");
      setMessageType("error");
      return;
    }

    // Validate doctor-specific required fields

    setLoading(true);
    setMessage("");

    try {
      // Define role-based endpoints
      const roleEndpoints: Record<string, string> = {
        nurse: `${baseUrl}api/v1/auth/nurse/register`,
        technician: `${baseUrl}api/v1/auth/technician/register`,
        accountant: `${baseUrl}api/v1/auth/accountant/register`,
        pharmacist: `${baseUrl}api/v1/auth/pharmacist/register`,
        receptionist: `${baseUrl}api/v1/auth/receptionist/register`,
      };

      const url = roleEndpoints[selectedRole];
      if (!url) {
        throw new Error("Invalid staff role selected.");
      }

      let formattedData: any = {
        ...formData,
        phoneNumber: Number(formData.phoneNumber),
      };

      if (
        ["nurse", "pharmacist", "technician", "receptionist"].includes(
          selectedRole
        )
      ) {
        formattedData = {
          ...formattedData,
          clinicId: clinicId || "0",
        };
      }

      const response = await axios.post(url, formattedData);
      console.log(response);

      if (response.status === 201 || response.status === 200) {
        setMessage(
          `✅ ${
            selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
          } registered successfully!`
        );
        setMessageType("success");
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          password: "",
        });
        setSelectedRole("");
      } else {
        setMessage("❌ Registration failed. Please try again.");
        setMessageType("error");
      }
    } catch (error: any) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "An error occurred during registration."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    nurse: <Activity className="w-5 h-5" />,
    technician: <Briefcase className="w-5 h-5" />,
    accountant: <Calculator className="w-5 h-5" />,
    pharmacist: <Pill className="w-5 h-5" />,
    receptionist: <UserPlus className="w-5 h-5" />,
  };
  useEffect(()=>{
    const getStaffData=async()=>{
      try {
        const res=await axios.get(`${baseUrl}api/v1/auth/clinic/getStaff/${clinicId}`)
        setStaffData(res.data)
        console.log(res);
      } catch (error) {
        
      }
    }
    getStaffData()
  },[clinicId])
  
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
              <p className="text-3xl font-bold text-gray-900">{staffData?.total}</p>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
          style={{ marginTop: "20px", marginBottom: "20px" }}
        >
          {Object.entries(staffData?.staffCounts ?? {}).map(([role, count]) => {
            const bgColorMap: Record<string, string> = {
              nurse: "#16a34a",
              technician: "#f59e0b",
              accountant: "#ea580c",
              pharmacist: "#facc15",
              receptionist: "#cff805",
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
          <div
            className="flex items-center gap-3 mb-6"
            style={{ marginBottom: "20px" }}
          >
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Register New Staff
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number *"
                value={formData.phoneNumber}
                onChange={handleChange}
                inputMode="numeric"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password *"
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
              <option value="">Select Role *</option>
              <option value="nurse">👩‍⚕️ Nurse</option>
              <option value="technician">🔬 Technician</option>
              <option value="accountant">💼 Accountant</option>
              <option value="pharmacist">💊 Pharmacist</option>
              <option value="receptionist">📋 Receptionist</option>
            </select>

            {message && (
              <div
                className={`p-4 rounded-xl text-center ${
                  messageType === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px" }}
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffRegistration;
