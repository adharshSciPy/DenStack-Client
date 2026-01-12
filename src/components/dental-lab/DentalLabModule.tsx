// src/modules/dental-lab/DentalLabModule.jsx
import React, { useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import RevenuePage from "./pages/RevenuePage";
import CreateOrderModal from "./components/modals/CreateOrderModal";
import UploadResultsModal from "./components/modals/UploadResultsModal";
import axios from "axios";

interface OrdersPageProps {
  onUploadResults: (order: LabOrder) => void;
}

interface LabUploadPayload {
  files: File[];
  notes: string;
}
interface LabOrder {
  _id: string;
  patientname: string;
  patientId?: string;
  clinicId?: string;

  // Order Info
  status: "pending" | "processing" | "completed" | "delivered";
  createdAt: string;
  dueDate?: string;

  // Files uploaded by clinic (optional)
  attachments?: string[];

  // Files uploaded by lab after completion
  results?: string[];
  notes?: string;
}

const DentalLabModule = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Handle files + notes coming from modal
  const handleUploadResults = async ({ files, notes }: LabUploadPayload) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("notes", notes);
    formData.append("orderId", selectedOrder._id);

    await axios.post("/api/v1/labs/results", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // TODO: Refresh orders or show toast if needed
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onCreateOrder={() => setShowCreateModal(true)}
    >
      {activeTab === "dashboard" && <DashboardPage />}

      {activeTab === "orders" && (
        <OrdersPage
          onUploadResults={(order:LabOrder) => {
            setSelectedOrder(order);
            setShowUploadModal(true);
          }}
        />
      )}

      {activeTab === "revenue" && <RevenuePage />}

      {showCreateModal && (
        <CreateOrderModal onClose={() => setShowCreateModal(false)} />
      )}

      {showUploadModal && (
        <UploadResultsModal
          order={selectedOrder}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUploadResults}
        />
      )}
    </DashboardLayout>
  );
};

export default DentalLabModule;
