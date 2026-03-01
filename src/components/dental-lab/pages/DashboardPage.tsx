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
  doctorName?: string;
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
              doctorName: order.dentist, // or map to actual doctor name if available
              status: order.status,
              deliveryDate: order.updatedAt,
              price: order.price,
              createdAt: order.createdAt,
            }));
          setLabData(transformedOrders);
        }
      }

      console.log("Stats response:", statsResponse.data.latestOrders);
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
      console.log("In-house orders:", response.data);

      const { hasNextPage, nextCursor, labOrders } = response.data;

      if (labOrders && Array.isArray(labOrders)) {
        const transformedOrders: DisplayLabOrder[] = labOrders.map(
          (order: InHouseLabOrder) => ({
            _id: order._id,
            patientName: order.patientname,
            doctorName: order.doctorName,
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
      console.log("Aligner orders:", response.data);

      if (
        response.data.alignerOrders &&
        Array.isArray(response.data.alignerOrders)
      ) {
        const transformedOrders: DisplayLabOrder[] =
          response.data.alignerOrders.map((order: AlignerLabOrder) => ({
            _id: order._id,
            patientName: order.patientName,
            doctorName: order.doctorName, // You might need to fetch doctor name separately
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

      {/* Recent Orders */}
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
    </div>
  );
};

export default DashboardPage;
