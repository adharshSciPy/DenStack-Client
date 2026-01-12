import React, { useState } from "react";
import { X, Upload, FileText, CheckCircle } from "lucide-react";

// ---------------- TYPES ----------------
export interface LabUploadPayload {
  files: File[];
  notes: string;
}

export interface LabOrder {
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

export interface UploadResultsModalProps {
  order: LabOrder;
  onClose: () => void;
  onSubmit?: (data: LabUploadPayload) => void;
}

// ---------------- COMPONENT ----------------
const UploadResultsModal: React.FC<UploadResultsModalProps> = ({
  order,
  onClose,
  onSubmit,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setUploading(true);

    try {
      if (onSubmit) {
        onSubmit({ files, notes });
      }

      onClose();
    } catch (error) {
      console.error("Error uploading results:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Upload Lab Results</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Order ID: {order?._id} • Patient: {order?.patientname}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* File Upload */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer group">
              <input
                type="file"
                multiple
                accept=".pdf,.dcm,.jpg,.jpeg,.png,.stl"
                onChange={handleFileUpload}
                className="hidden"
                id="results-upload"
              />
              <label htmlFor="results-upload" className="cursor-pointer">
                <div className="inline-flex p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors mb-4">
                  <Upload className="w-12 h-12 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Click to upload lab results
                </p>
                <p className="text-xs text-gray-500">
                  PDFs, images, DICOM, STL files supported
                </p>
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Add any notes about these results..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Upload Results ({files.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadResultsModal;
