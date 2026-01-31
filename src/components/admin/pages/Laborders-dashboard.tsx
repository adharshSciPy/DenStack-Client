import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Filter,
  Download,
  Calendar,
  Eye,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  User,
  Upload,
} from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import labBaseUrl from "../../../labBaseUrl";
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";

interface LabStatus {
  completedOrders: number;
  pendingOrders: number;
  totalLabs: number;
  totalOrders: number;
}

interface LabOrder {
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
  status: string;
  statusHistory?: {
    status: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface LabOrderResponse {
  count: number;
  labOrders: LabOrder[];
  message: string;
  hasNextPage: boolean;
  nextCursor?: string;
}

type OrderStatus = "pending" | "completed" | "in-progress" | "cancelled";

export default function LabOrdersPage() {
  const { clinicId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "all"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [labOrders, setLabOrders] = useState<LabStatus | null>(null);
  const [labData, setLabData] = useState<LabOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);
  const [pageSize] = useState(10);
  const [doctors, setDoctors] = useState([]);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inhouse');
  const [formData, setFormData] = useState({
    vendor: "",
    dentist: "",
    patientName: "",
    deliveryDate: "",
    note: "",
    price: ""
  });
  const [files, setFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // NEW: Separate state for labs based on tab
  const [inhouseLabs, setInhouseLabs] = useState<any[]>([]);
  const [externalLabs, setExternalLabs] = useState<any[]>([]);
  const [alignerLabs, setAlignerLabs] = useState<any[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);

  const tabs = [
    { id: 'inhouse', label: 'In-House Lab' },
    { id: 'external', label: 'External Lab' },
    { id: 'aligner', label: 'Aligner Lab' }
  ];

  // NEW: Function to fetch labs based on tab type
  const fetchLabsByType = async (labType: string) => {
    setLabsLoading(true);
    try {
      let endpoint = '';
      
      switch(labType) {
        case 'inhouse':
          endpoint = `${labBaseUrl}api/v1/lab/inhouse-labs-by-clinic/${clinicId}`;
          break;
        case 'external':
          endpoint = `${labBaseUrl}api/v1/lab/external-vendors`;
          break;
        case 'aligner':
          endpoint = `${labBaseUrl}api/v1/lab/aligner-vendors`;
          break;
        default:
          endpoint = `${labBaseUrl}api/v1/lab/vendors`;
      }
      console.log(endpoint);
      
      const res = await axios.get(endpoint);
      console.log(res);
      
      switch(labType) {
        case 'inhouse':
          setInhouseLabs(res.data);
          break;
        case 'external':
          setExternalLabs(res.data);
          break;
        case 'aligner':
          setAlignerLabs(res.data);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${labType} labs:`, error);
    } finally {
      setLabsLoading(false);
    }
  };

  // NEW: Effect to fetch labs when tab changes
  useEffect(() => {
    if (isOpen) {
      fetchLabsByType(activeTab);
    }
  }, [activeTab, isOpen]);

  // NEW: Function to get current labs based on active tab
  const getCurrentLabs = () => {
    switch(activeTab) {
      case 'inhouse':
        return inhouseLabs;
      case 'external':
        return externalLabs;
      case 'aligner':
        return alignerLabs;
      default:
        return [];
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      if (search.length < 3) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(
          `${patientServiceBaseUrl}/api/v1/patient-service/patient/clinic-patients/${clinicId}?search=${search}`
        );
        setResults(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounce);
  }, [search, clinicId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('labType', activeTab);
      
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key as keyof typeof formData]);
      });
      
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });
      
      const response = await axios.post(
        `${labBaseUrl}api/v1/lab-orders/dental-orders`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        alert("Dental lab order created successfully!");
        setIsOpen(false);
        setFormData({
          vendor: "",
          dentist: "",
          patientName: "",
          deliveryDate: "",
          note: "",
          price: "",
        });
        setFiles([]);
        setSearch("");
        setActiveTab('inhouse');

        fetchStats();
        fetchOrders();
        setCurrentCursorIndex(0);
        setCursors([null]);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "Unknown error occurred";
      alert("Error creating order: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsResponse = await axios.get(
        `${labBaseUrl}api/v1/lab-orders/lab-stats/${clinicId}`
      );

      setLabOrders({
        totalLabs: statsResponse.data.totalLabs,
        pendingOrders: statsResponse.data.pendingCount,
        completedOrders: statsResponse.data.completedCount,
        totalOrders: statsResponse.data.totalOrders,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: pageSize,
      };

      if (cursors[currentCursorIndex]) {
        params.cursor = cursors[currentCursorIndex];
      }

      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await axios.get(
        `${labBaseUrl}api/v1/lab-orders/clinic-dental-orders/${clinicId}`,
        { params }
      );
      console.log(response);
      
      const { hasNextPage, nextCursor } = response.data;

      setLabData(response.data);

      if (hasNextPage && nextCursor) {
        setCursors((prev) => {
          const trimmed = prev.slice(0, currentCursorIndex + 1);

          if (trimmed[trimmed.length - 1] !== nextCursor) {
            trimmed.push(nextCursor);
          }

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

  useEffect(() => {
    fetchStats();
  }, [clinicId]);

  useEffect(() => {
    fetchOrders();
  }, [clinicId, selectedStatus, searchQuery, pageSize, currentCursorIndex]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCursors([null]);
    setCurrentCursorIndex(0);

    const newParams = new URLSearchParams(searchParams);
    if (status === "all") {
      newParams.delete("status");
    } else {
      newParams.set("status", status);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCursors([null]);
    setCurrentCursorIndex(0);

    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set("search", value.trim());
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  const handleNextPage = () => {
    if (labData?.hasNextPage) {
      setCurrentCursorIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentCursorIndex > 0) {
      setCurrentCursorIndex((prev) => prev - 1);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getDoctors = async () => {
    try {
      const res = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/active-doctors?clinicId=${clinicId}`
      );
      setDoctors(res.data.doctors);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDoctors();
  }, [clinicId]);

  const stats = [
    {
      label: "Total Orders",
      value: labOrders?.totalOrders.toString() || "0",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: labOrders?.pendingOrders.toString() || "0",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Completed",
      value: labOrders?.completedOrders.toString() || "0",
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Labs",
      value: labOrders?.totalLabs.toString() || "0",
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const startItem = currentCursorIndex * pageSize + 1;
  const endItem = startItem + (labData?.labOrders?.length || 0) - 1;

  if (error && !labData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalPages = cursors.length;
  const currentPage = currentCursorIndex + 1;

  const currentLabs = getCurrentLabs();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col rounded-xl md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Lab Orders
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor all laboratory orders
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow hover:shadow-md hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shadow-inner`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm" style={{padding:'10px'}}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by patient name, order ID, or test..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            <button className="inline-flex items-center gap-2 px-4 h-10 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="inline-flex items-center gap-2 px-4 h-10 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
            <button className="inline-flex items-center gap-2 px-4 h-10 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mt-4 overflow-auto">
            {["all", "pending", "in-progress", "delivered", "cancelled"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace("-", " ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="min-w-full w-full"
              style={{ textAlign: "center" }}
            >
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="text-left px-6 py-3 font-medium">Patient</th>
                  <th className="hidden md:table-cell text-left px-6 py-3 font-medium">
                    Doctor
                  </th>
                  <th className="text-left px-6 py-3 font-medium">Test</th>
                  <th className="hidden lg:table-cell text-left px-6 py-3 font-medium">
                    Date
                  </th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" />
                      <p className="text-gray-500 mt-2">Loading orders...</p>
                    </td>
                  </tr>
                ) : labData?.labOrders && labData.labOrders.length > 0 ? (
                  labData.labOrders.map((order, i) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-all"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {order.patientname || "N/A"}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                        {order.doctorName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.note || "N/A"}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : order.status === "in-progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No lab orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {labData && labData.labOrders.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium text-gray-900">{startItem}</span>{" "}
                  - <span className="font-medium text-gray-900">{endItem}</span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">
                    {labData?.count || 0}
                  </span>{" "}
                  orders
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentCursorIndex === 0 || isLoading}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentCursorIndex(i)}
                      disabled={isLoading}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                        i === currentCursorIndex
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={!labData?.hasNextPage || isLoading}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal with Tabs */}
      {isOpen && (
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
          onClick={() => setIsOpen(false)}
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
                Create Dental Lab Order
              </h2>
              <button
                onClick={() => setIsOpen(false)}
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

            {/* Tabs */}
            <div style={{ 
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "white",
              position: "sticky",
              top: "73px",
              zIndex: 9
            }}>
              <div style={{ 
                display: "flex",
                padding: "0 24px"
              }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Reset vendor selection when switching tabs
                      setFormData(prev => ({ ...prev, vendor: "" }));
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                      borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = "#374151";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = "#6b7280";
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gap: "20px" }}>
                {/* Lab Selection - Show for all tabs */}
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
                    {activeTab === 'inhouse' 
                      ? 'In-House Lab *' 
                      : activeTab === 'aligner' 
                      ? 'Aligner Lab *' 
                      : 'External Lab *'}
                  </label>
                  {labsLoading ? (
                    <div style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <Loader2 size={16} className="animate-spin" />
                      Loading labs...
                    </div>
                  ) : (
                    <select
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleSelectChange}
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
                        Select {activeTab === 'inhouse' 
                          ? 'In-House Lab' 
                          : activeTab === 'aligner' 
                          ? 'Aligner Lab' 
                          : 'External Lab'}
                      </option>
                      {currentLabs.map((lab: any) => (
                        <option key={lab._id} value={lab._id}>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!labsLoading && currentLabs.length === 0 && (
                    <div style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#ef4444",
                    }}>
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
                    Dentist
                  </label>
                  <select
                    name="dentist"
                    value={formData.dentist}
                    onChange={handleSelectChange}
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
                    name="patientName"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
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

                  {results.length > 0 && (
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
                      {results.map((p: any) => (
                        <li
                          key={p._id}
                          style={{
                            padding: "10px",
                            borderBottom: "1px solid #eee",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSearch(p.name);
                            setFormData((prev) => ({
                              ...prev,
                              patientName: p._id,
                            }));
                            setResults([]);
                          }}
                        >
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {loading && search.length >= 3 && (
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

                {/* File Upload */}
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
                  onClick={() => setIsOpen(false)}
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
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    !loading &&
                    (e.currentTarget.style.backgroundColor = "#2563eb")
                  }
                  onMouseLeave={(e) =>
                    !loading &&
                    (e.currentTarget.style.backgroundColor = "#3b82f6")
                  }
                >
                  {loading ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}