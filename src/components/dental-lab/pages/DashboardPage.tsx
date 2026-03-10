import React, { useState, useEffect, JSX } from "react";
import {
  Building2,
  Clock,
  CheckCircle,
  DollarSign,
  Zap,
  ChevronRight,
  Eye,
  Loader,
  Package,
  Truck,
  Plus,
  X,
  User,
  FileText,
  Upload,
  Calendar,
  Loader2,
} from "lucide-react";
import StatCard from "../components/common/StatCard";
import { useAppSelector } from "../../../redux/hook";
import labBaseUrl from "../../../labBaseUrl";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

// ---------- TYPES ----------
interface LabStatus {
  completedOrders: number;
  pendingOrders: number;
  totalLabs: number;
  totalOrders: number;
}

// In-house lab order type
interface InHouseLabOrder {
  _id: string;
  clinicId: string;
  labId: string;
  doctorId: string;
  patientId: string;
  consultationId?: string;
  patientname?: string;
  doctorName?: string;
  note?: string;
  toothNumbers?: string[];
  expectedDeliveryDate?: string;
  price?: number;
  deliveryDate?: string;
  status: string;
  statusHistory?: {
    status: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Aligner lab order type
interface AlignerLabOrder {
  doctorName: string;
  totalAmount: number;
  _id: string;
  vendor: string;
  dentist: string;
  patientName: string;
  niftiFile: {
    fileName: string;
    fileUrl: string;
  };
  note?: string;
  price: number;
  status: string;
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

// Combined type for display
interface DisplayLabOrder {
  _id: string;
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  doctorId?: string;
  status: string;
  deliveryDate?: string;
  price?: number;
  createdAt: string;
}

interface LabOrderResponse {
  count: number;
  labOrders: InHouseLabOrder[];
  message: string;
  hasNextPage: boolean;
  nextCursor?: string;
}

// Modal form data types
interface FormData {
  vendor: string;
  dentist: string;
  patientName: string;
  patientId?: string;
  deliveryDate: string;
  price: string;
  note: string;
  trays: {
    upperArch: number;
    lowerArch: number;
  };
  stlFiles: {
    upper: File | null;
    lower: File | null;
    total: File | null;
  };
}

// ---------- STATUS CONFIG ----------
const statusConfig: Record<
  string,
  {
    label: string;
    badge: string;
    icon: JSX.Element;
  }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700 border border-amber-300",
    icon: <Clock className="w-3 h-3" />,
  },
  processing: {
    label: "Processing",
    badge: "bg-blue-100 text-blue-700 border border-blue-300",
    icon: <Loader className="w-3 h-3 animate-spin-slow" />,
  },
  ready: {
    label: "Completed",
    badge: "bg-green-100 text-green-700 border border-green-300",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  delivered: {
    label: "Delivered",
    badge: "bg-purple-100 text-purple-700 border border-purple-300",
    icon: <Truck className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-100 text-red-700 border border-red-300",
    icon: <Package className="w-3 h-3 line-through" />,
  },
  draft: {
    label: "Draft",
    badge: "bg-gray-100 text-gray-700 border border-gray-300",
    icon: <Package className="w-3 h-3" />,
  },
};

// ---------- PAGE ----------
const DashboardPage = () => {
  const [labOrders, setLabOrders] = useState<LabStatus | null>(null);
  const clinicId = useAppSelector((state: any) => state.auth.user.id);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);
  const [pageSize] = useState(5);
  const [searchParams] = useSearchParams();
  const [labData, setLabData] = useState<DisplayLabOrder[] | null>(null);
  const labOrderId = useAppSelector((state) => state.auth.user?.labVendorId);
  const [searchQuery] = useState(searchParams.get("search") || "");
  const [selectedStatus] = useState(searchParams.get("status") || "all");
  const labType = useAppSelector((state) => state.auth.user?.labType);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    vendor: "",
    dentist: "",
    patientName: "",
    patientId: "",
    deliveryDate: "",
    price: "",
    note: "",
    trays: {
      upperArch: 0,
      lowerArch: 0,
    },
    stlFiles: {
      upper: null,
      lower: null,
      total: null,
    },
  });

  // Fetch Labs based on lab type
  const fetchLabs = async () => {
    setLabsLoading(true);
    try {
      let endpoint = "";
      if (labType === "inHouse") {
        endpoint = `${labBaseUrl}api/v1/lab/inhouse`;
      } else if (labType === "aligner") {
        endpoint = `${labBaseUrl}api/v1/lab/aligner-vendors`;
      } else {
        endpoint = `${labBaseUrl}api/v1/lab/external`;
      }
      
      const response = await axios.get(endpoint);
      setLabs(response.data.labs || response.data);
    } catch (err) {
      console.error("Error fetching labs:", err);
    } finally {
      setLabsLoading(false);
    }
  };

  // Fetch Doctors
  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${labBaseUrl}api/v1/doctors/clinic/${clinicId}`);
      setDoctors(response.data.doctors || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  // Search Patients
  const searchPatients = async (search: string) => {
    if (search.length < 3) {
      setPatientResults([]);
      return;
    }

    setPatientLoading(true);
    try {
      const response = await axios.get(
        `${labBaseUrl}api/v1/patients/search?clinicId=${clinicId}&search=${search}`
      );
      setPatientResults(response.data.patients || []);
    } catch (err) {
      console.error("Error searching patients:", err);
    } finally {
      setPatientLoading(false);
    }
  };

  // Debounced patient search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch) {
        searchPatients(patientSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Open modal and fetch required data
  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchLabs();
    fetchDoctors();
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      vendor: "",
      dentist: "",
      patientName: "",
      patientId: "",
      deliveryDate: "",
      price: "",
      note: "",
      trays: {
        upperArch: 0,
        lowerArch: 0,
      },
      stlFiles: {
        upper: null,
        lower: null,
        total: null,
      },
    });
    setPatientSearch("");
    setPatientResults([]);
    setFiles([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Common fields
      formDataToSend.append("vendor", formData.vendor);
      formDataToSend.append("dentist", formData.dentist);
      formDataToSend.append("patientId", formData.patientId || formData.patientName);
      formDataToSend.append("deliveryDate", formData.deliveryDate);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("note", formData.note);
      
      if (labType === "aligner") {
        // Aligner specific fields
        formDataToSend.append("upperArchTrays", formData.trays.upperArch.toString());
        formDataToSend.append("lowerArchTrays", formData.trays.lowerArch.toString());
        
        if (formData.stlFiles.upper) {
          formDataToSend.append("upperStl", formData.stlFiles.upper);
        }
        if (formData.stlFiles.lower) {
          formDataToSend.append("lowerStl", formData.stlFiles.lower);
        }
        if (formData.stlFiles.total) {
          formDataToSend.append("totalStl", formData.stlFiles.total);
        }
        
        await axios.post(`${labBaseUrl}api/v1/aligners/orders`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // In-house or external lab
        files.forEach((file) => {
          formDataToSend.append("attachments", file);
        });
        
        const endpoint = labType === "inHouse" 
          ? `${labBaseUrl}api/v1/lab-orders`
          : `${labBaseUrl}api/v1/lab-orders/external`;
        
        await axios.post(endpoint, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setIsModalOpen(false);
      // Refresh data after successful order creation
      if (labType === "inHouse") {
        fetchInHouseOrders();
      } else if (labType === "aligner") {
        fetchAlignerOrders();
      }
      fetchStats();
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Failed to create order. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    let endpoint = "";
    if (labType === "inHouse") {
      endpoint = `api/v1/lab-orders/lab-status/${labOrderId}`;
    } else if (labType === "aligner") {
      endpoint = `api/v1/aligners/vendor/latest-orders/${labOrderId}`;
    } else {
      console.error("Unknown lab type:", labType);
      return;
    }
    try {
      const statsResponse = await axios.get(`${labBaseUrl}${endpoint}`);

      if (labType === "inHouse") {
        setLabOrders({
          totalLabs: statsResponse.data.stats.totalLabs || 0,
          pendingOrders: statsResponse.data.stats.pendingOrders || 0,
          completedOrders: statsResponse.data.stats.completedOrders || 0,
          totalOrders: statsResponse.data.stats.totalOrders || 0,
        });
      } else if (labType === "aligner") {
        setLabOrders({
          totalLabs: statsResponse.data.stats?.totalLabs || 0,
          pendingOrders:
            statsResponse.data.stats?.pendingOrders ||
            statsResponse.data.stats?.pendingCount ||
            0,
          completedOrders:
            statsResponse.data.stats?.completedOrders ||
            statsResponse.data.stats?.completedCount ||
            0,
          totalOrders: statsResponse.data.stats?.totalOrders || 0,
        });

        // Transform aligner orders for display
        if (
          statsResponse.data.latestOrders &&
          Array.isArray(statsResponse.data.latestOrders)
        ) {
          const transformedOrders: DisplayLabOrder[] =
            statsResponse.data.latestOrders.map((order: AlignerLabOrder) => ({
              _id: order._id,
              patientName: order.patientName,
              doctorName: order.dentist,
              status: order.status,
              deliveryDate: order.updatedAt,
              price: order.price,
              createdAt: order.createdAt,
            }));
          setLabData(transformedOrders);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to fetch statistics");
    }
  };

  // Fetch Orders for in-house lab
  const fetchInHouseOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = { limit: pageSize };

      if (cursors[currentCursorIndex])
        params.cursor = cursors[currentCursorIndex];
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await axios.get(
        `${labBaseUrl}api/v1/lab-orders/lab/${labOrderId}`,
        { params },
      );

      const { hasNextPage, nextCursor, labOrders } = response.data;

      if (labOrders && Array.isArray(labOrders)) {
        const transformedOrders: DisplayLabOrder[] = labOrders.map(
          (order: InHouseLabOrder) => ({
            _id: order._id,
            patientName: order.patientname,
            patientId: order.patientId,
            doctorName: order.doctorName,
            doctorId: order.doctorId,
            status: order.status,
            deliveryDate: order.deliveryDate || order.expectedDeliveryDate,
            price: order.price,
            createdAt: order.createdAt,
          }),
        );
        setLabData(transformedOrders);
      }

      if (hasNextPage && nextCursor) {
        setCursors((prev) => {
          const trimmed = prev.slice(0, currentCursorIndex + 1);
          if (trimmed[trimmed.length - 1] !== nextCursor)
            trimmed.push(nextCursor);
          return trimmed;
        });
      }
    } catch (err) {
      console.error("Error fetching lab orders:", err);
      setError("Failed to load lab orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Aligner orders
  const fetchAlignerOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${labBaseUrl}api/v1/aligners/vendor/latest-orders/${labOrderId}`,
      );

      if (
        response.data.alignerOrders &&
        Array.isArray(response.data.alignerOrders)
      ) {
        const transformedOrders: DisplayLabOrder[] =
          response.data.alignerOrders.map((order: AlignerLabOrder) => ({
            _id: order._id,
            patientName: order.patientName,
            doctorName: order.doctorName,
            status: order.status,
            deliveryDate: order.updatedAt,
            price: order.totalAmount,
            createdAt: order.createdAt,
          }));
        setLabData(transformedOrders);
      }
    } catch (err) {
      console.error("Error fetching aligner orders:", err);
      setError("Failed to load aligner orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [labOrderId, labType]);

  useEffect(() => {
    if (labType === "inHouse") {
      fetchInHouseOrders();
    } else if (labType === "aligner") {
      fetchAlignerOrders();
    }
  }, [labOrderId, currentCursorIndex, selectedStatus, searchQuery, labType]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          label="Total Lab Vendors"
          value={labOrders?.totalLabs ?? 0}
          color="bg-gradient-to-br from-blue-600 to-blue-700"
          gradient="bg-gradient-to-br from-blue-100 to-indigo-100"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={labOrders?.pendingOrders ?? 0}
          color="bg-gradient-to-br from-amber-600 to-orange-600"
          gradient="bg-gradient-to-br from-amber-100 to-orange-100"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Orders"
          value={labOrders?.completedOrders ?? 0}
          color="bg-gradient-to-br from-emerald-600 to-green-600"
          gradient="bg-gradient-to-br from-emerald-100 to-green-100"
        />
        <StatCard
          icon={DollarSign}
          label="Total Orders"
          value={labOrders?.totalOrders ?? 0}
          color="bg-gradient-to-br from-purple-600 to-pink-600"
          gradient="bg-gradient-to-br from-purple-100 to-pink-100"
        />
      </div>

      {/* Recent Orders Header with Create Button */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Recent Orders
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Latest lab order activity
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Create Order
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {labData && labData.length > 0 ? (
                  labData.map((order: DisplayLabOrder) => {
                    const config =
                      statusConfig[order.status] || statusConfig.pending;

                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                              {order.patientName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.patientName || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                          {order.doctorName || "N/A"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.badge}`}
                          >
                            {config.icon}
                            {order.status || "pending"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                          {order.deliveryDate
                            ? new Date(order.deliveryDate).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">
                            ₹{order.price || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            overflow: "hidden",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                zIndex: 10,
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#111827",
                  margin: 0,
                }}
              >
                Create {labType === "aligner" ? "Aligner" : "Dental Lab"} Order
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gap: "20px" }}>
                {/* Lab Selection */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Building2 size={18} color="#6b7280" />
                    {labType === "inHouse"
                      ? "In-House Lab *"
                      : labType === "aligner"
                        ? "Aligner Lab *"
                        : "External Lab *"}
                  </label>
                  {labsLoading ? (
                    <div
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Loader2 size={16} className="animate-spin" />
                      Loading labs...
                    </div>
                  ) : (
                    <select
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#3b82f6")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#d1d5db")
                      }
                    >
                      <option value="">
                        Select{" "}
                        {labType === "inHouse"
                          ? "In-House Lab"
                          : labType === "aligner"
                            ? "Aligner Lab"
                            : "External Lab"}
                      </option>
                      {labs.map((lab: any) => (
                        <option key={lab._id} value={lab._id}>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!labsLoading && labs.length === 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#ef4444",
                      }}
                    >
                      No labs found for this category
                    </div>
                  )}
                </div>

                {/* Dentist */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <User size={18} color="#6b7280" />
                    Dentist *
                  </label>
                  <select
                    name="dentist"
                    value={formData.dentist}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor: any) => (
                      <option key={doctor._id} value={doctor.doctor._id}>
                        {doctor?.doctor?.name || ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Name */}
                <div style={{ position: "relative" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <User size={18} color="#6b7280" />
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        patientName: e.target.value,
                      }));
                    }}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                    placeholder="Enter patient name"
                  />

                  {patientResults.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "85px",
                        left: 0,
                        width: "100%",
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: 0,
                        margin: 0,
                        listStyle: "none",
                        maxHeight: "200px",
                        overflowY: "auto",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 2000,
                      }}
                    >
                      {patientResults.map((p: any) => (
                        <li
                          key={p._id}
                          style={{
                            padding: "10px",
                            borderBottom: "1px solid #eee",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setPatientSearch(p.name);
                            setFormData((prev) => ({
                              ...prev,
                              patientName: p.name,
                              patientId: p._id,
                            }));
                            setPatientResults([]);
                          }}
                        >
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {patientLoading && patientSearch.length >= 3 && (
                    <div style={{ marginTop: "5px", fontSize: "12px" }}>
                      Loading...
                    </div>
                  )}
                </div>

                {/* Delivery Date */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Calendar size={18} color="#6b7280" />
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <DollarSign size={18} color="#6b7280" />
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Aligner-specific fields */}
                {labType === "aligner" && (
                  <>
                    {/* Trays Section */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "12px",
                        }}
                      >
                        <FileText size={18} color="#6b7280" />
                        Number of Trays *
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                        }}
                      >
                        {/* Upper Arch Trays */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "6px",
                            }}
                          >
                            Upper Arch
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.trays.upperArch}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                trays: {
                                  ...prev.trays,
                                  upperArch: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            required
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              fontSize: "14px",
                              outline: "none",
                              transition: "border-color 0.2s",
                              boxSizing: "border-box",
                            }}
                            placeholder="0"
                          />
                        </div>

                        {/* Lower Arch Trays */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "6px",
                            }}
                          >
                            Lower Arch
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.trays.lowerArch}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                trays: {
                                  ...prev.trays,
                                  lowerArch: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            required
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              fontSize: "14px",
                              outline: "none",
                              transition: "border-color 0.2s",
                              boxSizing: "border-box",
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* STL Files Upload - Separate fields for aligner */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "12px",
                        }}
                      >
                        <Upload size={18} color="#6b7280" />
                        STL Files *
                      </label>

                      <div style={{ display: "grid", gap: "12px" }}>
                        {/* Upper Jaw STL */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "6px",
                            }}
                          >
                            Upper Jaw STL *
                          </label>
                          <input
                            type="file"
                            accept=".stl,.STL"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData((prev) => ({
                                  ...prev,
                                  stlFiles: {
                                    ...prev.stlFiles,
                                    upper: file,
                                  },
                                }));
                              }
                            }}
                            required
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              fontSize: "14px",
                              outline: "none",
                              backgroundColor: "white",
                              cursor: "pointer",
                              boxSizing: "border-box",
                            }}
                          />
                          {formData.stlFiles.upper && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Selected: {formData.stlFiles.upper.name}
                            </div>
                          )}
                        </div>

                        {/* Lower Jaw STL */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "6px",
                            }}
                          >
                            Lower Jaw STL *
                          </label>
                          <input
                            type="file"
                            accept=".stl,.STL"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData((prev) => ({
                                  ...prev,
                                  stlFiles: {
                                    ...prev.stlFiles,
                                    lower: file,
                                  },
                                }));
                              }
                            }}
                            required
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              fontSize: "14px",
                              outline: "none",
                              backgroundColor: "white",
                              cursor: "pointer",
                              boxSizing: "border-box",
                            }}
                          />
                          {formData.stlFiles.lower && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Selected: {formData.stlFiles.lower.name}
                            </div>
                          )}
                        </div>

                        {/* Total Jaw STL */}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "6px",
                            }}
                          >
                            Total Jaw STL (Optional)
                          </label>
                          <input
                            type="file"
                            accept=".stl,.STL"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData((prev) => ({
                                  ...prev,
                                  stlFiles: {
                                    ...prev.stlFiles,
                                    total: file,
                                  },
                                }));
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              fontSize: "14px",
                              outline: "none",
                              backgroundColor: "white",
                              cursor: "pointer",
                              boxSizing: "border-box",
                            }}
                          />
                          {formData.stlFiles.total && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Selected: {formData.stlFiles.total.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Note */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <FileText size={18} color="#6b7280" />
                    Note *
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      resize: "vertical",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                    placeholder="Enter order notes or special instructions"
                  />
                </div>

                {/* File Upload - Only for non-aligner labs */}
                {labType !== "aligner" && (
                  <div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <Upload size={18} color="#6b7280" />
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    />
                    {files.length > 0 && (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {files.length} file(s) selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: "32px",
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={modalLoading}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: modalLoading ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: modalLoading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    !modalLoading &&
                    (e.currentTarget.style.backgroundColor = "#2563eb")
                  }
                  onMouseLeave={(e) =>
                    !modalLoading &&
                    (e.currentTarget.style.backgroundColor = "#3b82f6")
                  }
                >
                  {modalLoading ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;