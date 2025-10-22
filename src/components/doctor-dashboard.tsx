import React, { use, useState } from "react";
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

const DoctorRegistrationForm: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { token } = useAppSelector((state) => state.auth);

  const { clinicName } = useAppSelector((state) => state.clinic);
  console.log("sa", user);
  console.log("aa", token);

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
  const roleOptions: RoleOption[] = [
    { value: "consulting", label: "Consulting" },
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
            clinicId: "",
          });
          alert("Doctor registered successfully!");
          // Optionally reset form here
        } else {
          alert("Registration failed. Please try again.");
        }
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div
            className="bg-primary p-8 text-white"
            style={{ borderRadius: "20px" }}
          >
            <h1 className="text-3xl font-bold mb-2">Doctor Registration</h1>
            <p className="text-white/90">
              Please fill in your details to complete registration
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* Doctor Unique ID */}
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
                <p className="text-sm text-red-600">{errors.doctorUniqueId}</p>
              )}
            </div>

            {/* Role in Clinic */}
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
                <p className="text-sm text-red-600">{errors.roleInClinic}</p>
              )}
            </div>

            {/* Clinic Email */}
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

            {/* Clinic Password */}
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
                  className="absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  style={{ right: "5px", top: "15px" }}
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
                <p className="text-sm text-red-600">{errors.clinicPassword}</p>
              )}
            </div>

            {/* Standard Consultation Fee */}
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

            {/* Specialization */}
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
                        setErrors((prev) => ({ ...prev, specialization: "" }));
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

              {/* Tags Display */}
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
                <p className="text-sm text-red-600">{errors.specialization}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{ padding: "15px" }}
            >
              Complete Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegistrationForm;
