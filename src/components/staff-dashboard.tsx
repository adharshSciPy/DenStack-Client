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
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";
import axios from "axios";
import { Button } from "./ui/button";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  joinedDate?: string;
  shifts?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    isActive?: boolean;
  }[];
}

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
  const [staffData, setStaffData] = useState<ClinicStaffResponse>();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [viewMode, setViewMode] = useState<"dashboard" | "details">(
    "dashboard"
  );
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>("");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [staffShifts, setStaffShifts] = useState<any[]>([]);
  const [newShift, setNewShift] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
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

    if (!formData.phoneNumber || isNaN(Number(formData.phoneNumber))) {
      setMessage("Please enter a valid phone number.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
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
        ["nurse", "pharmacist", "technician", "receptionist","accountant"].includes(
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
        fetchStaffData();
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

  const handleStaffCardClick = async (role: string) => {
    setSelectedStaffRole(role);
    setViewMode("details");
    setLoadingStaff(true);

    try {
      const response = await axios.get(
        `${baseUrl}api/v1/auth/clinic/all-staffs/${clinicId}?role=${role}`
      );
      console.log("staffs", response.data);

      // Map role names to backend keys
      const roleMap: Record<string, string> = {
        receptionist: "receptionists",
        nurse: "nurses",
        pharmacist: "pharmacists",
        accountant: "accountants",
        technician: "technicians",
      };

      const backendRoleKey = roleMap[role] || role;
      const staffArray = response.data.staff[backendRoleKey] || [];

      const formattedStaff = staffArray.map((staff: any) => ({
        id:
          staff._id ||
          staff.employeeId ||
          staff.receptionistId ||
          staff.pharmacistId ||
          staff.nurseId ||
          "",
        name: staff.name || "Unknown",
        email: staff.email || "N/A",
        phoneNumber: staff.phoneNumber ? String(staff.phoneNumber) : "N/A",
        role,
        shifts: staff.shifts || [],
        joinedDate: staff.createdAt || undefined,
      }));

      setStaffList(formattedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      await axios.delete(
        `${baseUrl}api/v1/auth/clinic/staff/remove/${clinicId}`,
        {
          data: {
            staffId: staffId,
            role: selectedStaffRole
          }
        }
      );
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      setMessage("✅ Staff member removed successfully");
      setMessageType("success");
      fetchStaffData(); // Refresh staff counts
    } catch (error: any) {
      console.error("Remove staff error:", error);
      setMessage(error.response?.data?.message || "❌ Failed to remove staff member");
      setMessageType("error");
    }
  };

  const handleOpenRescheduleModal = (staff: any) => {
    setSelectedStaff(staff);
    setStaffShifts(staff.shifts || []);
    setIsModalOpen(true);
  };

  // Helper: convert "YYYY-MM-DD" to "DD-MM-YYYY"
  const toBackendDateFormat = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  const handleRescheduleShift = async (staffId: string, role: string) => {
    const { startDate, endDate, startTime, endTime } = newShift;

    if (!startDate || !endDate || !startTime || !endTime) {
      setMessage("❌ All fields are required");
      setMessageType("error");
      return;
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      setMessage("❌ Start date cannot be after end date");
      setMessageType("error");
      return;
    }

    const payload = {
      startDate: toBackendDateFormat(startDate),
      endDate: toBackendDateFormat(endDate),
      startTime,
      endTime,
      role,
    };

    console.log("Reschedule payload (backend format):", payload);

    try {
      const response = await axios.patch(
        `${baseUrl}api/v1/auth/clinic/staff/add-shift/${staffId}`,
        payload
      );

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, shifts: response.data.shifts } : s
        )
      );

      setMessage("✅ Shift rescheduled successfully");
      setMessageType("success");
      setIsModalOpen(false);
      setNewShift({ startDate: "", endDate: "", startTime: "", endTime: "" });
    } catch (error: any) {
      console.error(
        "Shift update failed:",
        error.response?.data || error.message
      );
      setMessage("❌ Failed to reschedule shift");
      setMessageType("error");
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    nurse: <Activity className="w-5 h-5" />,
    technician: <Briefcase className="w-5 h-5" />,
    accountant: <Calculator className="w-5 h-5" />,
    pharmacist: <Pill className="w-5 h-5" />,
    receptionist: <UserPlus className="w-5 h-5" />,
  };

  const fetchStaffData = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}api/v1/auth/clinic/getStaff/${clinicId}`
      );
      setStaffData(res.data);
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [clinicId]);

  if (viewMode === "details") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => {
              setViewMode("dashboard");
              setMessage("");
            }}
            className="flex items-center gap-2 mb-8 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-6 mt-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedStaffRole.charAt(0).toUpperCase() +
                selectedStaffRole.slice(1)}{" "}
              Details
            </h2>
            <p className="text-gray-600">
              Total: {staffList.length} staff members
            </p>
          </div>

          {loadingStaff ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
            </div>
          ) : (
            <div className="grid gap-4 mt-4">
              {staffList.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No {selectedStaffRole} found for this clinic.
                </p>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {staff.name}
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{staff.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{staff.phoneNumber}</span>
                          </div>
                          {staff.shifts && staff.shifts.length > 0 && (
                            <div className="flex flex-col gap-1 text-gray-600">
                              {staff.shifts.map((shift, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span>
                                    <strong>Shift {index + 1}</strong>:{" "}
                                    {shift.startDate
                                      ? new Date(
                                          shift.startDate
                                        ).toLocaleDateString()
                                      : "N/A"}{" "}
                                    ({shift.startTime || "N/A"}) →{" "}
                                    {shift.endDate
                                      ? new Date(
                                          shift.endDate
                                        ).toLocaleDateString()
                                      : "N/A"}{" "}
                                    ({shift.endTime || "N/A"})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {staff.joinedDate && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Joined:{" "}
                                {new Date(
                                  staff.joinedDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="default"
                          onClick={() => handleOpenRescheduleModal(staff)}
                          className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          Reschedule
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="flex items-center gap-2 hover:bg-destructive/90 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reschedule Modal - Fixed Positioning */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Reschedule Shift</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRescheduleShift(selectedStaff.id, selectedStaff.role);
                  }}
                  className="flex flex-col gap-3"
                >
                  <div>
                    <label className="block text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newShift.startDate}
                      onChange={(e) =>
                        setNewShift({ ...newShift, startDate: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newShift.endDate}
                      onChange={(e) =>
                        setNewShift({ ...newShift, endDate: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) =>
                        setNewShift({ ...newShift, startTime: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) =>
                        setNewShift({ ...newShift, endTime: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
                    >
                      Reschedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 p-4 rounded-xl text-center ${
                messageType === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

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
              <p className="text-3xl font-bold text-gray-900">
                {staffData?.total}
              </p>
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

            const singularRole = role.endsWith("s") ? role.slice(0, -1) : role;

            return (
              <div
                key={role}
                onClick={() => handleStaffCardClick(singularRole)}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3"
                  style={{ backgroundColor: bgColorMap[singularRole] }}
                >
                  {roleIcons[singularRole]}
                </div>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 font-medium">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
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