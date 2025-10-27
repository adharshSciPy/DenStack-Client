import React, { useState, useEffect } from "react";
import axios from "axios";
import clinicServiceBaseUrl from "../clinicServiceBaseUrl";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../redux/hook";

interface FormData {
  doctorUniqueId: string;
  roleInClinic: string;
  clinicEmail: string;
  clinicPassword: string;
  standardConsultationFee: string;
  specialization: string[];
  clinicId?: string;
}

interface FormErrors {
  doctorUniqueId?: string;
  roleInClinic?: string;
  clinicEmail?: string;
  clinicPassword?: string;
  standardConsultationFee?: string;
  specialization?: string;
  clinicId?: string;
}

interface RoleOption {
  value: string;
  label: string;
}

interface DoctorSlot {
  startTime: string;
  endTime: string;
}

interface DoctorAvailability {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  clinic: string;
}


interface Doctor {
  _id: string;
  doctorUniqueId: string;
  doctorName?: string;
  roleInClinic: string;
  clinicEmail: string;
  standardConsultationFee: number;
  specialization: string[];
  availability?: DoctorAvailability[];
  clinicLogin?: { email?: string; password?: string };
  doctorId?: string;
  name?: string;
  email?: string;
   doctor: {
    name: string;
    email: string;
    phoneNumber: number;
    licenseNumber: string;
    specialization: string | string[];
    uniqueId: string;
    approve: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface RemoveModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const RemoveModal: React.FC<RemoveModalProps> = ({
  isOpen,
  doctor,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Remove Doctor
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-gray-900">
            {doctor.doctorName || doctor.name || doctor.doctorUniqueId}
          </span>{" "}
          from the clinic? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Removing...
              </>
            ) : (
              "Remove Doctor"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DoctorRegistrationForm: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { token } = useAppSelector((state) => state.auth);
  const { clinicName } = useAppSelector((state) => state.clinic);
  const { clinicId } = useParams<{ clinicId: string }>();

  const [formData, setFormData] = useState<FormData>({
    doctorUniqueId: "",
    roleInClinic: "",
    clinicEmail: "",
    clinicPassword: "",
    standardConsultationFee: "",
    specialization: [],
    clinicId: clinicId || "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [specializationInput, setSpecializationInput] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [currentView, setCurrentView] = useState<"registration" | "doctors">("registration");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    doctor: Doctor | null;
  }>({ isOpen: false, doctor: null });
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const roleOptions: RoleOption[] = [
    { value: "consultant", label: "Consulting" },
    { value: "visiting", label: "Visiting" },
    { value: "permanent", label: "Permanent" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddSpecialization = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Enter" && specializationInput.trim()) {
      e.preventDefault();
      const trimmedValue = specializationInput.trim();
      if (!formData.specialization.includes(trimmedValue)) {
        setFormData((prev) => ({
          ...prev,
          specialization: [...prev.specialization, trimmedValue],
        }));
      }
      setSpecializationInput("");
      if (errors.specialization) {
        setErrors((prev) => ({ ...prev, specialization: "" }));
      }
    }
  };

  const handleRemoveSpecialization = (specToRemove: string): void => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.filter((s) => s !== specToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.doctorUniqueId.trim()) {
      newErrors.doctorUniqueId = "Doctor Unique ID is required";
    }

    if (!formData.roleInClinic) {
      newErrors.roleInClinic = "Role in clinic is required";
    }

    if (!formData.clinicEmail.trim()) {
      newErrors.clinicEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clinicEmail)) {
      newErrors.clinicEmail = "Invalid email format";
    }

    if (!formData.clinicPassword) {
      newErrors.clinicPassword = "Password is required";
    } else if (formData.clinicPassword.length < 8) {
      newErrors.clinicPassword = "Password must be at least 8 characters";
    }

    if (!formData.standardConsultationFee) {
      newErrors.standardConsultationFee = "Consultation fee is required";
    } else if (
      isNaN(Number(formData.standardConsultationFee)) ||
      Number(formData.standardConsultationFee) <= 0
    ) {
      newErrors.standardConsultationFee = "Please enter a valid fee";
    }

    if (formData.specialization.length === 0) {
      newErrors.specialization = "Please add at least one specialization";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    if (validateForm()) {
      try {
        const response = await axios.post(
          `${clinicServiceBaseUrl}/api/v1/clinic-service/onboard-doctor`,
          formData
        );

        if (response.status === 201) {
          setFormData({
            doctorUniqueId: "",
            roleInClinic: "",
            clinicEmail: "",
            clinicPassword: "",
            standardConsultationFee: "",
            specialization: [],
            clinicId: clinicId || "",
          });

          alert("Doctor registered successfully!");
        } else {
          alert("Registration failed. Please try again.");
        }
      } catch (error) {
        console.log(error);
        alert("An error occurred during registration.");
      }
    }
  };

  const fetchDoctors = async (): Promise<void> => {
    try {
      setLoadingDoctors(true);
      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/department-based/availability`,
        { params: { clinicId } }
      );
      console.log("Fetched doctors response:", response.data);
      
      // Handle different possible response structures
      let doctorsList = [];
      if (Array.isArray(response.data)) {
        doctorsList = response.data;
      } else if (response.data?.doctors && Array.isArray(response.data.doctors)) {
        doctorsList = response.data.doctors;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        doctorsList = response.data.data;
      }
      
      // Filter out null/undefined and ensure all required fields exist
      const validDoctors = doctorsList.filter((doc: any) => {
        return doc && (doc._id || doc.doctorId);
      }).map((doc: any) => ({
        ...doc,
        specialization: Array.isArray(doc.specialization) ? doc.specialization : [],
        availability: Array.isArray(doc.availability) ? doc.availability : [],
      }));
      
      setDoctors(validDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleViewDoctors = (): void => {
    setCurrentView("doctors");
    setSearchTerm("");
    setFilterRole("all");
    fetchDoctors();
  };

  const handleBackToRegistration = (): void => {
    setCurrentView("registration");
  };

  const handleRemoveDoctor = async (): Promise<void> => {
    if (!removeModal.doctor) return;

    try {
      setIsRemoving(true);
      
      // Get the correct doctorId
      const doctorIdToRemove = removeModal.doctor.doctorId || removeModal.doctor._id;
      
      const response = await axios.delete(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/remove/doctor-from-clinic`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            clinicId: clinicId,
            doctorId: doctorIdToRemove,
          }
        }
      );

      if (response.status === 200) {
        setDoctors((prev) =>
          prev.filter((doc) => doc._id !== removeModal.doctor?._id)
        );
        const affectedCount = response.data?.affectedAppointments || 0;
        alert(`Doctor removed successfully!${affectedCount > 0 ? ` ${affectedCount} appointments updated.` : ''}`);
        setRemoveModal({ isOpen: false, doctor: null });
      }
    } catch (error: any) {
      console.error("Error removing doctor:", error);
      const errorMsg = error.response?.data?.message || "Failed to remove doctor. Please try again.";
      alert(errorMsg);
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (!doctor) return false;
    
    const id = doctor?.doctorUniqueId || doctor?.doctorId || "";
    const email = doctor?.clinicEmail || doctor?.email || "";
    const specializations = Array.isArray(doctor?.specialization)
      ? doctor.specialization
      : [];

    const matchesSearch =
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specializations.some((spec) =>
        (spec || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesRole = filterRole === "all" || doctor?.roleInClinic === filterRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case "consultant":
        return "bg-blue-100 text-blue-700";
      case "visiting":
        return "bg-purple-100 text-purple-700";
      case "permanent":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {currentView === "registration" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-primary p-8 text-white rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Doctor Registration
                    </h1>
                    <p className="text-white/90">
                      Please fill in your details to complete registration
                    </p>
                  </div>
                  <button
                    onClick={handleViewDoctors}
                    className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    View Doctors
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="doctorUniqueId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Doctor Unique ID
                  </label>
                  <input
                    type="text"
                    id="doctorUniqueId"
                    name="doctorUniqueId"
                    value={formData.doctorUniqueId}
                    onChange={handleChange}
                    placeholder="e.g., DCS-DR-870723"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  {errors.doctorUniqueId && (
                    <p className="text-sm text-red-600">
                      {errors.doctorUniqueId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="roleInClinic"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role in Clinic
                  </label>
                  <select
                    id="roleInClinic"
                    name="roleInClinic"
                    value={formData.roleInClinic}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="">Select a role</option>
                    {roleOptions.map((option: RoleOption) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.roleInClinic && (
                    <p className="text-sm text-red-600">
                      {errors.roleInClinic}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="clinicEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Clinic Email
                  </label>
                  <input
                    type="email"
                    id="clinicEmail"
                    name="clinicEmail"
                    value={formData.clinicEmail}
                    onChange={handleChange}
                    placeholder="clinic@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  {errors.clinicEmail && (
                    <p className="text-sm text-red-600">{errors.clinicEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="clinicPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Clinic Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="clinicPassword"
                      name="clinicPassword"
                      value={formData.clinicPassword}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.clinicPassword && (
                    <p className="text-sm text-red-600">
                      {errors.clinicPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="standardConsultationFee"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Standard Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    id="standardConsultationFee"
                    name="standardConsultationFee"
                    value={formData.standardConsultationFee}
                    onChange={handleChange}
                    placeholder="300"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  {errors.standardConsultationFee && (
                    <p className="text-sm text-red-600">
                      {errors.standardConsultationFee}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="specializationInput"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Specialization
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="specializationInput"
                      value={specializationInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSpecializationInput(e.target.value)
                      }
                      onKeyDown={handleAddSpecialization}
                      placeholder="Type specialization (e.g., Dental)"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (specializationInput.trim()) {
                          const trimmedValue = specializationInput.trim();
                          if (!formData.specialization.includes(trimmedValue)) {
                            setFormData((prev) => ({
                              ...prev,
                              specialization: [
                                ...prev.specialization,
                                trimmedValue,
                              ],
                            }));
                          }
                          setSpecializationInput("");
                          if (errors.specialization) {
                            setErrors((prev) => ({
                              ...prev,
                              specialization: "",
                            }));
                          }
                        }
                      }}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Type and click Add button or press Enter
                  </p>

                  {formData.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formData.specialization.map(
                        (spec: string, index: number) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span>{spec}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialization(spec)}
                              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {errors.specialization && (
                    <p className="text-sm text-red-600">
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "doctors" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-primary p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Clinic Doctors</h2>
                  <p className="text-white/90 text-sm mt-1">
                    Manage your clinic's medical team
                  </p>
                </div>
                <button
                  onClick={handleBackToRegistration}
                  className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Registration
                </button>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by ID, email, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="consultant">Consulting</option>
                  <option value="visiting">Visiting</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {doctors.length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600">Filtered</p>
                  <p className="text-xl font-bold text-gray-900">
                    {filteredDoctors.length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600">Specializations</p>
                  <p className="text-xl font-bold text-gray-900">
                    {new Set(doctors.flatMap((d) => d.specialization)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg
                      className="animate-spin h-12 w-12 text-primary mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-gray-600">Loading doctors...</p>
                  </div>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Doctors Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterRole !== "all"
                      ? "Try adjusting your search or filters"
                      : "No doctors registered yet"}
                  </p>
                  <button
                    onClick={handleBackToRegistration}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Register a Doctor
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDoctors.map((doctorItem, index) => {
                    // Safety check
                    if (!doctorItem) return null;
                    
                    const doctorData = doctorItem || {};
                    const clinicLogin = doctorData.clinicLogin || {};
                    const availability = Array.isArray(doctorData.availability) 
                      ? doctorData.availability 
                      : [];
                    const specialization = Array.isArray(doctorData.specialization)
                      ? doctorData.specialization
                      : [];

                    return (
                      <div
                        key={doctorData._id || doctorData.doctorId || `doctor-${index}`}
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                      >
                        <div className="bg-gradient-to-r from-primary to-blue-600 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-white mb-1 truncate">
                                {doctorData.doctorName || doctorData.name || "Unnamed Doctor"}
                              </h3>
                              <p className="text-white/90 text-xs truncate">
                                {doctorData.doctorId || doctorData.doctorUniqueId || "No ID"}
                              </p>
                            </div>
                            {doctorData.roleInClinic && (
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getRoleBadgeColor(
                                  doctorData.roleInClinic
                                )}`}
                              >
                                {doctorData.roleInClinic.charAt(0).toUpperCase() +
                                  doctorData.roleInClinic.slice(1)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs truncate">
                              {clinicLogin.email || doctorData.clinicEmail || doctorData.email || "No email"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs font-medium">
                              ₹{doctorData.standardConsultationFee ?? "N/A"}
                            </span>
                          </div>

                         <div>
  <p className="text-xs font-semibold text-gray-600 mb-1">
    SPECIALIZATIONS
  </p>
  <div className="flex flex-wrap gap-1">
    {Array.isArray(doctorData?.doctor?.specialization) ? (
      doctorData.doctor.specialization.length > 0 ? (
        doctorData.doctor.specialization.map((spec: string, idx: number) => (
          <span
            key={`${doctorData._id}-spec-${idx}`}
            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
          >
            {spec}
          </span>
        ))
      ) : (
        <span className="text-gray-400 text-xs italic">
          No specialization
        </span>
      )
    ) : doctorData?.doctor?.specialization ? (
      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
        {doctorData.doctor.specialization}
      </span>
    ) : (
      <span className="text-gray-400 text-xs italic">No specialization</span>
    )}
  </div>
</div>


                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              AVAILABILITY
                            </p>
   <div className="flex flex-wrap gap-1">
  {availability.length > 0 ? (
    availability.map((day: DoctorAvailability, i: number) => (
      <span
        key={`${doctorData.doctorId || doctorData._id || index}-${day.dayOfWeek}-${i}`}
        className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs"
      >
        {day.dayOfWeek}: {day.startTime} - {day.endTime}
      </span>
    ))
  ) : (
    <span className="text-gray-400 text-xs italic">
      No schedule set
    </span>
  )}
</div>


                          </div>
                        </div>

                        <div className="px-4 pb-4">
                          <button
                            onClick={() => setRemoveModal({ isOpen: true, doctor: doctorItem })}
                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Remove Doctor
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <RemoveModal
        isOpen={removeModal.isOpen}
        doctor={removeModal.doctor}
        onClose={() => setRemoveModal({ isOpen: false, doctor: null })}
        onConfirm={handleRemoveDoctor}
        isLoading={isRemoving}
      />
    </div>
  );
};

export default DoctorRegistrationForm;