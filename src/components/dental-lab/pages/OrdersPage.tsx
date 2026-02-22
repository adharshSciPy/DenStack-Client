import React, { useState, useEffect } from "react";
import axios from "axios";
import OrderDetailsModal from "../components/common/orderDetailModal";
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

interface OrdersTableProps {
  onUploadResults?: (order: LabOrder) => void;
}

interface LabOrder {
  _id: string;
  vendor: string;
  dentist: string;
  patientId: string;
  patientname: string;
  patientName: string;
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
  onUpload: (files: File[], notes: string, patientId: string) => Promise<void>;
  uploading: boolean;
}

const PAGE_SIZE = 10;

const OrdersTable: React.FC<OrdersTableProps> = ({ onUploadResults }) => {
  const clinicId = useAppSelector((state) => state.auth.clinicId);
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
          { params },
        );

        setLabData(response);

        // Update cursor history if there's a next page
        if (
          response.data.nextCursor &&
          !cursorHistory.includes(response.data.nextCursor)
        ) {
          setCursorHistory((prev) => {
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

  const handleUpload = async (
    files: File[],
    notes: string,
    patientId: string,
  ) => {
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("resultFiles", file));
      formData.append("labOrderId", uploadModalOpen!._id);
      const labOrderId = uploadModalOpen!._id;

      const response = await axios.patch(
        `${labBaseUrl}api/v1/lab-orders/dental-orders/upload-results/${patientId}/${labOrderId}`,
        formData,
      );
      console.log("Upload response:", response);
      setUploadModalOpen(null);

      // Refresh current page
      const params: any = { limit: PAGE_SIZE };
      const currentCursor = cursorHistory[currentPageIndex];
      if (currentCursor) params.cursor = currentCursor;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const refresh = await axios.get(
        `${labBaseUrl}api/v1/lab-orders/clinic-dental-orders/${clinicId}`,
        { params },
      );
      setLabData(refresh);
    } catch (error) {
      console.log("Error:", error);
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

  // Inline Styles
  const styles = {
    container: {
      minHeight: "100vh",
      padding: "24px",
      backgroundColor: "#f8fafc",
    },
    wrapper: {
      maxWidth: "1280px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column" as const,
      gap: "24px",
    },
    headerCard: {
      backgroundColor: "white",
      borderRadius: "24px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      padding: "32px",
    },
    filtersContainer: {
      display: "flex",
      gap: "16px",
      flexWrap: "wrap" as const,
    },
    searchWrapper: {
      flex: 1,
      minWidth: "300px",
      position: "relative" as const,
    },
    searchIcon: {
      position: "absolute" as const,
      left: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      width: "20px",
      height: "20px",
    },
    searchInput: {
      width: "100%",
      padding: "16px 16px 16px 48px",
      border: "2px solid #e2e8f0",
      borderRadius: "16px",
      fontSize: "16px",
      outline: "none",
      transition: "all 0.2s",
    },
    selectInput: {
      padding: "16px 32px 16px 20px",
      border: "2px solid #e2e8f0",
      borderRadius: "16px",
      fontSize: "16px",
      fontWeight: 500,
      backgroundColor: "white",
      cursor: "pointer",
      outline: "none",
    },
    applyButton: {
      padding: "16px 24px",
      background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)",
      color: "white",
      border: "none",
      borderRadius: "16px",
      fontSize: "16px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    loadingOverlay: {
      backgroundColor: "white",
      borderRadius: "24px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      padding: "48px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    ordersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "24px",
    },
    orderCard: {
      backgroundColor: "white",
      borderRadius: "24px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      transition: "box-shadow 0.2s",
      cursor: "pointer",
    },
    cardHeader: {
      padding: "24px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    cardBody: {
      padding: "24px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "16px",
    },
    infoRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    infoIcon: {
      width: "40px",
      height: "40px",
      backgroundColor: "#f3e8ff",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    deliveryDate: {
      backgroundColor: "#fff7ed",
      padding: "12px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    amount: {
      padding: "12px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    noteContainer: {
      backgroundColor: "#f8fafc",
      padding: "12px",
      borderRadius: "12px",
    },
    actionButtons: {
      display: "flex",
      gap: "12px",
      paddingTop: "16px",
    },
    viewButton: {
      flex: 1,
      padding: "12px 16px",
      border: "2px solid #e2e8f0",
      borderRadius: "12px",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    uploadButton: {
      flex: 1,
      padding: "12px 16px",
      background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)",
      border: "none",
      borderRadius: "12px",
      color: "white",
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    emptyState: {
      backgroundColor: "white",
      borderRadius: "24px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      padding: "64px",
      textAlign: "center" as const,
    },
    paginationContainer: {
      display: "flex",
      flexDirection: "row" as const,
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    paginationButtons: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    pageButton: {
      padding: "8px 16px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    pageNumber: {
      padding: "8px 16px",
      background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)",
      color: "white",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 600,
    },
  };

  // Upload Modal with Inline Styles
  const UploadModal: React.FC<UploadModalProps> = ({
    order,
    onClose,
    onUpload,
    uploading,
  }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [notes, setNotes] = useState("");
    const patientId = order?.patientName;

    const modalStyles = {
      overlay: {
        position: "fixed" as const,
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      },
      modal: {
        backgroundColor: "white",
        borderRadius: "24px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        maxWidth: "448px",
        width: "100%",
        animation: "slideIn 0.3s ease-out",
      },
      header: {
        padding: "24px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
      headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
      },
      iconContainer: {
        width: "48px",
        height: "48px",
        background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      title: {
        fontSize: "20px",
        fontWeight: 700,
        color: "#0f172a",
        margin: 0,
      },
      subtitle: {
        fontSize: "14px",
        color: "#64748b",
        margin: "4px 0 0 0",
      },
      closeButton: {
        padding: "8px",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "background-color 0.2s",
      },
      content: {
        padding: "24px",
        display: "flex",
        flexDirection: "column" as const,
        gap: "24px",
      },
      dropzone: {
        border: "3px dashed #cbd5e1",
        borderRadius: "16px",
        padding: "32px",
        textAlign: "center" as const,
        cursor: "pointer",
        transition: "all 0.2s",
      },
      dropzoneIcon: {
        width: "64px",
        height: "64px",
        backgroundColor: "#dbeafe",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
      },
      fileList: {
        marginTop: "16px",
      },
      fileItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        padding: "12px",
        borderRadius: "12px",
        marginBottom: "8px",
      },
      fileInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
      },
      textarea: {
        width: "100%",
        height: "96px",
        padding: "16px",
        border: "2px solid #e2e8f0",
        borderRadius: "12px",
        fontSize: "14px",
        outline: "none",
        resize: "none" as const,
        transition: "all 0.2s",
      },
      buttonGroup: {
        display: "flex",
        gap: "12px",
        paddingTop: "16px",
      },
      cancelButton: {
        flex: 1,
        padding: "12px 24px",
        border: "2px solid #cbd5e1",
        borderRadius: "12px",
        backgroundColor: "white",
        fontSize: "16px",
        fontWeight: 600,
        color: "#475569",
        cursor: "pointer",
        transition: "all 0.2s",
      },
      uploadButton: {
        flex: 1,
        padding: "12px 24px",
        background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)",
        border: "none",
        borderRadius: "12px",
        color: "white",
        fontSize: "16px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: "pointer",
        transition: "all 0.2s",
        opacity: files.length === 0 || uploading ? 0.5 : 1,
      },
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      setFiles([...files, ...selected]);
    };

    const handleUploadFiles = async () => {
      await onUpload(files, notes, patientId);
    };

    const removeFile = (idx: number) => {
      setFiles(files.filter((_, i) => i !== idx));
    };

    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <div style={modalStyles.headerLeft}>
              <div style={modalStyles.iconContainer}>
                <Upload style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
              <div>
                <h2 style={modalStyles.title}>Upload Test Results</h2>
                <p style={modalStyles.subtitle}>Order: {order._id.slice(-8)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={modalStyles.closeButton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <X style={{ width: "24px", height: "24px", color: "#64748b" }} />
            </button>
          </div>

          <div style={modalStyles.content}>
            <div
              style={modalStyles.dropzone}
              onClick={() => document.getElementById("fileInput")?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.backgroundColor = "#eff6ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={modalStyles.dropzoneIcon}>
                <FilePlus style={{ width: "32px", height: "32px", color: "#2563eb" }} />
              </div>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                Drop files here
              </p>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                Supports: PDF, JPG, PNG
              </p>
              <input
                id="fileInput"
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>

            {files.length > 0 && (
              <div style={modalStyles.fileList}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
                  Selected Files ({files.length})
                </h3>
                <div style={{ maxHeight: "60px", overflowY: "auto" }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={modalStyles.fileItem}>
                      <div style={modalStyles.fileInfo}>
                        <FileText style={{ width: "20px", height: "20px", color: "#2563eb" }} />
                        <div>
                          <p style={{ fontWeight: 500, color: "#0f172a", margin: 0 }}>
                            {file.name}
                          </p>
                          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        style={{
                          padding: "4px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <X style={{ width: "16px", height: "16px", color: "#64748b" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* <div>
                <label style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", display: "block", marginBottom: "8px" }}>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  style={modalStyles.textarea}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div> */}

            <div style={modalStyles.buttonGroup}>
              <button
                disabled={uploading}
                onClick={onClose}
                style={modalStyles.cancelButton}
                onMouseEnter={(e) => {
                  if (!uploading) e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (!uploading) e.currentTarget.style.backgroundColor = "white";
                }}
              >
                Cancel
              </button>
              <button
                disabled={files.length === 0 || uploading}
                onClick={handleUploadFiles}
                style={modalStyles.uploadButton}
                onMouseEnter={(e) => {
                  if (files.length > 0 && !uploading) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8 0%, #3730a3 100%)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (files.length > 0 && !uploading) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)";
                  }
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
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

  const StatusBadge: React.FC<{ status: LabOrder["status"] }> = ({ status }) => {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          borderRadius: "9999px",
          border: `1px solid ${cfg.border}`,
          backgroundColor: cfg.bg,
          color: cfg.text,
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: cfg.dot,
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        ></div>
        <Icon style={{ width: "12px", height: "12px" }} />
        <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {cfg.label}
        </span>
      </div>
    );
  };

  if (isLoading && orders.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8fafc 0%, white 100%)" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 style={{ width: "48px", height: "48px", color: "#2563eb", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#475569", fontWeight: 500 }}>Loading lab orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "linear-gradient(135deg, #f8fafc 0%, white 100%)" }}>
        <AlertCircle style={{ width: "64px", height: "64px", color: "#ef4444", marginBottom: "16px" }} />
        <p style={{ color: "#334155", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.headerCard}>
          <div style={styles.filtersContainer}>
            <div style={styles.searchWrapper}>
              <Search style={styles.searchIcon} />
              <input
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder="Search by name, doctor or ID..."
                style={styles.searchInput}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              style={styles.selectInput}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
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
              style={styles.applyButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8 0%, #3730a3 100%)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(37, 99, 235, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Filter style={{ width: "20px", height: "20px" }} />
              Apply
            </button>
          </div>
        </div>

        {/* Pagination Loading Overlay */}
        {isPaginationLoading && (
          <div style={styles.loadingOverlay}>
            <Loader2 style={{ width: "40px", height: "40px", color: "#2563eb", animation: "spin 1s linear infinite", marginRight: "12px" }} />
            <p style={{ color: "#334155", fontWeight: 600, fontSize: "18px" }}>
              Loading page {currentPage}...
            </p>
          </div>
        )}

        {/* Orders Grid */}
        {!isPaginationLoading && orders.length > 0 && (
          <div style={styles.ordersGrid}>
            {orders.map((order) => (
              <div
                key={order._id}
                style={styles.orderCard}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.1)"}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ width: "32px", height: "32px", backgroundColor: "#dbeafe", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#2563eb", fontSize: "14px" }}>
                        #
                      </div>
                      <h3 style={{ fontWeight: "bold", fontSize: "18px", color: "#0f172a", margin: 0 }}>
                        {order._id.slice(-8)}
                      </h3>
                    </div>
                    <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <div style={{ ...styles.infoIcon, backgroundColor: "#f3e8ff" }}>
                      <User style={{ color: "#9333ea", width: "20px", height: "20px" }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#0f172a", margin: 0 }}>
                        {order.patientname}
                      </p>
                      <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                        ID: {order.patientId}
                      </p>
                    </div>
                  </div>

                  <div style={styles.infoRow}>
                    <div style={{ ...styles.infoIcon, backgroundColor: "#dcfce7" }}>
                      <Stethoscope style={{ color: "#16a34a", width: "20px", height: "20px" }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#0f172a", margin: 0 }}>
                        {order.doctorName}
                      </p>
                      <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                        Dentist ID: {order.dentist.slice(-8)}
                      </p>
                    </div>
                  </div>

                  <div style={styles.deliveryDate}>
                    <Calendar style={{ width: "16px", height: "16px", color: "#ea580c" }} />
                    <span style={{ fontWeight: 500, color: "#9a3412" }}>
                      {formatDate(order.deliveryDate)}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.amount,
                      backgroundColor: order.totalLabAmount > 2000 ? "#fee2e2" : order.totalLabAmount > 1000 ? "#fef3c7" : "#dcfce7",
                      color: order.totalLabAmount > 2000 ? "#991b1b" : order.totalLabAmount > 1000 ? "#92400e" : "#166534",
                    }}
                  >
                    <DollarSign style={{ width: "16px", height: "16px" }} />
                    <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                      ${(order.totalLabAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  {order.note && (
                    <div style={styles.noteContainer}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: "#475569", margin: "0 0 4px 0" }}>
                        Note
                      </p>
                      <p style={{ fontSize: "14px", color: "#475569", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {order.note}
                      </p>
                    </div>
                  )}

                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={styles.viewButton}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                    >
                      <Eye style={{ width: "16px", height: "16px" }} />
                      View
                    </button>

                    {(order.status === "pending" || order.status === "in-progress") && (
                      <button
                        onClick={() => setUploadModalOpen(order)}
                        style={styles.uploadButton}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8 0%, #3730a3 100%)";
                          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(37, 99, 235, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Upload style={{ width: "16px", height: "16px" }} />
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
          <div style={styles.emptyState}>
            <FileText style={{ width: "80px", height: "80px", color: "#cbd5e1", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "#334155", margin: "0 0 8px 0" }}>
              No Orders Found
            </h3>
            <p style={{ color: "#64748b", margin: 0 }}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && !isPaginationLoading && (
          <div style={styles.paginationContainer}>
            <p style={{ color: "#475569", margin: 0 }}>
              Showing <b>{count}</b> orders on page <b>{currentPage}</b>
              {hasNextPage && (
                <span style={{ fontSize: "14px", color: "#94a3b8", marginLeft: "4px" }}> (More pages available)</span>
              )}
            </p>

            <div style={styles.paginationButtons}>
              <button
                disabled={!hasPrevPage || isPaginationLoading}
                onClick={handlePrevPage}
                style={{
                  ...styles.pageButton,
                  opacity: !hasPrevPage || isPaginationLoading ? 0.5 : 1,
                  cursor: !hasPrevPage || isPaginationLoading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (hasPrevPage && !isPaginationLoading) e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (hasPrevPage && !isPaginationLoading) e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <ChevronLeft style={{ width: "20px", height: "20px" }} />
                Previous
              </button>

              <div style={styles.pageNumber}>
                Page {currentPage}
              </div>

              <button
                disabled={!hasNextPage || isPaginationLoading}
                onClick={handleNextPage}
                style={{
                  ...styles.pageButton,
                  opacity: !hasNextPage || isPaginationLoading ? 0.5 : 1,
                  cursor: !hasNextPage || isPaginationLoading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (hasNextPage && !isPaginationLoading) e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (hasNextPage && !isPaginationLoading) e.currentTarget.style.backgroundColor = "white";
                }}
              >
                Next
                <ChevronRight style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {uploadModalOpen && (
        <UploadModal
          order={uploadModalOpen}
          onClose={() => setUploadModalOpen(null)}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}

      {/* Global styles for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes slideIn {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default OrdersTable;