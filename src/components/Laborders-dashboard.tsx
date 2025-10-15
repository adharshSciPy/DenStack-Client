import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
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
  XCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import labBaseUrl from "../labBaseUrl";

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
  patientName?: string;
  doctorName?: string;
  orderType?: string;
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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [labOrders, setLabOrders] = useState<LabStatus | null>(null);
  const [labData, setLabData] = useState<LabOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cursor-based pagination state
  const [cursors, setCursors] = useState<string[]>([""]); // Stack of cursors for back navigation
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);
  const [pageSize] = useState(10);

  const { clinicId } = useParams();

  // Fetch stats (only once on mount)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsResponse = await axios.get(
          `${labBaseUrl}api/v1/lab-order/clinic-lab-stats/${clinicId}`
        );
        setLabOrders(statsResponse.data.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();
  }, [clinicId]);

  // Fetch orders when filters, status, or cursor changes
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: any = {
          limit: pageSize,
        };

        // Add cursor if not on first page
        if (cursors[currentCursorIndex]) {
          params.cursor = cursors[currentCursorIndex];
        }

        // Add status filter if not "all"
        if (selectedStatus !== "all") {
          params.status = selectedStatus;
        }

        // Add search query if present
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const ordersResponse = await axios.get(
          `${labBaseUrl}api/v1/lab-order/lab-orders/${clinicId}`,
          { params }
        );

        setLabData(ordersResponse.data);

        // If there's a next page and we don't have this cursor yet, add it
        if (ordersResponse.data.hasNextPage && ordersResponse.data.nextCursor) {
          const nextCursor = ordersResponse.data.nextCursor;
          setCursors((prev) => {
            const newCursors = prev.slice(0, currentCursorIndex + 1);
            if (newCursors[newCursors.length - 1] !== nextCursor) {
              newCursors.push(nextCursor);
            }

            return newCursors;
          });
        }
      } catch (err) {
        setError("Failed to load lab orders. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [clinicId, selectedStatus, currentCursorIndex, searchQuery, pageSize]);

  // Reset to first page when filters change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCursors([""]);
    setCurrentCursorIndex(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCursors([""]);
    setCurrentCursorIndex(0);
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

  // Calculate display info
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
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Lab Orders
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor all laboratory orders
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium shadow hover:shadow-md hover:from-blue-700 hover:to-blue-600 transition-all">
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
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
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
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            {["all", "pending", "in-progress", "completed", "cancelled"].map(
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
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
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
                      <td
                        className="px-6 py-4 text-sm font-medium text-gray-800"
                        style={{ padding: "20px 0px" }}
                      >
                        {order.patientName || "N/A"}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                        {order.doctorName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.orderType || "N/A"}
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
                      <td className="text-right px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-800 transition">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No lab orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Cursor Based */}
          {labData && labData.labOrders.length > 0 && (
            <div
              className="border-t border-gray-200 px-6 py-4 flex items-center justify-between"
              style={{ padding: "10px" }}
            >
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
    </div>
  );
}
