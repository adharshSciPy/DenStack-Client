import React from "react";
import { Download, FileText } from "lucide-react";

interface Attachment {
  _id: string;
  url: string;
  filename: string;
  mimetype: string;
}

const fileUrl = "http://localhost:8006";

const FilePreviewCard: React.FC<{ file: any }> = ({ file }) => {
  const url = file.fileUrl || file.url || "";
  const name = file.fileName || file.filename || "";
  const type = file.mimeType || file.mimetype || "";

  return (
    <div className="bg-gray-50 border rounded-xl p-3 flex gap-4 items-center">
      <div className="w-20 h-20 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
        {type.startsWith("image/") ? (
          <img
            src={`${fileUrl}${url}`}
            alt={name}
            className="object-cover w-full h-full"
          />
        ) : (
          <FileText className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <div className="flex-1">
        <p className="font-medium text-gray-800 truncate">{name}</p>
      </div>

      <div className="flex gap-2">
        <a
          href={`${fileUrl}${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200"
        >
          <FileText className="w-4 h-4 text-blue-700" />
        </a>

        {/* <a
          href={`${fileUrl}${url}`}
          download={name}
          className="p-2 rounded-lg bg-green-100 hover:bg-green-200"
        >
          <Download className="w-4 h-4 text-green-700" />
        </a> */}
      </div>
    </div>
  );
};


export default FilePreviewCard;
