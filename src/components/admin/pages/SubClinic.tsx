// components/SubclinicManagement.tsx

import React, { useState, useEffect, useCallback } from "react";
import baseUrl from "../../../baseUrl";
import { useAppDispatch } from "../../../redux/hook";
import { clearCart } from "../../../redux/slice/cartSlice";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../redux/useAuth";
// Type Definitions
interface Subscription {
  package: string;
  type: string;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  nextBillingDate?: string | null;
  lastPaymentDate?: string | null;
  transactionId?: string | null;
}

interface Features {
  patient_management?: {
    records?: boolean;
    appointments?: boolean;
    billing?: boolean;
  };
  inventory?: {
    stock?: boolean;
    orders?: boolean;
    suppliers?: boolean;
  };
  reports?: {
    financial?: boolean;
    medical?: boolean;
    operational?: boolean;
  };
  billing?: {
    invoices?: boolean;
    payments?: boolean;
    tax?: boolean;
  };
  [key: string]: any;
}

interface Clinic {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  type: string;
  isMultipleClinic: boolean;
  subscription?: Subscription;
  features?: Features;
  subClinics?: string[];
  status?: "active" | "inactive" | "pending";
}

// Updated Subclinic interface with more specific address type
interface Subclinic extends Omit<Clinic, "subClinics" | "isMultipleClinic"> {
  parentClinicId: string;
  isSubClinic: boolean;
  isOwnLab: boolean;
  address?:
    | string
    | {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
        location?: {
          type?: string;
          coordinates?: number[];
        };
      };
  description?: string;
  theme?: string;
}

interface FormData {
  name: string;
  type: string;
  email: string;
  phoneNumber: string;
  password: string;
  address: string;
  description: string;
  theme: string;
  isOwnLab: boolean;
}

interface Message {
  type: "success" | "error" | "";
  text: string;
}

interface FeatureCategory {
  label: string;
  subFeatures: string[];
}

interface FeatureCategories {
  [key: string]: FeatureCategory;
}

// Updated Info Component to safely handle any value type
const Info: React.FC<{ label: string; value: any }> = ({ label, value }) => {
  // Function to safely render the value
  const renderValue = () => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "object") {
      // If it's an object, try to extract a readable string or return placeholder
      try {
        // Check if it's an address object with specific fields
        if (value.street || value.city || value.state) {
          const parts = [];
          if (value.street) parts.push(value.street);
          if (value.city) parts.push(value.city);
          if (value.state) parts.push(value.state);
          if (value.country) parts.push(value.country);
          if (value.zipCode) parts.push(value.zipCode);
          return parts.join(", ") || "Address provided";
        }
        // For other objects, return a simple indicator
        return "[Address Details]";
      } catch {
        return "[Complex Object]";
      }
    }

    return String(value);
  };

  return (
    <div className="bg-slate-50 p-3 rounded-lg">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{renderValue()}</div>
    </div>
  );
};

const SubclinicManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    handleSwitchToSubclinic,
    clinicId,
    parentClinicId,
    isSubclinic,
    token,
  } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"subclinics" | "register">(
    "subclinics",
  );
  const [selectedSubclinic, setSelectedSubclinic] = useState<Subclinic | null>(
    null,
  );
  const [parentClinic, setParentClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "",
    email: "",
    phoneNumber: "",
    password: "",
    address: "",
    description: "",
    theme: "green",
    isOwnLab: false,
  });
  const [subclinics, setSubclinics] = useState<Subclinic[]>([]);

  useEffect(() => {
    if (parentClinicId && token) {
      fetchParentClinic();
      fetchSubclinics();
    }
  }, [parentClinicId, token]);

  const showMessage = (type: "success" | "error", text: string): void => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const fetchParentClinic = async () => {
    if (!parentClinicId || !token) return;

    try {
      const response = await axios.get(
        `${baseUrl}api/v1/auth/clinic/view-clinic/${parentClinicId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setParentClinic(response.data.data);
    } catch {
      setFetchError("Failed to load clinic data.");
    }
  };

  const fetchSubclinics = async () => {
    if (!parentClinicId || !token) return;

    try {
      const response = await axios.get(
        `${baseUrl}api/v1/auth/clinic/${parentClinicId}/sub-clinic`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSubclinics(response.data.data || []);
    } catch {
      setFetchError("Failed to load subclinics.");
    }
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!parentClinic?._id) {
      showMessage("error", "Parent clinic not found");
      return;
    }

    if (
      !formData.name ||
      !formData.type ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password
    ) {
      showMessage("error", "Please fill all required fields");
      return;
    }

    if (formData.password.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}api/v1/auth/clinic/register-subclinic/${parentClinicId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        showMessage("success", "Subclinic registered successfully!");
        setFormData({
          name: "",
          type: "",
          email: "",
          phoneNumber: "",
          password: "",
          address: "",
          description: "",
          theme: "green",
          isOwnLab: false,
        });
        fetchSubclinics();
        setActiveTab("subclinics");
      } else {
        showMessage("error", response.data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      showMessage(
        "error",
        error.response?.data?.message || "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void => {
    const { name, value } = e.target;
    const isCheckbox =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox";

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNavigateToSubclinic = useCallback(
    (subclinic: Subclinic) => {
      if (!parentClinicId) {
        console.error("handleNavigateToSubclinic: clinicId is null");
        return;
      }

      handleSwitchToSubclinic(
        subclinic._id,
        parentClinicId,
        subclinic.name,
        subclinic.theme || "green",
      );

      dispatch(clearCart());
      setSelectedSubclinic(null);
      navigate(`/dashboard/${subclinic._id}`);
    },
    [handleSwitchToSubclinic, dispatch, parentClinicId, navigate],
  );

  // Helper function to format address safely
  const formatAddress = (address: any): string => {
    if (!address) return "-";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      if (address.zipCode) parts.push(address.zipCode);
      return parts.length > 0 ? parts.join(", ") : "Address details available";
    }
    return "-";
  };
  if (isSubclinic) {
    return (
      <div className="p-6 text-center text-gray-600">
        Subclinic management is available only for the parent clinic.
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{fetchError}</p>
        <button
          onClick={() => {
            fetchParentClinic();
            fetchSubclinics();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Toast Message */}
      {message.text && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slideIn ${
            message.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subclinic Management
        </h1>
        <p className="text-gray-600">
          Manage subclinics and track their operations
        </p>
      </div>

      {/* Parent Clinic Info */}
      {parentClinic && (
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {parentClinic.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {parentClinic.email} • {parentClinic.phoneNumber}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  Parent Clinic
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {parentClinic.subClinics?.length || 0} Subclinics
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Subscription</div>
              <div className="text-lg font-semibold text-gray-900">
                {parentClinic.subscription?.package || "No Subscription"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("subclinics")}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                activeTab === "subclinics"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Subclinics ({subclinics.length})
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                activeTab === "register"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Register New
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "subclinics" && (
            <div>
              {subclinics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4 text-6xl">🏥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No subclinics registered yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click "Register New" to add your first subclinic
                  </p>
                  <button
                    onClick={() => setActiveTab("register")}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <span>+</span> Register Subclinic
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subclinics.map((subclinic: Subclinic) => (
                    <div
                      key={subclinic._id}
                      className="bg-card border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {subclinic.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 capitalize">
                              {subclinic.type}
                            </p>
                          </div>
                          <span
                            className={`h-3 w-3 rounded-full ${
                              subclinic.subscription?.isActive
                                ? "bg-green-500 animate-pulse"
                                : "bg-red-500"
                            }`}
                          ></span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="truncate">{subclinic.email}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            {subclinic.phoneNumber}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Subscription
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              subclinic.subscription?.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {subclinic.subscription?.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {subclinic.subscription?.package || "No Package"} •
                          Expires:{" "}
                          {subclinic.subscription?.endDate?.split("T")[0] ||
                            "N/A"}
                        </div>
                      </div>

                      <div className="p-4">
                        <button
                          onClick={() => setSelectedSubclinic(subclinic)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Manage Subclinic
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "register" && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Register New Subclinic
                </h2>
                <p className="text-gray-600">
                  Fill in the details below to register a new subclinic under{" "}
                  {parentClinic?.name}
                </p>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-card border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subclinic Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter subclinic name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinic Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="clinic">Clinic</option>
                        <option value="specialty">Specialty Clinic</option>
                        <option value="dental">Dental</option>
                        <option value="pediatric">Pediatric</option>
                        <option value="surgical">Surgical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="subclinic@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="+1234567890"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 8 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme Color
                      </label>
                      <select
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                      placeholder="Full address"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                      placeholder="Describe this subclinic"
                    />
                  </div>

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id="isOwnLab"
                      name="isOwnLab"
                      checked={formData.isOwnLab}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="isOwnLab"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Has its own laboratory
                    </label>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        Subscription Details
                      </h3>
                      <p className="text-green-700 mb-3">
                        This subclinic will inherit the parent's subscription:
                        <span className="font-semibold ml-1">
                          {parentClinic?.subscription?.package || "N/A"}
                        </span>
                      </p>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full font-medium ${
                            parentClinic?.subscription?.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {parentClinic?.subscription?.isActive
                            ? "● Active"
                            : "● Inactive"}
                        </span>
                        {parentClinic?.subscription?.endDate && (
                          <span className="text-green-700">
                            Expires:{" "}
                            <span className="font-medium">
                              {parentClinic.subscription.endDate.split("T")[0]}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setActiveTab("subclinics")}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      "Register Subclinic"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subclinic Details Modal */}
      {selectedSubclinic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl relative animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSubclinic.name}
                </h2>
                <button
                  onClick={() => setSelectedSubclinic(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                {selectedSubclinic.type} • {selectedSubclinic.email}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="Email" value={selectedSubclinic.email} />
                <Info label="Phone" value={selectedSubclinic.phoneNumber} />
                <Info label="Type" value={selectedSubclinic.type} />
                <Info
                  label="Own Lab"
                  value={selectedSubclinic.isOwnLab ? "Yes" : "No"}
                />
                <Info
                  label="Address"
                  value={formatAddress(selectedSubclinic.address)}
                />
                <Info
                  label="Status"
                  value={
                    selectedSubclinic.subscription?.isActive
                      ? "Active"
                      : "Inactive"
                  }
                />
                <Info
                  label="Subscription"
                  value={selectedSubclinic.subscription?.package || "-"}
                />
                <Info
                  label="Expires"
                  value={
                    selectedSubclinic.subscription?.endDate?.split("T")[0] ||
                    "-"
                  }
                />
              </div>

              {selectedSubclinic.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="font-medium text-gray-900">
                    {selectedSubclinic.description}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedSubclinic(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleNavigateToSubclinic(selectedSubclinic)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                    strokeWidth="2"
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                Open Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubclinicManagement;
