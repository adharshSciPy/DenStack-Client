// src/components/ThreeDCBCTViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';
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
  PanelLeftClose,
  PanelRightClose
} from 'lucide-react';

interface ThreeDCBCTViewerProps {
  fileUrl: string | undefined;
  fileName?: string;
  className?: string;
  onError?: (msg: string) => void;
  onLoadComplete?: () => void;
  showControls?: boolean;
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
  const [volumeInfo, setVolumeInfo] = useState<any>(null);

  const getFullUrl = () => {
    return fileUrl?.startsWith('http') ? fileUrl : `http://localhost:8006${fileUrl}`;
  };

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
        
        // Create Niivue instance
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

        // Store volume info
        if (nv.volumes?.[0]) {
          setVolumeInfo({
            dimensions: nv.volumes[0].dims,
            voxelSize: nv.volumes[0].pixDims,
            minMax: [nv.volumes[0].cal_min, nv.volumes[0].cal_max]
          });
        }

        // Set initial view for CBCT
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

  // const handleResetView = () => {
  //   if (nvInstance) {
  //     nvInstance.setRenderAzimuth(0);
  //     nvInstance.setClipPlane([210, 25, 0]);
  //     nvInstance.drawScene();
  //   }
  // };

  // const handleZoomIn = () => {
  //   if (nvInstance) {
  //     nvInstance.scene.getActiveCamera().zoom *= 1.1;
  //     nvInstance.drawScene();
  //   }
  // };

  // const handleZoomOut = () => {
  //   if (nvInstance) {
  //     nvInstance.scene.getActiveCamera().zoom *= 0.9;
  //     nvInstance.drawScene();
  //   }
  // };

  const handleColorMapChange = (map: string) => {
    if (nvInstance?.volumes?.[0]) {
      nvInstance.volumes[0].colorMap = map;
      nvInstance.updateGLVolume();
    }
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    if (nvInstance?.volumes?.[0]) {
      nvInstance.volumes[0].opacity = value;
      nvInstance.updateGLVolume();
    }
  };

  const handleToggleVolume = () => {
    setShowVolume(!showVolume);
    if (nvInstance?.volumes?.[0]) {
      nvInstance.volumes[0].opacity = showVolume ? 0 : opacity;
      nvInstance.updateGLVolume();
    }
  };

  const handleWindowLevelChange = (center: number, width: number) => {
    if (nvInstance?.volumes?.[0]) {
      nvInstance.volumes[0].cal_min = center - width/2;
      nvInstance.volumes[0].cal_max = center + width/2;
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
          cursor: 'grab'
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
                {volumeInfo.dimensions?.[1]}×{volumeInfo.dimensions?.[2]}×{volumeInfo.dimensions?.[3]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Voxel Size:</span>
              <span className="text-white font-mono">
                {volumeInfo.voxelSize?.[1]?.toFixed(2)}×{volumeInfo.voxelSize?.[2]?.toFixed(2)}×{volumeInfo.voxelSize?.[3]?.toFixed(2)} mm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Data Range:</span>
              <span className="text-white font-mono">
                {volumeInfo.minMax?.[0]} to {volumeInfo.minMax?.[1]}
              </span>
            </div>
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
            {/* <button
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
            </button> */}
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
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                color:"white"
              }}
              title="Download File"
            >
              <Download className="w-5 h-5" />
              hiii
            </button>
          </div>
        </>
      )}

      
    </div>
  );
};

export default ThreeDCBCTViewer;