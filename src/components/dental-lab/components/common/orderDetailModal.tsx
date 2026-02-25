import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  X,
  TestTube,
  FileCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  File,
  Archive,
  Download,
  Maximize2,
  Eye,
} from "lucide-react";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Define the two different order types
interface DentalOrder {
  _id: string;
  createdAt: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  paymentStatus: "pending" | "paid" | "failed";
  status: "draft" | "pending" | "in-progress" | "completed" | "ready" | "cancelled";
  stlFiles?: {
    lower?: string;
    total?: string;
    upper?: string;
  };
  totalAmount?: number;
  trays?: {
    upperArch: number;
    lowerArch: number;
  };
  updatedAt: string;
  vendorId: string;
  attachments?: Attachment[];
  resultFiles?: Attachment[];
  note?: string;
}

interface LabOrder {
  _id: string;
  vendor: string;
  dentist: string;
  patientId: string;
  patientname: string;
  doctorName: string;
  deliveryDate: string;
  appointmentId?: string;
  note: string;
  status: "pending" | "in-progress" | "completed" | "ready" | "cancelled";
  totalLabAmount: number;
  tests?: Test[];
  attachments: Attachment[];
  resultFiles: Attachment[];
  niftiFile?: {
    fileName: string;
    fileUrl: string;
  };
  price?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Union type for both order types
type Order = DentalOrder | LabOrder;

interface Attachment {
  _id: string;
  url?: string;
  fileName?: string;
  mimetype?: string;
  fileUrl?: string;
  name?: string;
  type?: string;
}

interface Test {
  testId: string;
  price: number;
  _id: string;
  testName?: string;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
}

interface SelectedImage {
  url: string;
  filename: string;
}

interface StlViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

// STL Viewer Component
const StlViewer: React.FC<StlViewerProps> = ({ fileUrl, fileName, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(1, 2, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffaa88, 0.8);
    directionalLight2.position.set(-1, 1, -1);
    scene.add(directionalLight2);

    const backLight = new THREE.DirectionalLight(0x88aaff, 0.5);
    backLight.position.set(0, 0, -2);
    scene.add(backLight);

    // Add grid and axes helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x4a5568, 0x2d3748);
    scene.add(gridHelper);

    // Load STL
    const loader = new STLLoader();
    loader.load(
      fileUrl,
      (geometry: THREE.BufferGeometry) => {
        geometry.center();
        
        // Compute bounding box to scale model appropriately
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
          const size = new THREE.Vector3();
          boundingBox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 5 / maxDim;
          geometry.scale(scale, scale, scale);
        }

        const material = new THREE.MeshPhongMaterial({
          color: 0x4f8aff,
          shininess: 30,
          emissive: 0x0,
          flatShading: false,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        modelRef.current = mesh;
        scene.add(mesh);
      },
      (progress: ProgressEvent) => {
        console.log('Loading STL:', (progress.loaded / progress.total * 100) + '%');
      },
      (error: unknown) => {
        console.error('Error loading STL:', error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current.geometry.dispose();
      }
      rendererRef.current?.dispose();
    };
  }, [fileUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'model.stl';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 10001,
          display: "flex",
          gap: "12px",
        }}
      >
        <button
          style={{
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
          }}
          onClick={toggleAutoRotate}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          title="Toggle Auto Rotate"
        >
          <Maximize2 style={{ width: "20px", height: "20px" }} />
        </button>
        <button
          style={{
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
          }}
          onClick={handleDownload}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          title="Download"
        >
          <Download style={{ width: "20px", height: "20px" }} />
        </button>
        <button
          style={{
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
          }}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          title="Close"
        >
          <X style={{ width: "20px", height: "20px" }} />
        </button>
      </div>
      
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10001,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          padding: "8px 16px",
          borderRadius: "9999px",
          fontSize: "14px",
        }}
      >
        {fileName}
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

// Type guards
const isLabOrder = (order: Order): order is LabOrder => {
  return 'totalLabAmount' in order || 'dentist' in order;
};

const isDentalOrder = (order: Order): order is DentalOrder => {
  return 'stlFiles' in order || 'trays' in order;
};

const getStatusConfig = (status: Order["status"]): StatusConfig => {
  const configs: Record<Order["status"], StatusConfig> = {
    draft: {
      bg: "#f3f4f6",
      text: "#4b5563",
      border: "#d1d5db",
      dot: "#6b7280",
      icon: FileText,
      label: "Draft",
    },
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

const getPriorityColor = (amount: number = 0) => {
  if (amount > 2000) return { bg: "#fee2e2", text: "#991b1b" };
  if (amount > 1000) return { bg: "#fef3c7", text: "#92400e" };
  return { bg: "#dcfce7", text: "#166534" };
};

const StatusBadge: React.FC<{ status: Order["status"] }> = ({ status }) => {
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "details" | "tests" | "attachments"
  >("details");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedStl, setSelectedStl] = useState<{ url: string; filename: string } | null>(null);

  // Helper functions to safely get order properties
  const getPatientName = (): string => {
    if (isLabOrder(order)) return order.patientname || "N/A";
    return order.patientName || "N/A";
  };

  const getDoctorName = (): string => {
    return order.doctorName || "N/A";
  };

  const getTotalAmount = (): number => {
    if (isLabOrder(order)) return order.totalLabAmount || 0;
    return order.totalAmount || 0;
  };

  const getNote = (): string => {
    return order.note || "No notes";
  };

  const getCreatedAt = (): string => {
    return order.createdAt || "";
  };

  const getDeliveryDate = (): string => {
    if (isLabOrder(order)) return order.deliveryDate || "";
    return order.updatedAt || "";
  };

  const getTests = (): Test[] => {
    if (isLabOrder(order)) return order.tests || [];
    return [];
  };

  const getAttachments = (): Attachment[] => {
    const attachments = order.attachments || [];
    return attachments.map(att => ({
      ...att,
      fileName: att.fileName || att.name || "Unnamed file",
      fileUrl: att.fileUrl || att.url,
      mimetype: att.mimetype || att.type || "application/octet-stream"
    }));
  };

  const getResultFiles = (): Attachment[] => {
    const resultFiles = order.resultFiles || [];
    return resultFiles.map(file => ({
      ...file,
      fileName: file.fileName || file.name || "Unnamed file",
      fileUrl: file.fileUrl || file.url,
      mimetype: file.mimetype || file.type || "application/octet-stream"
    }));
  };

  const getStlFiles = (): { lower?: string; upper?: string; total?: string } => {
    if (isDentalOrder(order) && order.stlFiles) {
      return order.stlFiles;
    }
    return {};
  };

  const getTrays = (): { upperArch?: number; lowerArch?: number } => {
    if (isDentalOrder(order) && order.trays) {
      return order.trays;
    }
    return {};
  };

  const getNiftiFile = (): { fileName?: string; fileUrl?: string } | null => {
    if (isLabOrder(order) && order.niftiFile) {
      return order.niftiFile;
    }
    return null;
  };

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
      width: "90%",
      maxWidth: "1200px",
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
      flexWrap: "wrap" as const,
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
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
    value: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#0f172a",
      margin: 0,
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
      gridColumn: "1 / -1",
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
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
    stlSection: {
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "16px",
      marginBottom: "16px",
    },
    stlGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginTop: "12px",
    },
    stlItem: {
      display: "flex",
      flexDirection: "column" as const,
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    },
    stlPreview: {
      height: "150px",
      backgroundColor: "#1e293b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative" as const,
    },
    stlInfo: {
      padding: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    stlActions: {
      display: "flex",
      gap: "8px",
    },
    stlActionButton: {
      padding: "6px",
      backgroundColor: "#f1f5f9",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
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

  const getFileUrl = (file: Attachment | string | undefined): string => {
    if (!file) return "";
    
    if (typeof file === 'string') {
      if (file.startsWith('http')) return file;
      return `http://localhost:8006${file}`;
    }
    
    const filePath = file.fileUrl || file.url;
    if (!filePath) return "";
    if (filePath.startsWith('http')) return filePath;
    return `http://localhost:8006${filePath}`;
  };

  const isImageFile = (mimetype?: string): boolean => {
    return mimetype?.startsWith('image/') || false;
  };

  const attachments = getAttachments();
  const resultFiles = getResultFiles();
  const stlFiles = getStlFiles();
  const trays = getTrays();
  const niftiFile = getNiftiFile();
  const totalAmount = getTotalAmount();
  const tests = getTests();

  // Generate a simple colored preview for STL files
  const StlPreviewIcon = () => (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "60px",
        height: "60px",
        backgroundColor: "#4f8aff",
        borderRadius: "12px",
        opacity: 0.8,
        boxShadow: "0 4px 20px rgba(79, 138, 255, 0.3)",
        animation: "pulse 2s infinite",
      }} />
      <Archive style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "32px",
        height: "32px",
        color: "white",
      }} />
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>Order Details</h2>
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
          {tests.length > 0 && (
            <button
              onClick={() => setActiveTab("tests")}
              style={styles.tab(activeTab === "tests")}
            >
              Tests ({tests.length})
            </button>
          )}
          {(attachments.length > 0 || resultFiles.length > 0 || Object.keys(stlFiles).length > 0 || niftiFile) && (
            <button
              onClick={() => setActiveTab("attachments")}
              style={styles.tab(activeTab === "attachments")}
            >
              Files ({attachments.length + resultFiles.length + Object.keys(stlFiles).length + (niftiFile ? 1 : 0)})
            </button>
          )}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === "details" && (
            <div style={styles.detailsGrid}>
              {/* Patient Info */}
              <div style={styles.infoCard("#eff6ff")}>
                <p style={styles.label}>Patient</p>
                <p style={styles.patientName}>{getPatientName()}</p>
                {isDentalOrder(order) && order.patientId && (
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    ID: {order.patientId}
                  </p>
                )}
              </div>

              {/* Doctor Info */}
              <div style={styles.infoCard("#f0fdf4")}>
                <p style={styles.label}>Doctor</p>
                <p style={styles.doctorName}>{getDoctorName()}</p>
              </div>

              {/* Status */}
              <div style={styles.infoCard("#faf5ff")}>
                <p style={styles.label}>Status</p>
                <div style={{ marginTop: "8px" }}>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Amount */}
              {totalAmount > 0 && (
                <div style={styles.amountContainer(totalAmount)}>
                  <p style={styles.label}>Total Amount</p>
                  <p
                    style={{
                      ...styles.amount,
                      color: getPriorityColor(totalAmount).text,
                    }}
                  >
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Payment Status (for Dental Orders) */}
              {isDentalOrder(order) && order.paymentStatus && (
                <div style={styles.infoCard("#fef9e7")}>
                  <p style={styles.label}>Payment Status</p>
                  <p style={styles.value}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </p>
                </div>
              )}

              {/* Trays (for Dental Orders) */}
              {(trays.upperArch !== undefined || trays.lowerArch !== undefined) && (
                <div style={styles.infoCard("#e6fffa")}>
                  <p style={styles.label}>Trays</p>
                  {trays.upperArch !== undefined && (
                    <p style={styles.value}>Upper: {trays.upperArch}</p>
                  )}
                  {trays.lowerArch !== undefined && (
                    <p style={styles.value}>Lower: {trays.lowerArch}</p>
                  )}
                </div>
              )}

              {/* Vendor Info */}
              {isLabOrder(order) && order.vendor && (
                <div style={styles.infoCard("#f3e8ff")}>
                  <p style={styles.label}>Vendor</p>
                  <p style={styles.value}>{order.vendor}</p>
                </div>
              )}

              {isDentalOrder(order) && order.vendorId && (
                <div style={styles.infoCard("#f3e8ff")}>
                  <p style={styles.label}>Vendor ID</p>
                  <p style={styles.value}>{order.vendorId}</p>
                </div>
              )}

              {/* Notes & Dates */}
              <div style={styles.fullWidth}>
                {/* Notes */}
                <div style={styles.notesContainer}>
                  <p style={styles.label}>Notes</p>
                  <p style={styles.notes}>{getNote()}</p>
                </div>

                {/* Dates */}
                <div style={styles.datesGrid}>
                  <div style={styles.dateCard}>
                    <p style={styles.label}>Order Date</p>
                    <p style={styles.dateValue}>
                      {formatDate(getCreatedAt())}
                    </p>
                  </div>
                  <div style={styles.dateCard}>
                    <p style={styles.label}>
                      {isLabOrder(order) ? "Delivery Date" : "Last Updated"}
                    </p>
                    <p style={styles.dateValue}>
                      {formatDate(getDeliveryDate())}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tests" && tests.length > 0 && (
            <div style={styles.testsContainer}>
              {tests.map((test) => (
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
                        {test.testName || `Test ID: ${test.testId.slice(-8)}`}
                      </p>
                      <p style={styles.testPrice}>Price: ${test.price}</p>
                    </div>
                  </div>
                  <p style={styles.testAmount}>${test.price}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "attachments" && (
            <div style={styles.attachmentsSection}>
              {/* STL Files (for Dental Orders) */}
              {Object.keys(stlFiles).length > 0 && (
                <div style={styles.stlSection}>
                  <h4 style={styles.sectionTitle}>3D Models (STL)</h4>
                  <div style={styles.stlGrid}>
                    {Object.entries(stlFiles).map(([key, path]) => (
                      path && (
                        <div
                          key={key}
                          style={styles.stlItem}
                        >
                          <div style={styles.stlPreview}>
                            <StlPreviewIcon />
                          </div>
                          <div style={styles.stlInfo}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                                {key.charAt(0).toUpperCase() + key.slice(1)} Jaw
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                STL File
                              </div>
                            </div>
                            <div style={styles.stlActions}>
                              <button
                                style={styles.stlActionButton}
                                onClick={() => window.open(getFileUrl(path), '_blank')}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#e2e8f0";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                                }}
                                title="Download"
                              >
                                <Download style={{ width: "14px", height: "14px", color: "#4b5563" }} />
                              </button>
                              <button
                                style={styles.stlActionButton}
                                onClick={() => setSelectedStl({
                                  url: getFileUrl(path),
                                  filename: `${key}_jaw.stl`
                                })}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#e2e8f0";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                                }}
                                title="View in 3D"
                              >
                                <Eye style={{ width: "14px", height: "14px", color: "#4b5563" }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* NIFTI File (for Lab Orders) */}
              {niftiFile && niftiFile.fileUrl && (
                <div style={styles.stlSection}>
                  <h4 style={styles.sectionTitle}>NIFTI File</h4>
                  <div style={styles.stlGrid}>
                    <div
                      style={styles.stlItem}
                    >
                      <div style={styles.stlPreview}>
                        <File style={{
                          width: "48px",
                          height: "48px",
                          color: "#4f8aff",
                        }} />
                      </div>
                      <div style={styles.stlInfo}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>
                            CBCT Scan
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            {niftiFile.fileName || "NIFTI File"}
                          </div>
                        </div>
                        <div style={styles.stlActions}>
                          <button
                            style={styles.stlActionButton}
                            onClick={() => window.open(getFileUrl(niftiFile.fileUrl), '_blank')}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#e2e8f0";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#f1f5f9";
                            }}
                            title="Download"
                          >
                            <Download style={{ width: "14px", height: "14px", color: "#4b5563" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Attachments */}
              {attachments.length > 0 && (
                <div>
                  <h4 style={styles.sectionTitle}>Order Attachments</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {attachments.map((file) => {
                      const isImage = isImageFile(file.mimetype);
                      const fileUrl = getFileUrl(file);
                      
                      if (!fileUrl) return null;

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

              {/* Result Files */}
              {resultFiles.length > 0 && (
                <div>
                  <h4 style={styles.sectionTitle}>Result Files</h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {resultFiles.map((file) => {
                      const isImage = isImageFile(file.mimetype);
                      const fileUrl = getFileUrl(file);
                      
                      if (!fileUrl) return null;

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
              {attachments.length === 0 && resultFiles.length === 0 && 
               Object.keys(stlFiles).length === 0 && !niftiFile && (
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

      {/* STL Viewer Modal */}
      {selectedStl && (
        <StlViewer
          fileUrl={selectedStl.url}
          fileName={selectedStl.filename}
          onClose={() => setSelectedStl(null)}
        />
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