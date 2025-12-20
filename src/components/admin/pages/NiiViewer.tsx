import React, { useEffect, useRef, useState } from "react";
import { Niivue } from "@niivue/niivue";

interface NiiViewerProps {
  fileUrl: string;
}

const NiiViewer: React.FC<NiiViewerProps> = ({ fileUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nvRef = useRef<Niivue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!fileUrl || !canvasRef.current) {
      setError("Missing file URL or canvas element");
      setLoading(false);
      return;
    }

    console.log("Initializing Niivue with URL:", fileUrl);
    setLoading(true);
    setError("");

    // Create a new Niivue instance
    const nv = new Niivue({
      show3Dcrosshair: true,
      isColorbar: true,
      dragAndDropEnabled: false,
      backColor: [0.1, 0.1, 0.1, 1],
      crosshairColor: [1, 0, 0, 1],
    });

    try {
      nv.attachToCanvas(canvasRef.current);
      nvRef.current = nv;

      // Load NIfTI volume with proper error handling
      nv.loadVolumes([
        { 
          url: fileUrl,
          colormap: "gray",
          opacity: 1.0,
        }
      ])
        .then(() => {
          console.log("Successfully loaded NIfTI:", fileUrl);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading NIfTI:", err);
          setError(`Failed to load scan: ${err.message || "Unknown error"}`);
          setLoading(false);
        });
    } catch (err: any) {
      console.error("Error initializing Niivue:", err);
      setError(`Initialization error: ${err.message || "Unknown error"}`);
      setLoading(false);
    }

    // Cleanup
    return () => {
      try {
        if (nvRef.current && canvasRef.current) {
          // Niivue doesn't have a destroy method, so we just clear the reference
          nvRef.current = null;
        }
      } catch (err) {
        console.warn("NiiViewer cleanup error:", err);
      }
    };
  }, [fileUrl]);

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "18px",
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.8)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          Loading 3D scan...
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#ff6b6b",
            fontSize: "16px",
            zIndex: 10,
            textAlign: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.9)",
            borderRadius: "8px",
            maxWidth: "80%",
          }}
        >
          <div style={{ marginBottom: "10px", fontWeight: "bold" }}>Error Loading Scan</div>
          <div style={{ fontSize: "14px" }}>{error}</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          opacity: loading ? 0.3 : 1,
          transition: "opacity 0.3s",
        }}
      />
    </div>
  );
};

export default NiiViewer;