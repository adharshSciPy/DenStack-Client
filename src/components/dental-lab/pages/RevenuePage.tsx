// src/modules/dental-lab/pages/RevenuePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TrendingUp, Package, Loader, IndianRupee } from "lucide-react";
import StatCard from "../components/common/StatCard";
import { useAppSelector } from "../../../redux/hook";
import axios from "axios";
import labBaseUrl from "../../../labBaseUrl";

interface RevenueSummary {
  totalPrice: number;
  totalOrders: number;
  month?: number;
  year?: number;
}

interface ApiResponse {
  data: RevenueSummary;
  success: boolean;
  message?: string;
}

const RevenuePage: React.FC = () => {
  const labVendorId =useAppSelector((state) => state.auth.user?.labVendorId); // Renamed for clarity
  const today = new Date();
  const labType = useAppSelector((state) => state.auth.user?.labType);

  // Use localStorage keys as constants
  const STORAGE_KEYS = {
    MONTH: "revenueSelectedMonth",
    YEAR: "revenueSelectedYear"
  };

  // Get initial values from localStorage or use current date
  const getInitialMonth = (): number => {
    const savedMonth = localStorage.getItem(STORAGE_KEYS.MONTH);
    return savedMonth ? parseInt(savedMonth) : today.getMonth() + 1;
  };

  const getInitialYear = (): number => {
    const savedYear = localStorage.getItem(STORAGE_KEYS.YEAR);
    return savedYear ? parseInt(savedYear) : today.getFullYear();
  };

  const [selectedMonth, setSelectedMonth] = useState<number>(getInitialMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getInitialYear());
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Save to localStorage when month or year changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONTH, selectedMonth.toString());
    localStorage.setItem(STORAGE_KEYS.YEAR, selectedYear.toString());
  }, [selectedMonth, selectedYear]);

  // Generate list of years (memoized)
  const years: number[] = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [today]);

  const monthNames: string[] = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  // API call function
  const getClinicLabOrderPriceSummary = useCallback(async (
    vendorId: string,
    month: number,
    year: number,
  ) => {
    let endpoint = ``;
    if(labType==="inHouse"){
       endpoint = `api/v1/lab-orders/lab-monthly-revenue/${vendorId}?month=${month}&year=${year}`
    } else if(labType==="aligner"){
      endpoint = `api/v1/aligners/vendor/monthly-revenue/${vendorId}?month=${month}&year=${year}`;
    }
    const res = await axios.get(`${labBaseUrl}${endpoint}`);
    return res.data;
  }, []);

  // Fetch data when month or year changes
  useEffect(() => {
    if (!labVendorId) {
      setError("Lab vendor ID not found");
      return;
    }

    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getClinicLabOrderPriceSummary(
          labVendorId,
          selectedMonth,
          selectedYear,
        ) as ApiResponse;
        
        setSummary(response.data);
      } catch (err) {
        console.error("Failed to fetch revenue summary:", err);
        
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load revenue data");
        } else {
          setError("Failed to load revenue data");
        }
        
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [labVendorId, selectedMonth, selectedYear, getClinicLabOrderPriceSummary]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount?.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || "0"}`;
  };
console.log(summary);

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Monthly Revenue Analytics
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                In-house lab revenue tracking
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:border-gray-300"
              aria-label="Select month"
            >
              {monthNames.map((month, index) => (
                <option key={`month-${index}`} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:border-gray-300"
              aria-label="Select year"
            >
              {years.map((year) => (
                <option key={`year-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600 font-medium">
              Loading revenue data...
            </span>
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={IndianRupee}
              label="Total Revenue"
              value={formatCurrency(summary.totalPrice)}
              color="bg-gradient-to-br from-blue-600 to-indigo-600"
              gradient="bg-gradient-to-br from-green-100 to-emerald-100"
              subtext={`For ${monthNames[selectedMonth - 1]} ${selectedYear}`}
            />
            
            <StatCard
              icon={Package}
              label="Orders This Month"
              value={summary.totalOrders?.toString() || "0"}
              color="bg-gradient-to-br from-blue-600 to-indigo-600"
              gradient="bg-gradient-to-br from-blue-100 to-indigo-100"
              subtext="Total lab orders"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No revenue data available for {monthNames[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenuePage;