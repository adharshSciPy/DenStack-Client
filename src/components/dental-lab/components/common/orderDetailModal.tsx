import React, { useState } from "react";
import {
  FileText,
  X,
  TestTube,
  FileCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import FilePreviewCard from "./PreviewCard";
interface Test {
  testId: string;
  price: number;
  _id: string;
  testName?: string;
}

interface LabOrder {
  _id: string;
  vendor: string;
  dentist: string;
  patientId: string;
  patientname: string;
  doctorName: string;
  deliveryDate: string;
  appointmentId: string;
  note: string;
  status: "pending" | "in-progress" | "completed" | "ready" | "cancelled";
  totalLabAmount: number;
  tests: Test[];
  attachments: Attachment[];
  resultFiles: Attachment[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Attachment {
  _id: string;
  url: string;
  filename: string;
  mimetype: string;
}

interface OrderDetailsModalProps {
  order: LabOrder;
  onClose: () => void;
}
interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: any;
  label: string;
}
const getStatusConfig = (status: LabOrder["status"]): StatusConfig => {
  const configs = {
    pending: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-700",
      border: "border-yellow-200",
      dot: "bg-yellow-500",
      icon: Clock,
      label: "Pending",
    },
    "in-progress": {
      bg: "bg-blue-500/10",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
      icon: AlertCircle,
      label: "In Progress",
    },
    completed: {
      bg: "bg-green-500/10",
      text: "text-green-700",
      border: "border-green-200",
      dot: "bg-green-500",
      icon: CheckCircle,
      label: "Completed",
    },
    ready: {
      bg: "bg-purple-500/10",
      text: "text-purple-700",
      border: "border-purple-200",
      dot: "bg-purple-500",
      icon: FileCheck,
      label: "Ready",
    },
    cancelled: {
      bg: "bg-red-500/10",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
      icon: XCircle,
      label: "Cancelled",
    },
  };
  return configs[status] || configs.pending;
};
const getPriorityColor = (amount: number) => {
  if (amount > 2000) return "bg-red-500/10 text-red-700";
  if (amount > 1000) return "bg-yellow-500/10 text-yellow-700";
  return "bg-green-500/10 text-green-700";
};
const StatusBadge: React.FC<{ status: LabOrder["status"] }> = ({ status }) => {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`}></div>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-semibold uppercase tracking-wider">
        {cfg.label}
      </span>
    </div>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "details" | "tests" | "attachments"
  >("details");
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl  max-h-[40vh] overflow-hidden"
        style={{ width: "80%" }}
      >
        <div className="p-6 border-b flex justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Lab Order Details
            </h2>
            <p className="text-gray-500">Order #{order._id.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "details"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "tests"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tests ({order?.tests?.length || ""})
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "attachments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Files ({order.attachments.length + order.resultFiles.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === "details" && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">Patient</p>
                  <p className="text-lg font-bold">{order.patientname}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">Doctor</p>
                  <p className="font-bold">{order.doctorName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-2">Status</p>
                  <StatusBadge status={order.status} />
                </div>

                <div
                  className={`p-4 rounded-2xl ${getPriorityColor(
                    order.totalLabAmount
                  )}`}
                >
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">${order.totalLabAmount}</p>
                </div>
              </div>

              <div className="col-span-2 space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-gray-700">{order.note || "No notes"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-gray-200 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Order Date</p>
                    <p className="font-semibold">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="bg-white border-2 border-gray-200 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Delivery Date</p>
                    <p className="font-semibold">
                      {formatDate(order.deliveryDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tests" && (
            <div className="space-y-4">
              {order?.tests?.map((test) => (
                <div
                  key={test._id}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        Test ID: {test.testId.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Price: ${test.price}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ${test.price}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="space-y-6">
              {order.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Order Attachments
                  </h4>
                  <div className="space-y-3">
                    {order.attachments.map((file) => (
                      <FilePreviewCard key={file._id} file={file} />
                    ))}
                  </div>
                </div>
              )}

              {order.resultFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Result Files
                  </h4>
                  <div className="space-y-3">
                    {order.resultFiles.map((file) => (
                      <FilePreviewCard key={file._id} file={file} />
                    ))}
                  </div>
                </div>
              )}

              {order.attachments.length === 0 &&
                order.resultFiles.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No files attached
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default OrderDetailsModal;
