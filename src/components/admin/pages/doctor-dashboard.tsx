import React, { useState, useEffect } from "react";
import axios from "axios";
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../redux/hook";

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

interface DoctorAvailability {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  clinic: string;
  availabilityId?: string;
}

interface Doctor {
  _id: string;
  doctorUniqueId: string;
  doctorName?: string;
  roleInClinic: string;
  clinicEmail: string;
  standardConsultationFee: number;
  specialization: string[];
  availability: DoctorAvailability[];
  clinicId?: string;
  clinicLogin?: { email?: string; password?: string };
  doctorId?: string;
  name?: string;
  email?: string;
  doctor: {
    _id?: string;
    doctorId?: string;
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
  clinic?: { _id: string; name?: string };
}

interface RemoveModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

interface AvailabilityModalProps {
  isOpen: boolean;
  doctorUniqueId: string;
  doctorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditModalState {
  isOpen: boolean;
  doctor: Doctor | null;
  slotIndex: number | null;
  availabilityId?: string;
}

interface AuthUser {
  name?: string;
  email?: string;
  role?: string;
  _id?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "420px",
          padding: "1.5rem",
          transform: "scale(1)",
          transition: "transform 0.2s ease-out",
        }}
      >
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
            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

const AddAvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  doctorUniqueId,
  doctorName,
  onClose,
  onSuccess,
}) => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const { user } = useAppSelector((state: { auth: AuthState }) => state.auth);
  
  const [availabilityForm, setAvailabilityForm] = useState<DoctorAvailability[]>([
    {
      _id: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      isActive: true,
      clinic: clinicId || "",
    }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAddSlot = () => {
    setAvailabilityForm([
      ...availabilityForm,
      {
        _id: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        isActive: true,
        clinic: clinicId || "",
      }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (availabilityForm.length > 1) {
      const newForm = [...availabilityForm];
      newForm.splice(index, 1);
      setAvailabilityForm(newForm);
    }
  };

  const handleSlotChange = (index: number, field: keyof DoctorAvailability, value: string) => {
    const newForm = [...availabilityForm];
    newForm[index] = { ...newForm[index], [field]: value };
    setAvailabilityForm(newForm);
  };

  const validateForm = (): boolean => {
    for (const slot of availabilityForm) {
      if (!slot.dayOfWeek.trim() || !slot.startTime.trim() || !slot.endTime.trim()) {
        setError("All fields are required for each time slot");
        return false;
      }
      
      if (slot.startTime >= slot.endTime) {
        setError("End time must be after start time");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleSaveAvailability = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      setError("");

      const availabilityData = availabilityForm.map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      }));

      const payload = {
        clinicId: clinicId,
        createdBy: user?._id || clinicId,
        availability: availabilityData
      };

      const response = await axios.post(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/availability-doctor/${doctorUniqueId}`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        alert("Availability added successfully!");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Error adding availability:", error);
      setError(
        error.response?.data?.message || 
        "Failed to add availability. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="p-6"
          style={{
            background: "var(--primary-gradient)",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "white",
                  margin: "0 0 8px 0",
                }}
              >
                Add Doctor Availability
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.9)",
                  margin: 0,
                }}
              >
                Set schedule for {doctorName} (ID: {doctorUniqueId})
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "white",
                color: "var(--primary)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              <svg
                style={{ width: "20px", height: "20px" }}
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
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #ef4444",
                color: "#dc2626",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "28px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "50%",
                }}
              ></span>
              TIME SLOTS
            </h3>
            
            {availabilityForm.map((slot, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "10px",
                  border: "2px solid #60a5fa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1e40af",
                    }}
                  >
                    Slot {index + 1}
                  </span>
                  {availabilityForm.length > 1 && (
                    <button
                      onClick={() => handleRemoveSlot(index)}
                      style={{
                        padding: "6px 10px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#dc2626";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ef4444";
                      }}
                    >
                      <svg
                        style={{ width: "14px", height: "14px" }}
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
                      Remove
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Day of Week
                    </label>
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) => handleSlotChange(index, "dayOfWeek", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #60a5fa",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="">Select Day</option>
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #60a5fa",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "white",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #60a5fa",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "white",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddSlot}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#e0e7ff",
                color: "#4f46e5",
                border: "2px dashed #6366f1",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#c7d2fe";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#e0e7ff";
              }}
            >
              <svg
                style={{ width: "20px", height: "20px" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Another Time Slot
            </button>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#f0f9ff",
              borderRadius: "10px",
              border: "1px solid #bae6fd",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0369a1",
                marginBottom: "8px",
              }}
            >
              📝 Instructions
            </h4>
            <ul
              style={{
                fontSize: "12px",
                color: "#0c4a6e",
                margin: 0,
                paddingLeft: "20px",
              }}
            >
              <li>Select the day of week for each time slot</li>
              <li>Set start and end times for doctor's availability</li>
              <li>You can add multiple time slots for different days</li>
              <li>End time must be after start time</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "20px 28px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "white",
              border: "2px solid #d1d5db",
              color: "#374151",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAvailability}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: "12px",
              background: "var(--primary-gradient)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s",
              opacity: isSaving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            {isSaving ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg
                  className="animate-spin"
                  style={{ width: "18px", height: "18px" }}
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
                Saving...
              </span>
            ) : (
              "Save Availability"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DoctorRegistrationForm: React.FC = () => {
  const { user, token } = useAppSelector(
    (state: { auth: AuthState }) => state.auth
  );

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

  const [currentView, setCurrentView] = useState<"registration" | "doctors">(
    "registration"
  );

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    doctor: Doctor | null;
  }>({ isOpen: false, doctor: null });
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  // Add availability modal state
  const [availabilityModal, setAvailabilityModal] = useState<{
    isOpen: boolean;
    doctorUniqueId: string;
    doctorName: string;
  }>({
    isOpen: false,
    doctorUniqueId: "",
    doctorName: "",
  });

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
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // First, register the doctor
      const response = await axios.post(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/onboard-doctor`,{ ...formData,
    standardConsultationFee: Number(formData.standardConsultationFee)}
        // formData
      );

      if (response.status === 201) {
        const doctorData = response.data.data || response.data;
        const doctorUniqueId = doctorData.doctorUniqueId || formData.doctorUniqueId;
        const doctorName = doctorData.doctorName || "Doctor";

        alert("Doctor registered successfully!");
        
        // Clear form
        setFormData({
          doctorUniqueId: "",
          roleInClinic: "",
          clinicEmail: "",
          clinicPassword: "",
          standardConsultationFee: "",
          specialization: [],
          clinicId: clinicId || "",
        });

        // Open availability modal
        setAvailabilityModal({
          isOpen: true,
          doctorUniqueId,
          doctorName,
        });
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(
        error.response?.data?.message || 
        "An error occurred during registration. Please try again."
      );
    }
  };

  const handleAvailabilitySuccess = () => {
    // Refresh doctors list if on doctors view
    if (currentView === "doctors") {
      fetchDoctors();
    }
  };

  const fetchDoctors = async (): Promise<void> => {
    try {
      setLoadingDoctors(true);

      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/department-based/availability`,
        {
          params: {
            clinicId,
            search: searchTerm || undefined,
            role: filterRole !== "all" ? filterRole : undefined,
          },
        }
      );

      console.log("Fetched doctors response:", response.data);

      let doctorsList: any[] = [];

      if (Array.isArray(response.data)) {
        doctorsList = response.data;
      } else if (Array.isArray(response.data?.doctors)) {
        doctorsList = response.data.doctors;
      } else if (Array.isArray(response.data?.data)) {
        doctorsList = response.data.data;
      } else if (
        response.data?.success &&
        Array.isArray(response.data?.results)
      ) {
        doctorsList = response.data.results;
      }

      const validDoctors = doctorsList
        .filter((doc: any) => doc && (doc._id || doc.doctorId))
        .map((doc: any) => ({
          ...doc,
          specialization: Array.isArray(doc.specialization)
            ? doc.specialization
            : doc.specialization
            ? [doc.specialization]
            : [],
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

  useEffect(() => {
    if (currentView === "doctors") {
      if (searchTerm === "" || searchTerm.length >= 3) {
        fetchDoctors();
      }
    }
  }, [searchTerm, filterRole, currentView]);

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

      const doctorIdToRemove =
        removeModal.doctor.doctorId || removeModal.doctor._id;

      const response = await axios.delete(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/remove/doctor-from-clinic`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            clinicId: clinicId,
            doctorId: doctorIdToRemove,
          },
        }
      );

      if (response.status === 200) {
        setDoctors((prev) =>
          prev.filter((doc) => doc._id !== removeModal.doctor?._id)
        );
        const affectedCount = response.data?.affectedAppointments || 0;
        alert(
          `Doctor removed successfully!${
            affectedCount > 0 ? ` ${affectedCount} appointments updated.` : ""
          }`
        );
        setRemoveModal({ isOpen: false, doctor: null });
        fetchDoctors();
      }
    } catch (error: any) {
      console.error("Error removing doctor:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to remove doctor. Please try again.";
      alert(errorMsg);
    } finally {
      setIsRemoving(false);
    }
  };

  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    doctor: null,
    slotIndex: null,
  });

  const [editAvailabilityForm, setEditAvailabilityForm] = useState<
    DoctorAvailability[]
  >([]);

  const [newSlotForm, setNewSlotForm] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  const openEditModal = (doctor: Doctor) => {
    const firstSlotAvailabilityId =
      doctor?.availability?.[0]?.availabilityId || undefined;

    setEditAvailabilityForm(doctor.availability || []);

    setEditModal({
      isOpen: true,
      doctor,
      slotIndex: null,
      availabilityId: firstSlotAvailabilityId,
    });
  };

  const addEditSlot = () => {
    if (!newSlotForm.dayOfWeek || !newSlotForm.startTime || !newSlotForm.endTime) return;

    setEditAvailabilityForm((prev) => [
      ...prev,
      {
        dayOfWeek: newSlotForm.dayOfWeek,
        startTime: newSlotForm.startTime,
        endTime: newSlotForm.endTime,
        isActive: true,
        _id: "",
        clinic: clinicId!,
      },
    ]);

    setNewSlotForm({
      dayOfWeek: "",
      startTime: "",
      endTime: "",
    });

    setTimeout(() => {
      const container = document.getElementById("availability-scroll");
      container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const removeEditSlot = (index: number) => {
    setEditAvailabilityForm((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAllAvailability = async () => {
    const availabilityId = editModal?.availabilityId;

    if (!availabilityId) {
      alert("❌ No availabilityId found.");
      return;
    }

    try {
      await axios.patch(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/update-availability/${availabilityId}`,
        { clinicId, availability: editAvailabilityForm }
      );

      alert("Availability updated successfully!");

      setEditModal({
        isOpen: false,
        doctor: null,
        slotIndex: null,
        availabilityId: undefined,
      });

      fetchDoctors();
    } catch (error) {
      console.error("❌ Failed to update availability:", error);
      alert("Error updating availability");
    }
  };

  const filteredDoctors = doctors;
  
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
    <div
      slot="card"
      className="min-h-screen bg-muted/60 rounded-xl from-green-50 to-blue-50 py-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {currentView === "registration" && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl shadow-xl overflow-hidden">
              <div
                slot="card"
                className="p-8 text-var(--secondary) rounded-xl"
              >
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
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
                      style={{ right: "10px", top: "15px" }}
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
                  style={{ padding: "10px" }}
                  className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "doctors" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-white p-6 text-var(--secondary)">
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
                    style={{ right: "15px", top: "15px" }}
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
                    style={{ paddingLeft: "15px" }}
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
                    if (!doctorItem) return null;

                    const doctorData = doctorItem || {};
                    const clinicLogin = doctorData.clinicLogin || {};
                    const availability = Array.isArray(doctorData.availability)
                      ? doctorData.availability
                      : [];
                    const specialization = Array.isArray(
                      doctorData.specialization
                    )
                      ? doctorData.specialization
                      : [];

                    return (
                      <div
                        key={
                          doctorData._id ||
                          doctorData.doctorId ||
                          `doctor-${index}`
                        }
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                      >
                        <div className="bg-gradient-to-r from-primary to-blue-600 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h2 className="text-base font-bold text-white mb-1 truncate font-size-lg">
                                {doctorData.doctorName ||
                                  doctorData.name ||
                                  "Unnamed Doctor"}
                              </h2>
                              <h2 className="text-base font-bold  mb-1 truncate font-size-lg">
                                {doctorData.doctor.name || "No ID"}
                              </h2>
                              <p className="text-white/90 text-xs truncate">
                                {doctorData.doctor.uniqueId || "No ID"}
                              </p>
                            </div>
                            {doctorData.roleInClinic && (
                              <div
                                className={`px-2 py-1 rounded-full text-primary font-semibold whitespace-nowrap ml-2 ${getRoleBadgeColor(
                                  doctorData.roleInClinic
                                )}`}
                              >
                                {doctorData.roleInClinic
                                  .charAt(0)
                                  .toUpperCase() +
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
                              {clinicLogin.email ||
                                doctorData.clinicEmail ||
                                doctorData.email ||
                                "No email"}
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
                            <span className="text-xs font-bold text-secondary">
                              ₹{doctorData.standardConsultationFee ?? "N/A"}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1 font-bold">
                              SPECIALIZATIONS
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const specializationData =
                                  doctorData?.specialization &&
                                  doctorData.specialization.length > 0
                                    ? doctorData.specialization
                                    : doctorData?.doctor?.specialization &&
                                      doctorData.doctor.specialization.length >
                                        0
                                    ? doctorData.doctor.specialization
                                    : [];

                                const specialization = Array.isArray(
                                  specializationData
                                )
                                  ? specializationData
                                  : specializationData
                                  ? [specializationData]
                                  : [];

                                if (Array.isArray(specialization)) {
                                  return specialization.length > 0 ? (
                                    specialization.map(
                                      (spec: string, idx: number) => (
                                        <span
                                          key={`${
                                            doctorData._id ||
                                            doctorData.doctorId
                                          }-spec-${idx}`}
                                          className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold text-primary"
                                        >
                                          {spec}
                                        </span>
                                      )
                                    )
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">
                                      No specialization
                                    </span>
                                  );
                                } else if (typeof specialization === "string") {
                                  return (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      {specialization}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="text-gray-400 text-xs italic">
                                      No specialization
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              AVAILABILITY
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {availability.length > 0 ? (
                                availability.map(
                                  (day: DoctorAvailability, i: number) => (
                                    <span
                                      key={i}
                                      onClick={() => openEditModal(doctorItem)}
                                      className="px-2 py-0.5 bg-green-50 rounded text-xs font-bold text-green-700 cursor-pointer hover:bg-green-100"
                                    >
                                      {day.dayOfWeek}: {day.startTime} -{" "}
                                      {day.endTime}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  No schedule set
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="px-4 pb-4 flex gap-2">
                          {availability.length === 0 ? (
                            <button
                              onClick={() => {
                                setAvailabilityModal({
                                  isOpen: true,
                                  doctorUniqueId: doctorData.doctorUniqueId || doctorData.doctor?.uniqueId || "",
                                  doctorName: doctorData.doctorName || doctorData.doctor?.name || "Doctor",
                                });
                              }}
                              className="w-full px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
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
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              Add Availability
                            </button>
                          ) : (
                            <button
                              onClick={() => openEditModal(doctorItem)}
                              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg w-full flex items-center justify-center gap-2"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit Availability
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setRemoveModal({
                                isOpen: true,
                                doctor: doctorItem,
                              })
                            }
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
                            Remove
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

      {/* Add Availability Modal for new doctors */}
      <AddAvailabilityModal
        isOpen={availabilityModal.isOpen}
        doctorUniqueId={availabilityModal.doctorUniqueId}
        doctorName={availabilityModal.doctorName}
        onClose={() => setAvailabilityModal({ isOpen: false, doctorUniqueId: "", doctorName: "" })}
        onSuccess={handleAvailabilitySuccess}
      />

      {/* Edit Availability Modal for existing doctors */}
      {editModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="p-6"
              style={{
                background: "var(--primary-gradient)",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "white",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Edit Doctor Availability
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.9)",
                      margin: 0,
                    }}
                  >
                    Manage schedule for{" "}
                    {editModal.doctor?.doctorName ||
                      editModal.doctor?.doctor?.name ||
                      editModal.doctor?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditModal({
                      isOpen: false,
                      doctor: null,
                      slotIndex: null,
                    });
                    setNewSlotForm({ dayOfWeek: "", startTime: "", endTime: "" });
                  }}
                  style={{
                    backgroundColor: "white",
                    color: "var(--primary)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <svg
                    style={{ width: "20px", height: "20px" }}
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
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              id="availability-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 28px",
              }}
            >
              {/* Existing Slots */}
              {editAvailabilityForm.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#10b981",
                        borderRadius: "50%",
                      }}
                    ></span>
                    CURRENT SCHEDULE ({editAvailabilityForm.length} slots)
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {editAvailabilityForm.map((slot, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "16px",
                          backgroundColor: "#d1fae5",
                          borderRadius: "10px",
                          border: "1px solid #6ee7b7",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <select
                            value={slot.dayOfWeek}
                            onChange={(e) => {
                              const updated = [...editAvailabilityForm];
                              updated[index].dayOfWeek = e.target.value;
                              setEditAvailabilityForm(updated);
                            }}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #6ee7b7",
                              borderRadius: "8px",
                              fontSize: "14px",
                              backgroundColor: "white",
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <option value="">Day</option>
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const updated = [...editAvailabilityForm];
                              updated[index].startTime = e.target.value;
                              setEditAvailabilityForm(updated);
                            }}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #6ee7b7",
                              borderRadius: "8px",
                              fontSize: "14px",
                              backgroundColor: "white",
                              outline: "none",
                            }}
                          />

                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const updated = [...editAvailabilityForm];
                              updated[index].endTime = e.target.value;
                              setEditAvailabilityForm(updated);
                            }}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #6ee7b7",
                              borderRadius: "8px",
                              fontSize: "14px",
                              backgroundColor: "white",
                              outline: "none",
                            }}
                          />
                        </div>

                        <button
                          onClick={() => removeEditSlot(index)}
                          style={{
                            padding: "8px",
                            color: "#ef4444",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#fee2e2")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                          title="Remove slot"
                        >
                          <svg
                            style={{ width: "20px", height: "20px" }}
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
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Slot Section */}
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#3b82f6",
                      borderRadius: "50%",
                    }}
                  ></span>
                  ADD NEW TIME SLOT
                </h3>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "10px",
                    border: "2px dashed #60a5fa",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }}
                      >
                        Day of Week
                      </label>
                      <select
                        value={newSlotForm.dayOfWeek}
                        onChange={(e) =>
                          setNewSlotForm({
                            ...newSlotForm,
                            dayOfWeek: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #60a5fa",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "white",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="">Select Day</option>
                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }}
                      >
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newSlotForm.startTime}
                        onChange={(e) =>
                          setNewSlotForm({
                            ...newSlotForm,
                            startTime: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #60a5fa",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "white",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "6px",
                        }}
                      >
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newSlotForm.endTime}
                        onChange={(e) =>
                          setNewSlotForm({ ...newSlotForm, endTime: e.target.value })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #60a5fa",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "white",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={addEditSlot}
                    disabled={
                      !newSlotForm.dayOfWeek ||
                      !newSlotForm.startTime ||
                      !newSlotForm.endTime
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor:
                        !newSlotForm.dayOfWeek ||
                        !newSlotForm.startTime ||
                        !newSlotForm.endTime
                          ? "#d1d5db"
                          : "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor:
                        !newSlotForm.dayOfWeek ||
                        !newSlotForm.startTime ||
                        !newSlotForm.endTime
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (
                        newSlotForm.dayOfWeek &&
                        newSlotForm.startTime &&
                        newSlotForm.endTime
                      ) {
                        e.currentTarget.style.backgroundColor = "#2563eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (
                        newSlotForm.dayOfWeek &&
                        newSlotForm.startTime &&
                        newSlotForm.endTime
                      ) {
                        e.currentTarget.style.backgroundColor = "#3b82f6";
                      }
                    }}
                  >
                    <svg
                      style={{ width: "20px", height: "20px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add to Schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              className="p-6 bg-gray-50"
              style={{
                padding: "20px 28px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  setEditModal({
                    isOpen: false,
                    doctor: null,
                    slotIndex: null,
                  });
                  setNewSlotForm({ dayOfWeek: "", startTime: "", endTime: "" });
                }}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50"
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "white",
                  border: "2px solid #d1d5db",
                  color: "#374151",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.borderColor = "#9ca3af";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAllAvailability}
                className="bg-primary hover:bg-blue-700 text-white"
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--primary-gradient)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRegistrationForm;