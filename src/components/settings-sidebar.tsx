import React, { useEffect, useState } from "react";
import axios from "axios";
import NiiViewer from "./NiiViewer";
import labBaseUrl from "../labBaseUrl";

interface ResultFile {
  fileName: string;
  fileUrl: string;
}

interface Order {
  resultFiles: ResultFile[];
}

function Settings() {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [fileInfo, setFileInfo] = useState<string>("");
  const id = "6901e075332f8ca5d8173170";

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await axios.get<{ order: Order }>(
          `${labBaseUrl}api/v1/lab-orders/dental-orders/${id}`
        );
        const order = response.data.order;
        console.log("Response data:", order);

        const niiFile = order.resultFiles.find(
          (file) =>
            file.fileName.endsWith(".nii") || 
            file.fileName.endsWith(".nii.gz") ||
            file.fileName.endsWith(".gz")
        );
        
        if (niiFile) {
          const baseUrl = labBaseUrl.replace(/\/$/, "");
          const fileUrlPath = niiFile.fileUrl.startsWith("/")
            ? niiFile.fileUrl
            : `/${niiFile.fileUrl}`;
          const fullUrl = `${baseUrl}${fileUrlPath}`;
          
          console.log("NIfTI file info:", {
            fileName: niiFile.fileName,
            fileUrl: niiFile.fileUrl,
            fullUrl: fullUrl
          });

          setFileInfo(`File: ${niiFile.fileName}`);
          setFileUrl(fullUrl);

          // Test if the file is accessible
          try {
            const testResponse = await fetch(fullUrl, { method: 'HEAD' });
            console.log("File accessibility test:", {
              status: testResponse.status,
              headers: Object.fromEntries(testResponse.headers.entries())
            });
          } catch (fetchErr) {
            console.warn("File accessibility test failed:", fetchErr);
          }
        } else {
          setError("No NIfTI file found in the order");
          console.log("Available files:", order.resultFiles.map(f => f.fileName));
        }
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? `Error fetching data: ${err.message}`
          : "An unexpected error occurred";
        console.error("Error:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Settings Sidebar</h2>
        <p>Loading NIfTI file information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Settings Sidebar</h2>
        <p style={{ color: "#ff6b6b" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Settings Sidebar</h2>
      {fileUrl ? (
        <div>
          <p style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
            {fileInfo}
          </p>
          <p style={{ marginBottom: "10px", fontSize: "12px", color: "#999", wordBreak: "break-all" }}>
            URL: {fileUrl}
          </p>
          <NiiViewer fileUrl={fileUrl} />
        </div>
      ) : (
        <p>No NIfTI file available</p>
      )}
    </div>
  );
}

export default Settings;
