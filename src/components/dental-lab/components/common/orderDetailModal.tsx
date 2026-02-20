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
import labBaseUrl from "../../../../labBaseUrl";

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
  fileName: string;
  mimetype: string;
  fileUrl?: string; // Add optional fileUrl property
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

interface SelectedImage {
  url: string;
  filename: string;
}

const getStatusConfig = (status: LabOrder["status"]): StatusConfig => {
  const configs = {
    pending: {
      bg: "#fef9e7",
      text: "#b45309",
      border: "#fed7aa",
      dot: "#eab308",
      icon: Clock,
      label: "Pending",
    },
    "in-progress": {
      bg: "#eff6ff",
      text: "#1e40af",
      border: "#bfdbfe",
      dot: "#3b82f6",
      icon: AlertCircle,
      label: "In Progress",
    },
    completed: {
      bg: "#f0fdf4",
      text: "#166534",
      border: "#bbf7d0",
      dot: "#22c55e",
      icon: CheckCircle,
      label: "Completed",
    },
    ready: {
      bg: "#faf5ff",
      text: "#6b21a8",
      border: "#e9d5ff",
      dot: "#a855f7",
      icon: FileCheck,
      label: "Ready",
    },
    cancelled: {
      bg: "#fef2f2",
      text: "#991b1b",
      border: "#fecaca",
      dot: "#ef4444",
      icon: XCircle,
      label: "Cancelled",
    },
  };
  return configs[status] || configs.pending;
};

const getPriorityColor = (amount: number) => {
  if (amount > 2000) return { bg: "#fee2e2", text: "#991b1b" };
  if (amount > 1000) return { bg: "#fef3c7", text: "#92400e" };
  return { bg: "#dcfce7", text: "#166534" };
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
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
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
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  const styles = {
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
      maxHeight: "90vh",
      overflow: "hidden",
      width: "80%",
      animation: "slideIn 0.3s ease-out",
    },
    header: {
      padding: "24px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between" as const,
    },
    headerLeft: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "4px",
    },
    title: {
      fontSize: "24px",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    orderId: {
      fontSize: "14px",
      color: "#64748b",
      margin: 0,
    },
    closeButton: {
      padding: "8px",
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "background-color 0.2s",
      height: "44px",
      width: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    tabsContainer: {
      display: "flex" as const,
      borderBottom: "1px solid #e2e8f0",
    },
    tab: (isActive: boolean) => ({
      padding: "12px 24px",
      fontSize: "16px",
      fontWeight: 500,
      backgroundColor: "transparent",
      border: "none",
      borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
      color: isActive ? "#2563eb" : "#64748b",
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    content: {
      padding: "24px",
      overflowY: "auto" as const,
      maxHeight: "calc(90vh - 180px)",
    },
    detailsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "24px",
    },
    infoCard: (bgColor: string) => ({
      backgroundColor: bgColor,
      padding: "16px",
      borderRadius: "16px",
    }),
    label: {
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "4px",
    },
    patientName: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    doctorName: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#0f172a",
      margin: 0,
    },
    amountContainer: (amount: number) => {
      const colors = getPriorityColor(amount);
      return {
        padding: "16px",
        borderRadius: "16px",
        backgroundColor: colors.bg,
      };
    },
    amount: {
      fontSize: "24px",
      fontWeight: 700,
      margin: 0,
    },
    fullWidth: {
      gridColumn: "span 2 / span 2",
      display: "flex",
      flexDirection: "column" as const,
      gap: "16px",
    },
    notesContainer: {
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "16px",
    },
    notes: {
      fontSize: "16px",
      color: "#334155",
      margin: "8px 0 0 0",
    },
    datesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "16px",
    },
    dateCard: {
      backgroundColor: "white",
      border: "2px solid #e2e8f0",
      padding: "16px",
      borderRadius: "12px",
    },
    dateValue: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#0f172a",
      margin: "4px 0 0 0",
    },
    testsContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "16px",
    },
    testItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "16px",
    },
    testLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    testIcon: {
      width: "40px",
      height: "40px",
      backgroundColor: "#dbeafe",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    testInfo: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "4px",
    },
    testId: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#0f172a",
      margin: 0,
    },
    testPrice: {
      fontSize: "14px",
      color: "#64748b",
      margin: 0,
    },
    testAmount: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    attachmentsSection: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "24px",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: 600,
      color: "#0f172a",
      margin: "0 0 12px 0",
    },
    emptyState: {
      textAlign: "center" as const,
      padding: "48px 0",
    },
    emptyIcon: {
      width: "64px",
      height: "64px",
      color: "#cbd5e1",
      margin: "0 auto 12px",
    },
    emptyText: {
      fontSize: "16px",
      fontWeight: 500,
      color: "#64748b",
      margin: 0,
    },
  };

  const getFileUrl = (file: Attachment): string => {
    // Use fileUrl if available, otherwise fallback to url
    const filePath = file.fileUrl || file.url;
    return `http://localhost:8006${filePath}`;
  };
  console.log(order);
  
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>Lab Order Details</h2>
            <p style={styles.orderId}>Order #{order._id.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X style={{ width: "24px", height: "24px", color: "#64748b" }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab("details")}
            style={styles.tab(activeTab === "details")}
          >
            Details
          </button>
          {/* <button
            onClick={() => setActiveTab("tests")}
            style={styles.tab(activeTab === "tests")}
          >
            Tests ({order?.tests?.length || 0})
          </button> */}
          <button
            onClick={() => setActiveTab("attachments")}
            style={styles.tab(activeTab === "attachments")}
          >
            Files ({order.attachments.length + order.resultFiles.length})
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === "details" && (
            <div style={styles.detailsGrid}>
              {/* Patient Info */}
              <div style={styles.infoCard("#eff6ff")}>
                <p style={styles.label}>Patient</p>
                <p style={styles.patientName}>{order.patientname}</p>
              </div>

              {/* Doctor Info */}
              <div style={styles.infoCard("#f0fdf4")}>
                <p style={styles.label}>Doctor</p>
                <p style={styles.doctorName}>{order.doctorName}</p>
              </div>

              {/* Status */}
              <div style={styles.infoCard("#faf5ff")}>
                <p style={styles.label}>Status</p>
                <div style={{ marginTop: "8px" }}>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Amount */}
              <div style={styles.amountContainer(order.totalLabAmount)}>
                <p style={styles.label}>Total Amount</p>
                <p
                  style={{
                    ...styles.amount,
                    color: getPriorityColor(order.totalLabAmount).text,
                  }}
                >
                  ${order.totalLabAmount}
                </p>
              </div>

              {/* Notes & Dates */}
              <div style={styles.fullWidth}>
                {/* Notes */}
                <div style={styles.notesContainer}>
                  <p style={styles.label}>Notes</p>
                  <p style={styles.notes}>{order.note || "No notes"}</p>
                </div>

                {/* Dates */}
                <div style={styles.datesGrid}>
                  <div style={styles.dateCard}>
                    <p style={styles.label}>Order Date</p>
                    <p style={styles.dateValue}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div style={styles.dateCard}>
                    <p style={styles.label}>Delivery Date</p>
                    <p style={styles.dateValue}>
                      {formatDate(order.deliveryDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* {activeTab === "tests" && (
            <div style={styles.testsContainer}>
              {order?.tests?.map((test) => (
                <div key={test._id} style={styles.testItem}>
                  <div style={styles.testLeft}>
                    <div style={styles.testIcon}>
                      <TestTube
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#2563eb",
                        }}
                      />
                    </div>
                    <div style={styles.testInfo}>
                      <p style={styles.testId}>
                        Test ID: {test.testId.slice(-8)}
                      </p>
                      <p style={styles.testPrice}>Price: ${test.price}</p>
                    </div>
                  </div>
                  <p style={styles.testAmount}>${test.price}</p>
                </div>
              ))}
              {(!order?.tests || order.tests.length === 0) && (
                <div style={styles.emptyState}>
                  <TestTube style={styles.emptyIcon} />
                  <p style={styles.emptyText}>No tests found</p>
                </div>
              )}
            </div>
          )} */}

          {activeTab === "attachments" && (
            <div style={styles.attachmentsSection}>
              {/* Order Attachments */}
              {order.attachments.length > 0 && (
                <div>
                  <h4 style={styles.sectionTitle}>Order Attachments</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {order.attachments.map((file) => {
                      const isImage = file.mimetype?.startsWith('image/');
                      const fileUrl = getFileUrl(file);
                      
                      return (
                        <div
                          key={file._id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            cursor: "pointer",
                            height: "fit-content"
                          }}
                          onClick={() => isImage ? setSelectedImage({
                            url: fileUrl,
                            filename: file.fileName|| "attachment"
                          }) : window.open(fileUrl, '_blank')}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "180px",
                              backgroundColor: "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {isImage ? (
                              <img
                                src={fileUrl}
                                alt={file.fileName || "attachment"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transition: "transform 0.3s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                              />
                            ) : (
                              <FileText
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  color: "#64748b",
                                }}
                              />
                            )}
                          </div>
                          <div style={{ padding: "12px" }}>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#0f172a",
                                fontWeight: 500,
                                display: "block",
                                marginBottom: "4px",
                                wordBreak: "break-all",
                              }}
                            >
                              {file.fileName || "Unnamed file"}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                              }}
                            >
                              {isImage ? "Click to enlarge" : "Click to open"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Result Files */}
              {order.resultFiles.length > 0 && (
                <div>
                  <h4 style={styles.sectionTitle}>Result Files</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {order.resultFiles.map((file) => {
                      const isImage = file.mimetype?.startsWith('image/');
                      const fileUrl = getFileUrl(file);
                      
                      return (
                        <div
                          key={file._id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            cursor: "pointer",
                            height: "fit-content",
                            
                          }}
                          onClick={() => isImage ? setSelectedImage({
                            url: fileUrl,
                            filename: file.fileName || "attachment"
                          }) : window.open(fileUrl, '_blank')}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "180px",
                              backgroundColor: "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {isImage ? (
                              <img
                                src={fileUrl}
                                alt={file.fileName || "attachment"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transition: "transform 0.3s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                              />
                            ) : (
                              <FileText
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  color: "#64748b",
                                }}
                              />
                            )}
                          </div>
                          <div style={{ padding: "12px" }}>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#0f172a",
                                fontWeight: 500,
                                display: "block",
                                marginBottom: "4px",
                                wordBreak: "break-all",
                              }}
                            >
                              {file.fileName || "Unnamed file"}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                              }}
                            >
                              {isImage ? "Click to enlarge" : "Click to open"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {order.attachments.length === 0 &&
                order.resultFiles.length === 0 && (
                  <div style={styles.emptyState}>
                    <FileText style={styles.emptyIcon} />
                    <p style={styles.emptyText}>No files attached</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "pointer",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
              zIndex: 10001,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <X style={{ width: "24px", height: "24px" }} />
          </button>
          
          <div
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            />
            <span
              style={{
                marginTop: "16px",
                color: "white",
                fontSize: "14px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                padding: "8px 16px",
                borderRadius: "9999px",
                maxWidth: "80%",
                wordBreak: "break-all",
                textAlign: "center",
              }}
            >
              {selectedImage.filename}
            </span>
          </div>
        </div>
      )}

      {/* Global styles for animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
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

export default OrderDetailsModal;