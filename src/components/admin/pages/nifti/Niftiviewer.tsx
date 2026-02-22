// src/components/nifti/Niftiviewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Niivue, NVImage, SLICE_TYPE } from '@niivue/niivue';
import { 
  Loader2, 
  RotateCcw, 
  Download, 
  ZoomIn, 
  ZoomOut,
  Eye,
  EyeOff,
  Contrast,
  Maximize2,
  Settings,
  X,
  Grid3x3,
  Box
} from 'lucide-react';

interface ThreeDCBCTViewerProps {
  fileUrl: string | undefined;
  fileName?: string;
  className?: string;
  onError?: (msg: string) => void;
  onLoadComplete?: () => void;
  showControls?: boolean;
}

interface VolumeInfo {
  dimensions?: [number, number, number, number];
  voxelSize?: [number, number, number, number];
  minMax?: [number, number];
  center?: [number, number, number];
}

interface SlicePositions {
  axial: number;
  coronal: number;
  sagittal: number;
}

const ThreeDCBCTViewer: React.FC<ThreeDCBCTViewerProps> = ({
  fileUrl,
  fileName = 'CBCT Volume',
  className = '',
  onError,
  onLoadComplete,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nvInstance, setNvInstance] = useState<Niivue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [showVolume, setShowVolume] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [volumeInfo, setVolumeInfo] = useState<VolumeInfo | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [currentSlice, setCurrentSlice] = useState<SlicePositions>({ axial: 0, coronal: 0, sagittal: 0 });

  const getFullUrl = () => {
    return fileUrl?.startsWith('http') ? fileUrl : `http://localhost:8006${fileUrl}`;
  };

  console.log("3d viewer file url", getFullUrl());

  useEffect(() => {
    const loadVolume = async () => {
      if (!fileUrl || !canvasRef.current) {
        setError('Missing file or canvas');
        setLoading(false);
        return;
      }

      let nv: Niivue | null = null;
      let resizeObserver: ResizeObserver | null = null;

      try {
        setLoading(true);
        setError(null);
        
        // Create Niivue instance with both 2D and 3D capabilities
        nv = new Niivue({
          backColor: [0, 0, 0, 1],
          dragAndDropEnabled: false,
          isSliceMM: true,
          isRadiologicalConvention: true,
          show3Dcrosshair: true,
          crosshairColor: [1, 0, 0, 0.8],
          crosshairWidth: 2,
          multiplanarForceRender: true,
          isColorbar: true,
          colorbarMargin: 0.05,
          multiplanarPadPixels: 4,
        });

        nv.attachToCanvas(canvasRef.current);
        setNvInstance(nv);

        // Handle responsive resizing
        if (containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            nv?.drawScene();
          });
          resizeObserver.observe(containerRef.current);
        }

        // Load the DICOM/NIfTI file
        await nv.loadVolumes([
          {
            url: getFullUrl(),
            name: fileName,
            colorMap: 'gray',
            opacity: 1,
            cal_min: -1000,
            cal_max: 3000,
          },
        ]);

        // Set to multiplanar view by default - use SLICE_TYPE constant
        nv.setSliceType(nv.sliceTypeMultiplanar);

        // Store volume info
        const vol = nv.volumes?.[0] as NVImage;
        if (vol) {
          const dims = vol.dims;
          const pixDims = vol.pixDims;
          
          // Safe access with fallback values
          const dimX = dims?.[1] || 0;
          const dimY = dims?.[2] || 0;
          const dimZ = dims?.[3] || 0;
          
          setVolumeInfo({
            dimensions: dims as [number, number, number, number],
            voxelSize: pixDims as [number, number, number, number],
            minMax: [vol.cal_min ?? 0, vol.cal_max ?? 0],
            center: [
              dimX / 2,
              dimY / 2,
              dimZ / 2
            ]
          });
          
          // Initialize slice positions
          setCurrentSlice({
            axial: Math.floor(dimZ / 2),
            coronal: Math.floor(dimY / 2),
            sagittal: Math.floor(dimX / 2)
          });
        }

        // Set initial view for 3D
        nv.setClipPlane([210, 25, 0]);
        nv.drawScene();

        setLoading(false);
        onLoadComplete?.();

      } catch (err: any) {
        console.error('Failed to load volume:', err);
        setError(err.message || 'Failed to load 3D volume');
        onError?.(err.message || 'Failed to load 3D volume');
        setLoading(false);
      }

      return () => {
        if (resizeObserver) resizeObserver.disconnect();
      };
    };

    loadVolume();
  }, [fileUrl, fileName, onError, onLoadComplete]);

  const toggleViewMode = () => {
    if (nvInstance) {
      if (viewMode === '2d') {
        // Switch to 3D render view - use SLICE_TYPE constant
        nvInstance.setSliceType(nvInstance.sliceTypeRender);
        setViewMode('3d');
      } else {
        // Switch to 2D multiplanar view - use SLICE_TYPE constant
        nvInstance.setSliceType(nvInstance.sliceTypeMultiplanar);
        setViewMode('2d');
      }
      nvInstance.drawScene();
    }
  };

  const handleResetView = () => {
    if (nvInstance) {
      const vol = nvInstance.volumes?.[0] as NVImage;
      if (vol && vol.dims) {
        const dims = vol.dims;
        const dimX = dims[1] || 0;
        const dimY = dims[2] || 0;
        const dimZ = dims[3] || 0;
        
        if (viewMode === '2d') {
          // Reset 2D views to center
          const centerX = Math.floor(dimX / 2);
          const centerY = Math.floor(dimY / 2);
          const centerZ = Math.floor(dimZ / 2);
          
          // Use Float32Array for vec3 type
          nvInstance.scene.crosshairPos = new Float32Array([centerX, centerY, centerZ]);
          
          setCurrentSlice({
            axial: centerZ,
            coronal: centerY,
            sagittal: centerX
          });
        } else {
          // Reset 3D view
          nvInstance.scene.renderAzimuth = 0;
          nvInstance.scene.renderElevation = 0;
          nvInstance.setClipPlane([210, 25, 0]);
        }
        nvInstance.drawScene();
      }
    }
  };

  const handleZoomIn = () => {
    if (nvInstance) {
      // Use volScaleMultiplier for zoom control
      nvInstance.volScaleMultiplier *= 1.2;
      nvInstance.drawScene();
    }
  };

  const handleZoomOut = () => {
    if (nvInstance) {
      // Use volScaleMultiplier for zoom control
      nvInstance.volScaleMultiplier *= 0.8;
      nvInstance.drawScene();
    }
  };

  const changeSlice = (orientation: 'axial' | 'coronal' | 'sagittal', delta: number) => {
    if (nvInstance) {
      const vol = nvInstance.volumes?.[0] as NVImage;
      if (vol && vol.dims) {
        const dims = vol.dims;
        const crosshairPos = nvInstance.scene.crosshairPos;
        const newPos = new Float32Array([crosshairPos[0], crosshairPos[1], crosshairPos[2]]);
        
        switch (orientation) {
          case 'axial':
            newPos[2] = Math.max(0, Math.min((dims[3] || 1) - 1, newPos[2] + delta));
            setCurrentSlice(prev => ({ ...prev, axial: newPos[2] }));
            break;
          case 'coronal':
            newPos[1] = Math.max(0, Math.min((dims[2] || 1) - 1, newPos[1] + delta));
            setCurrentSlice(prev => ({ ...prev, coronal: newPos[1] }));
            break;
          case 'sagittal':
            newPos[0] = Math.max(0, Math.min((dims[1] || 1) - 1, newPos[0] + delta));
            setCurrentSlice(prev => ({ ...prev, sagittal: newPos[0] }));
            break;
        }
        
        nvInstance.scene.crosshairPos = newPos;
        nvInstance.drawScene();
      }
    }
  };

  const handleColorMapChange = (map: string) => {
    if (nvInstance?.volumes?.[0]) {
      const vol = nvInstance.volumes[0] as NVImage;
      vol.colorMap = map;
      nvInstance.updateGLVolume();
    }
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    if (nvInstance?.volumes?.[0]) {
      const vol = nvInstance.volumes[0] as NVImage;
      vol.opacity = value;
      nvInstance.updateGLVolume();
    }
  };

  const handleToggleVolume = () => {
    setShowVolume(!showVolume);
    if (nvInstance?.volumes?.[0]) {
      const vol = nvInstance.volumes[0] as NVImage;
      vol.opacity = showVolume ? 0 : opacity;
      nvInstance.updateGLVolume();
    }
  };

  const handleWindowLevelChange = (center: number, width: number) => {
    if (nvInstance?.volumes?.[0]) {
      const vol = nvInstance.volumes[0] as NVImage;
      vol.cal_min = center - width/2;
      vol.cal_max = center + width/2;
      nvInstance.updateGLVolume();
    }
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleDownloadFile = async () => {
    try {
      const response = await fetch(getFullUrl());
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'volume.nii';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}
      style={{
        minHeight: '600px',
        height: '700px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}
    >
      {/* Loading Overlay */}
      {loading && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-30"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" />
            <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-300 animate-pulse" />
          </div>
          <p 
            className="mt-6 text-xl font-semibold text-white"
            style={{ textShadow: '0 2px 10px rgba(59, 130, 246, 0.5)' }}
          >
            Loading 3D Volume...
          </p>
          <p className="mt-2 text-blue-200 opacity-80">{fileName}</p>
          <div className="mt-4 w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-30 p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(69, 10, 10, 0.95) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="text-center max-w-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-900/50 flex items-center justify-center border-2 border-red-500/50">
              <X className="w-8 h-8 text-red-300" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Volume Load Failed</h3>
            <p className="text-red-200 mb-6 bg-red-900/30 p-4 rounded-lg border border-red-700/50">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                style={{ boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}
              >
                <RotateCcw size={18} /> Reload
              </button>
              <button
                onClick={handleDownloadFile}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-medium hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Download size={18} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          display: loading || error ? 'none' : 'block',
          cursor: viewMode === '3d' ? 'grab' : 'default'
        }}
      />

      {/* Info Panel */}
      {showInfo && volumeInfo && (
        <div 
          className="absolute top-4 right-4 w-64 bg-gray-900/90 backdrop-blur-md rounded-xl p-4 z-20 border border-gray-700/50 shadow-2xl"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Volume Info</h3>
            <button 
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Dimensions:</span>
              <span className="text-white font-mono">
                {volumeInfo.dimensions?.[1] || 0}×{volumeInfo.dimensions?.[2] || 0}×{volumeInfo.dimensions?.[3] || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Voxel Size:</span>
              <span className="text-white font-mono">
                {volumeInfo.voxelSize?.[1]?.toFixed(2) || '0.00'}×{volumeInfo.voxelSize?.[2]?.toFixed(2) || '0.00'}×{volumeInfo.voxelSize?.[3]?.toFixed(2) || '0.00'} mm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Data Range:</span>
              <span className="text-white font-mono">
                {volumeInfo.minMax?.[0] || 0} to {volumeInfo.minMax?.[1] || 0}
              </span>
            </div>
            {viewMode === '2d' && volumeInfo.dimensions && (
              <>
                <div className="pt-2 border-t border-gray-700/50">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Axial Slice:</span>
                    <span className="text-white font-mono">
                      {currentSlice.axial + 1} / {volumeInfo.dimensions[3] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Coronal Slice:</span>
                    <span className="text-white font-mono">
                      {currentSlice.coronal + 1} / {volumeInfo.dimensions[2] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Sagittal Slice:</span>
                    <span className="text-white font-mono">
                      {currentSlice.sagittal + 1} / {volumeInfo.dimensions[1] || 0}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div 
          className="absolute top-4 left-4 w-72 bg-gray-900/90 backdrop-blur-md rounded-xl p-4 z-20 border border-gray-700/50 shadow-2xl"
          style={{
            animation: 'slideInLeft 0.3s ease-out'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color Map</label>
              <select
                onChange={(e) => handleColorMapChange(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="gray"
              >
                <option value="gray">Grayscale</option>
                <option value="ct_bone">Bone CT</option>
                <option value="hot">Hot</option>
                <option value="cool">Cool</option>
                <option value="viridis">Viridis</option>
                <option value="plasma">Plasma</option>
                <option value="jet">Jet</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Opacity: {opacity.toFixed(2)}</label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Window Level</label>
                <span className="text-xs text-gray-400">Center/Width</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="-1000"
                  max="3000"
                  step="10"
                  defaultValue="500"
                  onChange={(e) => handleWindowLevelChange(parseInt(e.target.value), 2000)}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      {!loading && !error && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-700/50 shadow-lg"
          style={{
            animation: 'fadeInDown 0.3s ease-out'
          }}
        >
          <span className="text-white font-medium text-sm truncate max-w-xs">{fileName}</span>
          <div className="w-px h-4 bg-gray-600 mx-2" />
          <button
            onClick={() => setShowInfo(true)}
            className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
            title="Show volume info"
          >
            <Contrast size={16} />
          </button>
          <div className="w-px h-4 bg-gray-600 mx-2" />
          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-800/50 rounded">
            {viewMode === '2d' ? '2D Multiplanar' : '3D Render'}
          </span>
        </div>
      )}

      {/* Control Panel */}
      {showControls && !loading && !error && nvInstance && (
        <>
          {/* Left Controls */}
          <div 
            className="absolute left-4 bottom-4 flex flex-col gap-3 z-10"
            style={{
              animation: 'fadeInLeft 0.3s ease-out'
            }}
          >
            {/* View Mode Toggle */}
            <button
              onClick={toggleViewMode}
              className="p-3 bg-gradient-to-br from-indigo-800/80 to-indigo-900/80 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 group"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
              }}
              title={`Switch to ${viewMode === '2d' ? '3D' : '2D'} view`}
            >
              {viewMode === '2d' ? (
                <Box className="w-5 h-5" />
              ) : (
                <Grid3x3 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleResetView}
              className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 group"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
              title="Reset View"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            <button
              onClick={handleZoomIn}
              className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <button
              onClick={handleZoomOut}
              className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            {/* 2D Slice Navigation (only visible in 2D mode) */}
            {viewMode === '2d' && volumeInfo?.dimensions && (
              <>
                <div className="pt-4 border-t border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-2 text-center">Slice Navigation</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-16">Axial:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeSlice('axial', -1)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
                          ◀
                        </button>
                        <span className="text-xs text-white min-w-[40px] text-center">
                          {currentSlice.axial + 1}/{volumeInfo.dimensions[3] || 0}
                        </span>
                        <button
                          onClick={() => changeSlice('axial', 1)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-16">Coronal:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeSlice('coronal', -1)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
                          ◀
                        </button>
                        <span className="text-xs text-white min-w-[40px] text-center">
                          {currentSlice.coronal + 1}/{volumeInfo.dimensions[2] || 0}
                        </span>
                        <button
                          onClick={() => changeSlice('coronal', 1)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-16">Sagittal:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeSlice('sagittal', -1)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
                          ◀
                        </button>
                        <span className="text-xs text-white min-w-[40px] text-center">
                          {currentSlice.sagittal + 1}/{volumeInfo.dimensions[1] || 0}
                        </span>
                        <button
                          onClick={() => changeSlice('sagittal', 1)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Controls */}
          <div 
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-xl z-10"
            style={{
              animation: 'fadeInUp 0.3s ease-out'
            }}
          >
            <button
              onClick={handleToggleVolume}
              className={`p-2 rounded-lg transition-all duration-200 ${showVolume ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-700/50 text-gray-300'}`}
              title={showVolume ? "Hide Volume" : "Show Volume"}
            >
              {showVolume ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>

            <div className="w-32">
              <div className="text-xs text-gray-400 mb-1">Opacity</div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-cyan-400"
              />
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all duration-200 ${showSettings ? 'bg-purple-500/20 text-purple-300' : 'text-gray-300 hover:text-white'}`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-300 hover:text-white rounded-lg transition-colors hover:bg-gray-700/50"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Right Controls */}
          <div 
            className="absolute right-4 bottom-4 flex flex-col gap-3 z-10"
            style={{
              animation: 'fadeInRight 0.3s ease-out'
            }}
          >
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-gradient-to-br from-purple-800/80 to-purple-900/80 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
              title="Open Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={handleDownloadFile}
              className="p-3 bg-gradient-to-br from-green-800/80 to-green-900/80 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
              title="Download File"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Add CSS animations without jsx attribute */}
      <style>
        {`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInDown {
          from { transform: translate(-50%, -10px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translate(-50%, 10px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes fadeInLeft {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInRight {
          from { transform: translateX(10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        `}
      </style>
    </div>
  );
};

export default ThreeDCBCTViewer;