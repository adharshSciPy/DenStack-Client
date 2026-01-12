import React, { useState } from "react";
import { X, Upload, Plus, DollarSign } from "lucide-react";
import { LAB_VENDORS, DOCTORS, ORDER_TYPES } from "../../utils/constants";

// ---- Types ----
export interface CreateOrderFormData {
  patientName: string;
  doctorId: string;
  vendorId: string;
  orderType: string;
  deliveryDate: string;
  price: string | number;
  notes: string;
  attachments: File[];
}

interface CreateOrderModalProps {
  onClose: () => void;
  onSubmit?: (data: CreateOrderFormData) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateOrderFormData>({
    patientName: "",
    doctorId: "",
    vendorId: "",
    orderType: "",
    deliveryDate: "",
    price: "",
    notes: "",
    attachments: [],
  });

  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      console.log("Creating order:", formData);

      onSubmit?.(formData);
      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* ... SAME JSX ... */}
    </div>
  );
};

export default CreateOrderModal;
