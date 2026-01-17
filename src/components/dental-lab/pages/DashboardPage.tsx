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

interface LabOrderResponse {
  count: number;
  labOrders: LabOrder[];
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
  const [labData, setLabData] = useState<LabOrder[] | null>(null);

  const [searchQuery] = useState(searchParams.get("search") || "");
  const [selectedStatus] = useState(searchParams.get("status") || "all");

  // Fetch Stats
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

  // Fetch Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = { limit: pageSize };

      if (cursors[currentCursorIndex]) params.cursor = cursors[currentCursorIndex];
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await axios.get(
        `${labBaseUrl}api/v1/lab-orders/getLatest/clinic-dental-orders/${clinicId}`,
        { params }
      );
      console.log(response);
      
      const { hasNextPage, nextCursor } = response.data;
      setLabData(response.data.labOrders);

      if (hasNextPage && nextCursor) {
        setCursors((prev) => {
          const trimmed = prev.slice(0, currentCursorIndex + 1);
          if (trimmed[trimmed.length - 1] !== nextCursor) trimmed.push(nextCursor);
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
  }, [clinicId, currentCursorIndex, selectedStatus, searchQuery]);

  

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
            {/* <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </button> */}
          </div>
        </div>

        <div className="overflow-x-auto">
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
                {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Action
                </th> */}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {labData?.map((order: LabOrder) => {
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
                          {order.patientname?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {order.patientname}
                          </p>
                          
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {order.doctorName}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.badge}`}
                      >
                        {config.icon}
                        {order.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{order.price || 0}
                      </span>
                    </td>

                    {/* <td className="px-6 py-4">
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
