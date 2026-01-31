import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  Clock,
  X,
  Stethoscope,
  CheckSquare,
  Loader2,
  ArrowLeft,
  User,
  FileText,
  Grid,
  ChevronDown,
  Activity,
  Eye,
  Zap,
  TrendingUp,
  Award,
  Shield,
  Moon,
  Sun,
  Heart,
  Star,
  Sparkles,
  // Tooth
} from "lucide-react";
import { Button } from "../../ui/button";
import DentalLoader from './DentalLoader';
import { useImagePreloader } from "../../../hooks/useImagePreloader";

// Import ToothSVG from your existing DentalChart component
interface ToothSVGProps {
  type: string;
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
}

const ToothSVG: React.FC<ToothSVGProps> = ({
  type,
  color = "#6b7280",
  width = 60,
  height = 60,
  rotation = 0,
  opacity = 1,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const TOOTH_SVGS: Record<string, string> = {
    incisor: "/assets/svg/dental/incisor.svg",
    canine: "/assets/svg/dental/canine.svg",
    premolar: "/assets/svg/dental/premolar.svg",
    molar: "/assets/svg/dental/molar.svg",
    wisdom: "/assets/svg/dental/wisdom.svg",
  };

  const getHueFromColor = (hexColor: string): number => {
    const colorMap: Record<string, number> = {
      '#dc2626': 0,    // red-600 (caries)
      '#2563eb': 220,  // blue-600 (filling)
      '#d97706': 40,   // amber-600 (crown)
      '#7c3aed': 270,  // violet-600 (root canal)
      '#6b7280': 0,    // gray-500 (missing)
      '#059669': 140,  // emerald-600 (healthy)
      '#4f46e5': 250,  // indigo-600 (hovered/clicked)
      '#d1d5db': 0,    // light gray for no data
    };
    
    return colorMap[hexColor.toLowerCase()] || 0;
  };

  const svgUrl = TOOTH_SVGS[type.toLowerCase()] || TOOTH_SVGS.molar;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
        position: 'relative',
        opacity: isLoaded ? opacity : 0,
        transition: 'opacity 0.3s ease, transform 0.2s ease',
      }}
    >
      {svgUrl && !hasError ? (
        <img
          src={svgUrl}
          alt={`${type} tooth`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: color === '#6b7280' || color === '#d1d5db' ? 'none' : 
              `drop-shadow(0 0 3px ${color}40) brightness(0.95) sepia(0.2) hue-rotate(${getHueFromColor(color)}deg) saturate(1.5)`,
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <svg
          width={width}
          height={height}
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
        </svg>
      )}
    </div>
  );
};

// Tooth Data Arrays (keep same as before)
const ADULT_TOOTH_DATA = [
  // Upper Right (Quadrant 1) - FDI numbers 18-11
  { number: 18, name: "Third Molar", quadrant: 1, svgName: "wisdom", rotation: 180 },
  { number: 17, name: "Second Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 16, name: "First Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 15, name: "Second Premolar", quadrant: 1, svgName: "premolar", rotation: 180 },
  { number: 14, name: "First Premolar", quadrant: 1, svgName: "premolar", rotation: 180 },
  { number: 13, name: "Canine", quadrant: 1, svgName: "canine", rotation: 180 },
  { number: 12, name: "Lateral Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },
  { number: 11, name: "Central Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },

  // Upper Left (Quadrant 2) - FDI numbers 21-28
  { number: 21, name: "Central Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 22, name: "Lateral Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 23, name: "Canine", quadrant: 2, svgName: "canine", rotation: 180 },
  { number: 24, name: "First Premolar", quadrant: 2, svgName: "premolar", rotation: 180 },
  { number: 25, name: "Second Premolar", quadrant: 2, svgName: "premolar", rotation: 180 },
  { number: 26, name: "First Molar", quadrant: 2, svgName: "molar", rotation: 180 },
  { number: 27, name: "Second Molar", quadrant: 2, svgName: "molar", rotation: 180 },
  { number: 28, name: "Third Molar", quadrant: 2, svgName: "wisdom", rotation: 180 },

  // Lower Left (Quadrant 3) - FDI numbers 31-38
  { number: 31, name: "Central Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 32, name: "Lateral Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 33, name: "Canine", quadrant: 3, svgName: "canine", rotation: 0 },
  { number: 34, name: "First Premolar", quadrant: 3, svgName: "premolar", rotation: 0 },
  { number: 35, name: "Second Premolar", quadrant: 3, svgName: "premolar", rotation: 0 },
  { number: 36, name: "First Molar", quadrant: 3, svgName: "molar", rotation: 0 },
  { number: 37, name: "Second Molar", quadrant: 3, svgName: "molar", rotation: 0 },
  { number: 38, name: "Third Molar", quadrant: 3, svgName: "wisdom", rotation: 0 },

  // Lower Right (Quadrant 4) - FDI numbers 41-48
  { number: 41, name: "Central Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 42, name: "Lateral Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 43, name: "Canine", quadrant: 4, svgName: "canine", rotation: 0 },
  { number: 44, name: "First Premolar", quadrant: 4, svgName: "premolar", rotation: 0 },
  { number: 45, name: "Second Premolar", quadrant: 4, svgName: "premolar", rotation: 0 },
  { number: 46, name: "First Molar", quadrant: 4, svgName: "molar", rotation: 0 },
  { number: 47, name: "Second Molar", quadrant: 4, svgName: "molar", rotation: 0 },
  { number: 48, name: "Third Molar", quadrant: 4, svgName: "wisdom", rotation: 0 },
];

const PEDIATRIC_TOOTH_DATA = [
  // Upper Right (Quadrant 1) - Primary teeth 55-51
  { number: 55, name: "Primary Second Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 54, name: "Primary First Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 53, name: "Primary Canine", quadrant: 1, svgName: "canine", rotation: 180 },
  { number: 52, name: "Primary Lateral Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },
  { number: 51, name: "Primary Central Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },

  // Upper Left (Quadrant 2) - Primary teeth 61-65
  { number: 61, name: "Primary Central Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 62, name: "Primary Lateral Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 63, name: "Primary Canine", quadrant: 2, svgName: "canine", rotation: 180 },
  { number: 64, name: "Primary First Molar", quadrant: 2, svgName: "molar", rotation: 180 },
  { number: 65, name: "Primary Second Molar", quadrant: 2, svgName: "molar", rotation: 180 },

  // Lower Right (Quadrant 4) - Primary teeth 81-85
  { number: 81, name: "Primary Central Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 82, name: "Primary Lateral Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 83, name: "Primary Canine", quadrant: 4, svgName: "canine", rotation: 0 },
  { number: 84, name: "Primary First Molar", quadrant: 4, svgName: "molar", rotation: 0 },
  { number: 85, name: "Primary Second Molar", quadrant: 4, svgName: "molar", rotation: 0 },

  // Lower Left (Quadrant 3) - Primary teeth 71-75
  { number: 71, name: "Primary Central Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 72, name: "Primary Lateral Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 73, name: "Primary Canine", quadrant: 3, svgName: "canine", rotation: 0 },
  { number: 74, name: "Primary First Molar", quadrant: 3, svgName: "molar", rotation: 0 },
  { number: 75, name: "Primary Second Molar", quadrant: 3, svgName: "molar", rotation: 0 },
];

interface DentalChartViewProps {
  patientId: string;
  onClose?: () => void;
  patientName?: string;
  patientUniqueId?: string;
}

const DentalChartView: React.FC<DentalChartViewProps> = ({
  patientId,
  onClose,
  patientName,
  patientUniqueId,
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [clickedTooth, setClickedTooth] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"teeth" | "summary" | "history">("teeth");
  
  // Preload all SVG images
  const allSvgUrls = React.useMemo(() => {
    return [
      '/assets/svg/dental/incisor.svg',
      '/assets/svg/dental/canine.svg',
      '/assets/svg/dental/premolar.svg',
      '/assets/svg/dental/molar.svg',
      '/assets/svg/dental/wisdom.svg',
    ];
  }, []);
  
  const { isLoading: imagesLoading } = useImagePreloader(allSvgUrls);

  // Fetch dental chart data
  useEffect(() => {
    const fetchDentalChart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8002/api/v1/patient-service/patient/dental-chart/${patientId}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dental chart: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch dental chart data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching dental chart');
        console.error('Error fetching dental chart:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchDentalChart();
    }
  }, [patientId]);

  // Get the appropriate tooth data based on age group
  const toothData = React.useMemo(() => {
    if (!data) return ADULT_TOOTH_DATA;
    return data.patient?.ageGroup === 'pediatric' ? PEDIATRIC_TOOTH_DATA : ADULT_TOOTH_DATA;
  }, [data]);

  // Create a map of tooth data for quick lookup
  const toothDataMap = React.useMemo(() => {
    if (!data?.dentalChart) return {};
    
    const map: Record<number, any> = {};
    data.dentalChart.forEach((tooth: any) => {
      map[tooth.toothNumber] = tooth;
    });
    return map;
  }, [data]);

  // Get tooth by number from the tooth data array
  const getToothByNumber = useCallback((toothNumber: number) => {
    return toothData.find(t => t.number === toothNumber);
  }, [toothData]);

  // Get tooth color based on conditions and procedures
  const getToothColor = useCallback((toothNumber: number): string => {
    const toothChartData = toothDataMap[toothNumber];
    
    // If no data for this tooth, return dimmed color
    if (!toothChartData) return "#d1d5db";

    const conditions = toothChartData.conditions || [];
    const procedures = toothChartData.procedures || [];

    // Priority-based coloring
    if (conditions.includes("Missing")) return "#6b7280";
    if (conditions.includes("Caries")) return "#dc2626";
    if (conditions.includes("Filling")) return "#2563eb";
    if (conditions.includes("Crown")) return "#d97706";
    if (conditions.includes("Root Canal")) return "#7c3aed";
    if (conditions.includes("Hypoplastic")) return "#9333ea";
    if (conditions.includes("Discolored")) return "#475569";
    if (conditions.includes("Healthy")) return "#059669";
    
    // Check procedures
    if (procedures.some((p: any) => p.name === "Filling" || p.name === "filling")) return "#2563eb";
    if (procedures.some((p: any) => p.name === "Crown" || p.name === "crown")) return "#d97706";
    if (procedures.some((p: any) => p.name.includes("Root Canal"))) return "#7c3aed";
    
    // If tooth has any data but no specific condition/procedure, use default
    return "#4f46e5";
  }, [toothDataMap]);

  // Handle tooth hover (for Teeth View tab)
  const handleToothHover = useCallback((toothNumber: number, event: React.MouseEvent) => {
    if (activeTab === "teeth") {
      const toothChartData = toothDataMap[toothNumber];
      
      if (toothChartData) {
        setHoveredTooth(toothNumber);
        setTooltipPosition({ x: event.clientX, y: event.clientY });
        setTooltipData(toothChartData);
        setShowTooltip(true);
      }
    }
  }, [toothDataMap, activeTab]);

  // Handle tooth click (for Summary tab)
  const handleToothClick = useCallback((toothNumber: number, event: React.MouseEvent) => {
    const toothChartData = toothDataMap[toothNumber];
    
    if (toothChartData) {
      // Toggle clicked tooth
      if (clickedTooth === toothNumber) {
        setClickedTooth(null);
        setShowTooltip(false);
      } else {
        setClickedTooth(toothNumber);
        setTooltipPosition({ x: event.clientX, y: event.clientY });
        setTooltipData(toothChartData);
        setShowTooltip(true);
      }
    }
  }, [toothDataMap, clickedTooth]);

  // Handle mouse leave from tooth (for Teeth View tab)
  const handleToothLeave = useCallback(() => {
    if (activeTab === "teeth") {
      // Add a small delay to prevent tooltip flickering
      setTimeout(() => {
        if (showTooltip && !clickedTooth) {
          setShowTooltip(false);
          setHoveredTooth(null);
          setTooltipData(null);
        }
      }, 100);
    }
  }, [showTooltip, clickedTooth, activeTab]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside tooltip and not on a tooth
      if (showTooltip && 
          !target.closest('.tooth-element') && 
          !target.closest('.tooltip-element')) {
        setShowTooltip(false);
        setClickedTooth(null);
        setHoveredTooth(null);
        setTooltipData(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);

  // Add useEffect to close tooltip when mouse leaves tooltip itself
  useEffect(() => {
    const tooltipElement = document.querySelector('.tooltip-element');
    if (tooltipElement) {
      const handleTooltipLeave = () => {
        if (activeTab === "teeth" && !clickedTooth) {
          setShowTooltip(false);
          setHoveredTooth(null);
          setTooltipData(null);
        }
      };
      
      tooltipElement.addEventListener('mouseleave', handleTooltipLeave);
      return () => {
        tooltipElement.removeEventListener('mouseleave', handleTooltipLeave);
      };
    }
  }, [activeTab, clickedTooth]);

  // Statistics from API response
  const stats = useMemo(() => {
    if (!data?.summary) {
      return {
        totalTeeth: 0,
        teethWithConditions: 0,
        teethWithProcedures: 0,
        totalProcedures: 0,
        plannedProcedures: 0,
        completedProcedures: 0,
        uniqueConditions: [],
        uniqueProcedureTypes: []
      };
    }
    return data.summary;
  }, [data]);

  // Get tooth size based on screen width - MATCHES DentalChart.tsx
  const getToothSize = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 42; 
      if (width < 768) return 46; 
      if (width < 1024) return 50; 
      if (width < 1280) return 54; 
      return 58; 
    }
    return 52;
  }, []);

  // Get teeth for each quadrant
  const upperRightTeeth = useMemo(() => toothData.filter(t => t.quadrant === 1), [toothData]);
  const upperLeftTeeth = useMemo(() => toothData.filter(t => t.quadrant === 2), [toothData]);
  const lowerLeftTeeth = useMemo(() => toothData.filter(t => t.quadrant === 3), [toothData]);
  const lowerRightTeeth = useMemo(() => toothData.filter(t => t.quadrant === 4), [toothData]);

  // Calculate oral health score
  const calculateOralHealthScore = useMemo(() => {
    if (!data?.dentalChart) return 0;
    
    const totalTeeth = toothData.length;
    const teethWithIssues = data.dentalChart.filter((tooth: any) => 
      tooth.conditions && tooth.conditions.length > 0
    ).length;
    
    const healthPercentage = ((totalTeeth - teethWithIssues) / totalTeeth) * 100;
    return Math.round(healthPercentage);
  }, [data, toothData]);

  // Show loader while images are loading OR data is loading
  if (imagesLoading || loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-[100] flex items-center justify-center">
        <div className="relative">
          <DentalLoader />
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Loading Dental History</h3>
            <p className="text-sm text-gray-500 mt-2">Fetching patient's dental records...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render a single tooth
  const renderTooth = (tooth: any, index: number) => {
    const toothChartData = toothDataMap[tooth.number];
    const hasData = !!toothChartData;
    const isHovered = hoveredTooth === tooth.number;
    const isClicked = clickedTooth === tooth.number;
    const color = getToothColor(tooth.number);
    const isHealthy = !toothChartData?.conditions?.some((cond: string) => 
      ['Caries', 'Missing', 'Root Canal'].includes(cond)
    );
    
    return (
      <div
        key={`${tooth.quadrant}-${tooth.number}-${index}`}
        className="relative group flex flex-col items-center"
      >
        <button
          type="button"
          onClick={(e) => activeTab === "summary" && handleToothClick(tooth.number, e)}
          className={`relative transition-all hover:scale-105 active:scale-95 tooth-element ${
            hasData ? 'cursor-pointer' : 'cursor-default'
          }`}
          onMouseEnter={(e) => activeTab === "teeth" && handleToothHover(tooth.number, e)}
          onMouseLeave={activeTab === "teeth" ? handleToothLeave : undefined}
        >
          <div className="p-1 sm:p-1.5">
            <ToothSVG
              type={tooth.svgName}
              color={isClicked ? "#4f46e5" : (isHovered ? "#4f46e5" : color)}
              width={getToothSize()}
              height={getToothSize()}
              rotation={tooth.rotation}
              opacity={hasData ? 1 : 0.4}
            />
          </div>
        </button>
        
        {/* Tooth number below the tooth */}
        <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold ${
          hasData 
            ? isClicked || isHovered
              ? 'text-indigo-600' 
              : isHealthy
                ? 'text-emerald-600'
                : 'text-gray-700'
            : 'text-gray-400'
        }`}>
          {tooth.number}
        </div>
      </div>
    );
  };

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-[100] flex flex-col">
        <div className="bg-white/90 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Consultation
              </Button>
            )}
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Dental History
            </h1>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50"></div>
              <AlertCircle className="h-20 w-20 text-red-500 mx-auto relative" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Unable to Load Dental History</h3>
            <p className="text-gray-600 mb-6 px-4">{error}</p>
            <div className="flex gap-3 justify-center">
              {onClose && (
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Button>
              )}
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Retry Loading
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 z-[100] flex flex-col overflow-hidden">
      {/* Enhanced Header with better design */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-emerald-50 border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-2 hover:bg-white/50 border border-gray-200 bg-white/80"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 blur-xl opacity-20 rounded-full"></div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Dental History
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5 bg-white/90 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                    <User className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[100px] sm:max-w-none">
                      {patientName || data?.patient?.name || "Patient"}
                    </span>
                  </div>
                  {data?.patient && (
                    <>
                      <Badge variant="outline" className="text-xs bg-white/90 border-gray-200">
                        {data.patient.age}y
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white/90 border-gray-200">
                        {data.patient.ageGroup === 'pediatric' ? '👶 Pediatric' : '👨‍🦳 Adult'}
                      </Badge>
                      <div className="flex items-center gap-1.5 bg-white/90 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                        <FileText className="h-3 w-3 text-gray-600" />
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[80px] sm:max-w-none">
                          {patientUniqueId || data.patient.patientUniqueId}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Enhanced Oral Health Score Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
                  <Heart className="h-4 w-4 text-white" fill="white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[8px] font-bold text-white">{calculateOralHealthScore}</span>
                </div>
              </div>
              <div className="text-xs">
                <div className="font-semibold text-emerald-700">Health Score</div>
                <div className="text-emerald-600">{calculateOralHealthScore}%</div>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-white/90 text-blue-700 border-blue-200 text-xs shadow-sm">
              <Eye className="h-3 w-3 mr-1" />
              View Only
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 flex items-center justify-center hover:bg-white/50 border border-gray-200 bg-white/80"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation - Enhanced */}
      <div className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="px-4 sm:px-6 py-2">
          <div className="flex overflow-x-auto scrollbar-hide gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("teeth");
                setClickedTooth(null);
                setShowTooltip(false);
              }}
              className={`
                px-4 sm:px-5 py-2.5 text-sm font-medium flex items-center gap-2 whitespace-nowrap
                transition-all duration-300 relative group
                ${activeTab === "teeth"
                  ? "bg-white text-primary rounded-xl shadow-lg shadow-primary/10 border border-primary/20"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg"
                }
              `}
            >
              <div className="relative">
                <Grid className="h-4 w-4" />
                {activeTab === "teeth" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}
              </div>
              Teeth Chart
              {activeTab === "teeth" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"></div>
              )}
              <span className="text-xs opacity-60 group-hover:opacity-100">
                (Hover)
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("summary");
                setClickedTooth(null);
                setShowTooltip(false);
              }}
              className={`
                px-4 sm:px-5 py-2.5 text-sm font-medium flex items-center gap-2 whitespace-nowrap
                transition-all duration-300 relative group
                ${activeTab === "summary"
                  ? "bg-white text-primary rounded-xl shadow-lg shadow-primary/10 border border-primary/20"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg"
                }
              `}
            >
              <div className="relative">
                <CheckSquare className="h-4 w-4" />
                {activeTab === "summary" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}
              </div>
              Summary
              {activeTab === "summary" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"></div>
              )}
              <span className="text-xs opacity-60 group-hover:opacity-100">
                (Click)
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("history");
                setClickedTooth(null);
                setShowTooltip(false);
              }}
              className={`
                px-4 sm:px-5 py-2.5 text-sm font-medium flex items-center gap-2 whitespace-nowrap
                transition-all duration-300 relative
                ${activeTab === "history"
                  ? "bg-white text-primary rounded-xl shadow-lg shadow-primary/10 border border-primary/20"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg"
                }
              `}
            >
              <Activity className="h-4 w-4" />
              History
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-5 md:p-6">
        {activeTab === "teeth" ? (
          <div className="max-w-6xl mx-auto">
            {/* Statistics Cards */}
            {data?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-blue-600 mb-1">Teeth with Data</div>
                      <div className="text-2xl font-bold text-blue-700">{stats.totalTeeth}</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-xs text-blue-500">Out of {toothData.length} teeth</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-green-600 mb-1">Total Procedures</div>
                      <div className="text-2xl font-bold text-green-700">{stats.totalProcedures}</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="text-xs text-green-500">{stats.completedProcedures} completed</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-amber-600 mb-1">Planned</div>
                      <div className="text-2xl font-bold text-amber-700">{stats.plannedProcedures}</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <div className="text-xs text-amber-500">Awaiting treatment</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-purple-600 mb-1">Oral Health</div>
                      <div className="text-2xl font-bold text-purple-700">{calculateOralHealthScore}%</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-purple-600" fill="currentColor" />
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <div className="text-xs text-purple-500">Overall score</div>
                  </div>
                </div>
              </div>
            )}

            {/* Dental Chart Container */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-emerald-50/30 rounded-2xl -m-4"></div>
              
              <div className="relative border border-gray-300/50 rounded-2xl bg-white/80 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg">
                {/* Vertical midline */}
                <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2">
                  <div className="w-px h-full bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                </div>

                {/* Upper Arch */}
                <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-6 sm:mb-8 md:mb-10">
                  {/* Quadrant 1 - Upper Right */}
                  {upperRightTeeth.map((tooth, index) => renderTooth(tooth, index))}

                  {/* Quadrant 2 - Upper Left */}
                  {upperLeftTeeth.map((tooth, index) => renderTooth(tooth, index))}
                </div>

                {/* Lower Arch */}
                <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-2.5 mt-6 sm:mt-8 md:mt-10">
                  {/* Quadrant 4 - Lower Right */}
                  {lowerRightTeeth.map((tooth, index) => renderTooth(tooth, index))}

                  {/* Quadrant 3 - Lower Left */}
                  {lowerLeftTeeth.map((tooth, index) => renderTooth(tooth, index))}
                </div>

                {/* Quadrant Labels */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs border border-blue-200 shadow-sm">
                    Q1 (Upper Right)
                  </Badge>
                </div>
                
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 text-xs border border-green-200 shadow-sm">
                    Q2 (Upper Left)
                  </Badge>
                </div>
                
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-700 text-xs border border-amber-200 shadow-sm">
                    Q3 (Lower Left)
                  </Badge>
                </div>
                
                <div className="absolute bottom-2 right-2">
                  <Badge className="bg-gradient-to-r from-purple-50 to-violet-100 text-purple-700 text-xs border border-purple-200 shadow-sm">
                    Q4 (Lower Right)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Condition Legend
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Caries</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-gray-700">Filling</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-medium text-gray-700">Crown</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-medium text-gray-700">Root Canal</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                  <span className="text-xs font-medium text-gray-700">Missing</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-medium text-gray-700">Healthy</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-400"></div>
                  <span className="text-xs font-medium text-gray-700">No Data</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700">
                    {activeTab === "teeth" ? "Hovered" : "Clicked"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "summary" ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Conditions & Health Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Conditions Summary */}
                <Card className="overflow-hidden border border-gray-300/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-400 to-red-600"></div>
                  <CardHeader className="py-4 pl-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Dental Conditions Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4 pl-6">
                    {stats.uniqueConditions && stats.uniqueConditions.length > 0 ? (
                      <div className="space-y-4">
                        {stats.uniqueConditions.map((condition: string, idx: number) => {
                          const affectedTeeth = toothData.filter(t => 
                            toothDataMap[t.number]?.conditions?.includes(condition)
                          ).length;
                          const percentage = Math.round((affectedTeeth / toothData.length) * 100);
                          
                          return (
                            <div key={idx} className="group hover:bg-gray-50 p-3 rounded-lg transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    condition === 'Caries' ? 'bg-red-500' :
                                    condition === 'Missing' ? 'bg-gray-500' :
                                    condition === 'Healthy' ? 'bg-emerald-500' :
                                    'bg-blue-500'
                                  }`}></div>
                                  <span className="font-medium text-sm">{condition}</span>
                                </div>
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {affectedTeeth} teeth
                                </Badge>
                              </div>
                              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`absolute left-0 top-0 h-full rounded-full ${
                                    condition === 'Caries' ? 'bg-red-500' :
                                    condition === 'Missing' ? 'bg-gray-500' :
                                    condition === 'Healthy' ? 'bg-emerald-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 text-right">
                                {percentage}% of total teeth
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No dental conditions recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Teeth with History - CLICKABLE */}
                {data?.dentalChart && data.dentalChart.length > 0 && (
                  <Card className="overflow-hidden border border-gray-300/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                    <CardHeader className="py-4 pl-6">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Teeth with Dental History (Click to view details)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4 pl-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.dentalChart.map((tooth: any) => {
                          const toothInfo = getToothByNumber(tooth.toothNumber);
                          const severity = tooth.conditions.length + tooth.procedures.length;
                          const isClicked = clickedTooth === tooth.toothNumber;
                          
                          return (
                            <button
                              key={tooth.toothNumber}
                              type="button"
                              onClick={(e) => handleToothClick(tooth.toothNumber, e)}
                              className={`group border rounded-xl p-4 text-left transition-all hover:border-blue-300 hover:shadow-sm ${
                                isClicked 
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 ring-2 ring-blue-200' 
                                  : 'hover:bg-blue-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className={`w-10 h-10 border rounded-lg flex items-center justify-center ${
                                      isClicked ? 'bg-blue-100 border-blue-300' : 'bg-white'
                                    }`}>
                                      <span className={`font-bold ${
                                        isClicked ? 'text-blue-700' : 'text-gray-700'
                                      }`}>{tooth.toothNumber}</span>
                                    </div>
                                    {severity > 2 && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold text-white">{severity}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{toothInfo?.name || 'Tooth'}</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {tooth.conditions.slice(0, 2).map((cond: string, idx: number) => (
                                        <span 
                                          key={idx} 
                                          className={`px-2 py-0.5 rounded-full text-xs ${
                                            cond === 'Caries' ? 'bg-red-100 text-red-700' :
                                            cond === 'Missing' ? 'bg-gray-100 text-gray-700' :
                                            cond === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'
                                          }`}
                                        >
                                          {cond}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-medium text-gray-900">
                                    {tooth.procedures.length} procedures
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(tooth.lastUpdated).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Health Stats & Procedures */}
              <div className="space-y-6">
                {/* Oral Health Stats */}
                <Card className="overflow-hidden border border-gray-300/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
                  <CardHeader className="py-4 pl-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Oral Health Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4 pl-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Heart className="h-4 w-4 text-emerald-600" fill="currentColor" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-emerald-700">Health Score</div>
                            <div className="text-lg font-bold text-emerald-900">{calculateOralHealthScore}%</div>
                          </div>
                        </div>
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#E5E7EB"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#10B981"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${calculateOralHealthScore}, 100`}
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-blue-700">Healthy Teeth</div>
                          <div className="text-lg font-bold text-blue-900">
                            {toothData.length - (data?.dentalChart?.filter((t: any) => 
                              t.conditions && t.conditions.length > 0
                            ).length || 0)}
                          </div>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-amber-700">Avg. Procedures</div>
                          <div className="text-lg font-bold text-amber-900">
                            {(stats.totalProcedures / (stats.totalTeeth || 1)).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Procedures Summary */}
                <Card className="overflow-hidden border border-gray-300/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 to-purple-600"></div>
                  <CardHeader className="py-4 pl-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-purple-500" />
                      Procedures Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4 pl-6">
                    {stats.uniqueProcedureTypes && stats.uniqueProcedureTypes.length > 0 ? (
                      <div className="space-y-3">
                        {stats.uniqueProcedureTypes.map((procedure: string, idx: number) => {
                          const count = data.dentalChart.reduce((total: number, tooth: any) => 
                            total + (tooth.procedures?.filter((p: any) => 
                              p.name === procedure
                            ).length || 0), 0);
                          
                          return (
                            <div key={idx} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{procedure}</div>
                                  <div className="text-xs text-gray-500">{count} procedures</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {Math.round((count / stats.totalProcedures) * 100)}%
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                          <Stethoscope className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No procedures recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Treatment Timeline */}
            <Card className="overflow-hidden border border-gray-300/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
              <CardHeader className="py-4 pl-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-500" />
                  Treatment History Timeline
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Chronological record of all dental procedures
                </p>
              </CardHeader>
              <CardContent className="py-4 pl-6">
                {data?.dentalChart && data.dentalChart.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-200"></div>
                    
                    <div className="space-y-6">
                      {data.dentalChart
                        .flatMap((tooth: any) => 
                          (tooth.procedures || []).map((proc: any) => ({
                            ...proc,
                            toothNumber: tooth.toothNumber
                          }))
                        )
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((procedure: any, idx: number) => {
                          const isCompleted = procedure.status === 'completed';
                          const toothInfo = getToothByNumber(procedure.toothNumber);
                          
                          return (
                            <div key={idx} className="relative pl-10 group">
                              {/* Timeline dot */}
                              <div className={`
                                absolute left-4 top-1/2 transform -translate-y-1/2 -translate-x-1/2
                                w-4 h-4 rounded-full border-4 border-white shadow-lg
                                ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}
                              `}></div>
                              
                              <div className={`
                                border rounded-xl p-4 transition-all duration-300
                                ${isCompleted 
                                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                                  : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                                }
                                group-hover:shadow-md
                              `}>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center
                                        ${isCompleted 
                                          ? 'bg-emerald-500/10 text-emerald-700' 
                                          : 'bg-amber-500/10 text-amber-700'
                                        }
                                      `}>
                                        <Activity className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-sm sm:text-base">
                                          Tooth #{procedure.toothNumber}: {procedure.name}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {toothInfo?.name || 'Tooth'} • {procedure.surface} surface
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {procedure.notes && (
                                      <p className="text-sm text-gray-600 mt-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                                        {procedure.notes}
                                      </p>
                                    )}
                                    
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                      <Badge variant={isCompleted ? "default" : "outline"} className="text-xs">
                                        {isCompleted ? (
                                          <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Completed
                                          </>
                                        ) : 'Planned'}
                                      </Badge>
                                      {procedure.cost && (
                                        <Badge variant="secondary" className="text-xs">
                                          ₹{procedure.cost}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-right min-w-[120px]">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {new Date(procedure.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(procedure.date).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div className="mt-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          procedure.status === 'completed' 
                                            ? 'border-emerald-200 text-emerald-700' 
                                            : 'border-amber-200 text-amber-700'
                                        }`}
                                      >
                                        {procedure.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Activity className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Treatment History</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      No dental procedures have been recorded for this patient yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Tooltip */}
      {showTooltip && tooltipData && (
        <div
          className="fixed z-[1000] bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-xl shadow-2xl max-w-sm backdrop-blur-sm tooltip-element"
          style={{
            left: `${Math.min(tooltipPosition.x + 10, window.innerWidth - 320)}px`,
            top: `${Math.min(tooltipPosition.y + 10, window.innerHeight - 300)}px`,
          }}
          onMouseEnter={() => activeTab === "teeth" && setShowTooltip(true)}
          onMouseLeave={activeTab === "teeth" ? handleToothLeave : undefined}
        >
          <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 transform rotate-45"></div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">Tooth #{tooltipData.toothNumber}</div>
                <div className="text-xs text-gray-300">{getToothByNumber(tooltipData.toothNumber)?.name}</div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
              {activeTab === "teeth" ? "Hovering" : "Selected"}
            </Badge>
          </div>
          
          {tooltipData.conditions && tooltipData.conditions.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Conditions
              </div>
              <div className="flex flex-wrap gap-1">
                {tooltipData.conditions.map((cond: string, idx: number) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 bg-gray-700/50 rounded-lg text-xs border border-gray-600"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {tooltipData.procedures && tooltipData.procedures.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Procedures ({tooltipData.procedures.length})
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                {tooltipData.procedures.map((proc: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        proc.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></div>
                      <span>{proc.name}</span>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(proc.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-700">
            {activeTab === "teeth" 
              ? "Hover over any tooth to see details" 
              : "Click tooth again or outside to close"}
          </div>
        </div>
      )}

      {/* Enhanced Footer */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{data?.dentalChart?.length || 0}</span> teeth with history
            {stats.totalProcedures > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium text-gray-700">{stats.totalProcedures}</span> total procedures
              </>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-gray-500">Last updated:</span>
            <span className="font-medium text-gray-700">
              {data?.dentalChart?.length 
                ? new Date(data.dentalChart[0].lastUpdated).toLocaleDateString()
                : 'Never'
              }
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-gray-300 hover:bg-gray-50 bg-white/90"
          >
            <FileText className="h-3 w-3 mr-1" />
            Print Report
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-gray-300 hover:bg-gray-50 bg-white/90"
          >
            <Activity className="h-3 w-3 mr-1" />
            Export PDF
          </Button>
          {onClose && (
            <Button 
              onClick={onClose} 
              size="sm" 
              className="text-xs bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white"
            >
              Close View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentalChartView;