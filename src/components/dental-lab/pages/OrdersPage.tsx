import React, { useState, useEffect } from "react";
import axios from "axios";
import OrderDetailsModal from "../components/common/orderDetailModal"
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Eye,
  Upload,
  Download,
  X,
  Filter,
  DollarSign,
  FilePlus,
  TestTube,
  FileCheck,
  Stethoscope,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import labBaseUrl from "../../../labBaseUrl";
import { useAppSelector } from "../../../redux/hook";

// Types
interface Test {
  testId: string;
  price: number;
  _id: string;
  testName?: string;
}

interface Attachment {
  _id: string;
  url: string;
  filename: string;
  mimetype: string;
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

interface LabDataResponse {
  data: {
    count: number;
    hasNextPage: boolean;
    labOrders: LabOrder[];
    nextCursor?: string;
    message: string;
  };
}

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: any;
  label: string;
}

interface UploadModalProps {
  order: LabOrder;
  onClose: () => void;
  onUpload: (files: File[], notes: string) => Promise<void>;
}

interface OrderDetailsModalProps {
  order: LabOrder;
  onClose: () => void;
}

const PAGE_SIZE = 10;

const OrdersTable: React.FC = () => {
  const clinicId = useAppSelector((state) => state.auth.clinicId);
  const fileUrl='http://localhost:8006'
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState<LabOrder | null>(null);
  const [labData, setLabData] = useState<LabDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cursor-based pagination state
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const getStatusConfig = (status: LabOrder["status"]): StatusConfig => {
    const configs = {
      pending: { bg: "bg-yellow-500/10", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500", icon: Clock, label: "Pending" },
      "in-progress": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", icon: AlertCircle, label: "In Progress" },
      completed: { bg: "bg-green-500/10", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", icon: CheckCircle, label: "Completed" },
      ready: { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500", icon: FileCheck, label: "Ready" },
      cancelled: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: XCircle, label: "Cancelled" },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityColor = (amount: number) => {
    if (amount > 2000) return "bg-red-500/10 text-red-700";
    if (amount > 1000) return "bg-yellow-500/10 text-yellow-700";
    return "bg-green-500/10 text-green-700";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Fetch orders with cursor
  useEffect(() => {
    const fetchOrders = async () => {
      if (currentPageIndex === 0) {
        setIsLoading(true);
      } else {
        setIsPaginationLoading(true);
      }
      setError(null);

      try {
        const params: any = { limit: PAGE_SIZE };
        
        const currentCursor = cursorHistory[currentPageIndex];
        if (currentCursor) {
          params.cursor = currentCursor;
        }
        
        if (selectedStatus !== "all") params.status = selectedStatus;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const response = await axios.get(
          `${labBaseUrl}api/v1/lab-orders/clinic-dental-orders/${clinicId}`,
          { params }
        );

        setLabData(response);
        
        // Update cursor history if there's a next page
        if (response.data.nextCursor && !cursorHistory.includes(response.data.nextCursor)) {
          setCursorHistory(prev => {
            const newHistory = [...prev];
            newHistory[currentPageIndex + 1] = response.data.nextCursor;
            return newHistory;
          });
        }
      } catch (err) {
        setError("Failed to load lab orders. Please try again.");
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
        setIsPaginationLoading(false);
      }
    };

    fetchOrders();
  }, [clinicId, selectedStatus, searchQuery, currentPageIndex]);

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPageIndex(0);
    setCursorHistory([null]);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    setCurrentPageIndex(0);
    setCursorHistory([null]);
  };

  const handleUpload = async (files: File[], notes: string) => {
    setUploading(true);
    console.log(files);
    
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("resultFiles", file));
      formData.append("orderId", uploadModalOpen!._id);

      const response=await axios.post(
        `${labBaseUrl}api/v1/lab-orders/dental-orders/upload-results/${uploadModalOpen!._id}`,
        formData
      );
      console.log(response);
      
      setUploadModalOpen(null);

      // Refresh current page
      const params: any = { limit: PAGE_SIZE };
      const currentCursor = cursorHistory[currentPageIndex];
      if (currentCursor) params.cursor = currentCursor;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const refresh = await axios.get(
        `${labBaseUrl}api/v1/lab-orders/clinic-dental-orders/${clinicId}`,
        { params }
      );
      setLabData(refresh);
    } catch {
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (labData?.data?.hasNextPage) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const orders = labData?.data?.labOrders || [];
  const count = labData?.data?.count || 0;
  const hasNextPage = labData?.data?.hasNextPage || false;
  const hasPrevPage = currentPageIndex > 0;
  const currentPage = currentPageIndex + 1;

  const renderPagination = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl border shadow">
      <p className="text-gray-600 mb-4 sm:mb-0">
        Showing <b>{count}</b> orders on page <b>{currentPage}</b>
        {hasNextPage && <span className="text-sm text-gray-400"> (More pages available)</span>}
      </p>

      <div className="flex items-center gap-3">
        <button 
          disabled={!hasPrevPage || isPaginationLoading} 
          onClick={handlePrevPage}
          className="px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 flex items-center gap-2 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        
        <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-semibold">
          Page {currentPage}
        </div>
        
        <button 
          disabled={!hasNextPage || isPaginationLoading} 
          onClick={handleNextPage}
          className="px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 flex items-center gap-2 font-medium transition-colors"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const StatusBadge: React.FC<{ status: LabOrder["status"] }> = ({ status }) => {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`}></div>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">{cfg.label}</span>
      </div>
    );
  };

  const UploadModal: React.FC<UploadModalProps> = ({ order, onClose, onUpload }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [notes, setNotes] = useState("");

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      setFiles([...files, ...selected]);
    };
    const handleUploadFiles = async () => await onUpload(files, notes);
    const removeFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Test Results</h2>
                <p className="text-sm text-gray-500">Order: {order._id.slice(-8)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div
              className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-colors"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <FilePlus className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Drop files here</p>
              <p className="text-sm text-gray-500 mb-4">Supports: PDF, JPG, PNG</p>
              <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            {files.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Selected Files ({files.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 hover:bg-gray-200 rounded-lg">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold text-gray-900 block mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full h-24 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                disabled={uploading} 
                onClick={onClose} 
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={files.length===0||uploading}
                onClick={handleUploadFiles}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Results"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading lab orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col bg-gradient-to-br from-slate-50 to-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-gray-700 text-lg font-semibold mb-2">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8">

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder="Search by name, doctor or ID..."
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="ready">Ready</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button 
              onClick={handleSearchSubmit} 
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
            >
              <Filter className="w-5 h-5" />
              Apply
            </button>
          </div>
        </div>

        {/* Pagination Loading Overlay */}
        {isPaginationLoading && (
          <div className="bg-white rounded-3xl shadow-lg p-12 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mr-3" />
            <p className="text-gray-700 font-semibold text-lg">Loading page {currentPage}...</p>
          </div>
        )}

        {/* Orders Grid */}
        {!isPaginationLoading && orders.length > 0 && (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-700 text-sm">
                        #
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">{order._id.slice(-8)}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <User className="text-purple-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.patientname}</p>
                      <p className="text-sm text-gray-500">ID: {order.patientId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Stethoscope className="text-green-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.doctorName}</p>
                      <p className="text-sm text-gray-500">Dentist ID: {order.dentist.slice(-8)}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-xl flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-700">{formatDate(order.deliveryDate)}</span>
                  </div>

                  <div className={`p-3 rounded-xl flex items-center gap-2 ${getPriorityColor(order.totalLabAmount)}`}>
                    <DollarSign className="w-4 h-4" />
                    <span className="font-bold text-lg">${(order.totalLabAmount || 0).toLocaleString()}</span>
                  </div>

                  {order.note && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs font-medium text-gray-700 mb-1">Note</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{order.note}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>

                    {(order.status === "pending" || order.status === "in-progress") && (
                      <button
                        onClick={() => setUploadModalOpen(order)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isPaginationLoading && orders.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-16 text-center">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && !isPaginationLoading && renderPagination()}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {uploadModalOpen && (
        <UploadModal order={uploadModalOpen} onClose={() => setUploadModalOpen(null)} onUpload={handleUpload} />
      )}
    </div>
  );
};

export default OrdersTable;