// src/modules/dental-lab/pages/RevenuePage.tsx
import React, { useState, useEffect } from "react";
import { TrendingUp, Package, Loader, IndianRupee } from "lucide-react";
import StatCard from "../components/common/StatCard";
import { useAppSelector } from "../../../redux/hook";
// import { getClinicLabOrderPriceSummary } from "../services/orderService";

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
  const clinicId = useAppSelector((state) => state.auth.clinicId);
  const today = new Date();
  
  // Get initial values from localStorage or use current date
  const getInitialMonth = (): number => {
    const savedMonth = localStorage.getItem('revenueSelectedMonth');
    return savedMonth ? parseInt(savedMonth) : today.getMonth() + 1;
  };

  const getInitialYear = (): number => {
    const savedYear = localStorage.getItem('revenueSelectedYear');
    return savedYear ? parseInt(savedYear) : today.getFullYear();
  };

  const [selectedMonth, setSelectedMonth] = useState<number>(getInitialMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getInitialYear());
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Save to localStorage when month or year changes
  useEffect(() => {
    localStorage.setItem('revenueSelectedMonth', selectedMonth.toString());
    localStorage.setItem('revenueSelectedYear', selectedYear.toString());
  }, [selectedMonth, selectedYear]);

  // Generate list of years
  const generateYears = (): number[] => {
    const years: number[] = [];
    const currentYear = today.getFullYear();
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  const monthNames: string[] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch data when month or year changes
  useEffect(() => {
    if (!clinicId) return;

    // const fetchData = async (): Promise<void> => {
    //   setIsLoading(true);
    //   setError(null);
    //   try {
    //     const response = await getClinicLabOrderPriceSummary(
    //       clinicId,
    //       selectedMonth,
    //       selectedYear,
    //     ) as ApiResponse;
    //     setSummary(response.data);
    //   } catch (err) {
    //     console.error("Failed to fetch revenue summary:", err);
    //     setError("Failed to load revenue data");
    //     setSummary(null);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // fetchData();
  }, [clinicId, selectedMonth, selectedYear]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedYear(parseInt(e.target.value));
  };

  const years: number[] = generateYears();

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
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${summary?.totalPrice?.toLocaleString() || "0"}`}
              color="bg-gradient-to-br from-blue-600 to-indigo-600"
              gradient="bg-gradient-to-br from-green-100 to-emerald-100"
              subtext="In-house labs only"
            />
            <StatCard
              icon={Package}
              label="Orders This Month"
              value={summary?.totalOrders?.toString() || "0"}
              color="bg-gradient-to-br from-blue-600 to-indigo-600"
              gradient="bg-gradient-to-br from-blue-100 to-indigo-100"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No revenue data available for this month
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenuePage;