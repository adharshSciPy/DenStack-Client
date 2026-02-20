// src/modules/dental-lab/DentalLabModule.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import CreateOrderModal from "./components/modals/CreateOrderModal";
import UploadResultsModal from "./components/modals/UploadResultsModal";
import axios from "axios";

interface LabUploadPayload {
  files: File[];
  notes: string;
}

interface LabOrder {
  _id: string;
  patientname: string;
  patientId?: string;
  clinicId?: string;
  status?: "pending" | "processing" | "completed" | "delivered";
  createdAt?: string;
  dueDate?: string;
  attachments?: string[];
  results?: string[];
  notes?: string;
}

const DentalLabModule = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  // 🔥 Exposed handler (can be passed via context later if needed)
  const handleUploadResults = async ({ files, notes }: LabUploadPayload) => {
    if (!selectedOrder) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("notes", notes);
    formData.append("orderId", selectedOrder._id);

    await axios.post("/api/v1/labs/results", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setShowUploadModal(false);
  };

  return (
    <DashboardLayout onCreateOrder={() => setShowCreateModal(true)}>
      {/* 🔥 ROUTER WILL RENDER PAGES HERE */}
      <Outlet />

      {/* MODALS (GLOBAL TO LAB MODULE) */}
      {showCreateModal && (
        <CreateOrderModal onClose={() => setShowCreateModal(false)} />
      )}

      {showUploadModal && selectedOrder && (
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
