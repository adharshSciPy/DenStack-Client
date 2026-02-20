import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Briefcase,
  ShoppingCart,
  FileText,
  Calendar,
  User,
  Tag,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { Button } from "../../ui/button";
import { useAppSelector } from "../../../redux/hook";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import baseUrl from "../../../baseUrl";
import billingBaseUrl from "../../../billingServiceBaseUrl";

// Role options from salary schema
const roleOptions = [
  "nurse",
  "receptionist",
  "pharmacist",
  "accountant",
  "technician",
  "doctor",
];

// Category options for expense schema
const categoryOptions = [
  "Equipment",
  "Supplies",
  "Utilities",
  "Maintenance",
  "Marketing",
  "Rent",
  "Insurance",
  "Other",
];

interface Permission {
  appointments?: any;
}

interface Staff {
  _id: string;
  clinicId: string;
  createdAt: string;
  email: string;
  employeeId: string;
  name: string;
  password: string;
  permissions: Permission;
  phoneNumber: string;
  role: string;
  shifts: any[];
  updatedAt: string;
  __v: number;
}

interface StaffWithRole extends Staff {
  role: string;
}

interface StaffDataResponse {
  staff: {
    accountants: Staff[];
    nurses: Staff[];
    pharmacists: Staff[];
    receptionists: Staff[];
    technicians: Staff[];
  }
}

// Dashboard API Response interfaces
interface DashboardSummary {
  totalIncome: {
    amount: number;
    breakdown: {
      billingIncome: number;
      appointmentIncome: number;
    };
  };
  outstandingDues: {
    amount: number;
    breakdown: {
      billingOutstanding: number;
      appointmentDue: number;
    };
  };
  totalExpenses: {
    amount: number;
    breakdown: {
      salaryExpenses: number;
      otherExpenses: number;
      inventoryExpenses: number;
    };
  };
  netProfit: number;
  profitMargin: string;
  pettyCash: number;
}

interface DashboardCharts {
  revenueTrend: Record<string, number>;
  expenseBreakdown: {
    staffSalaries: number;
    medicines: number;
    equipment: number;
    consumables: number;
    others: number;
  };
}

interface DashboardResponse {
  success: boolean;
  message: string;
  view: string;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month?: number;
  };
  summary: DashboardSummary;
  billingSummary: {
    totalBills: number;
    paidBills: number;
    pendingBills: number;
    partialBills: number;
    cancelledBills: number;
    paymentRate: string;
  };
  charts: DashboardCharts;
}

// Add Salary interface
interface Salary {
  staffId: string;
  role: string;
  salaryAmount: number;
  month: string;
  note: string;
  id: number;
  clinicId?: string;
  _id?: string;
}

// Add Expense interface
interface Expense {
  _id?: string;
  amount: number;
  category: string;
  productName: string;
  paymentDate: string;
  note: string;
  id: number;
  clinicId?: string;
}

export function FinancialDashboard() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "amounts">(
    "dashboard",
  );
  const { clinicId } = useParams();
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [staffData, setStaffData] = useState<StaffDataResponse>({
    staff: {
      accountants: [],
      nurses: [],
      pharmacists: [],
      receptionists: [],
      technicians: [],
    }
  });

  const [allStaffList, setAllStaffList] = useState<StaffWithRole[]>([]);

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Chart data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);

  // View state for charts
  const [revenueView, setRevenueView] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ============================================
  // SALARY SCHEMA Section
  // ============================================
  const [salaryInput, setSalaryInput] = useState({
    staffId: "",
    role: "",
    salaryAmount: "",
    month: "",
    note: "",
  });
  const [salaryList, setSalaryList] = useState<Salary[]>([]);

  // ============================================
  // EXPENSE SCHEMA Section - Updated to match controller
  // ============================================
  const [expenseInput, setExpenseInput] = useState({
    productName: "",
    amount: "",
    category: "",
    paymentDate: "",
    note: "",
  });
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  
  const clinicToken = useAppSelector((state) => state.auth.token);

  // ============================================
  // DASHBOARD DATA FETCHING
  // ============================================

  const fetchDashboardData = async () => {
    if (!clinicId || !clinicToken) return;
    
    setIsLoadingDashboard(true);
    try {
      let url = `${billingBaseUrl}/api/v1/billing/dashboard/${clinicId}?view=${revenueView}`;
      
      if (revenueView === 'yearly') {
        url += `&year=${selectedYear}`;
      } else {
        url += `&year=${selectedYear}&month=${selectedMonth}`;
      }

      const response = await axios.get<DashboardResponse>(url, {
        headers: {
          Authorization: `Bearer ${clinicToken}`,
        },
      });
      console.log(response);
      
      if (response.data.success) {
        setDashboardData(response.data);
        
        // Transform revenue trend data for recharts
        const trendData = Object.entries(response.data.charts.revenueTrend).map(([key, value]) => {
          if (revenueView === 'yearly') {
            return { month: key, revenue: value };
          } else {
            return { day: key, revenue: value };
          }
        });
        setRevenueData(trendData);

        // Transform expense breakdown data for recharts
        const expenseData = [
          { name: "Staff Salaries", value: response.data.charts.expenseBreakdown.staffSalaries, color: "#1E4D2B" },
          { name: "Medicines", value: response.data.charts.expenseBreakdown.medicines, color: "#3FA796" },
          { name: "Equipment", value: response.data.charts.expenseBreakdown.equipment, color: "#D1FAE5" },
          { name: "Consumables", value: response.data.charts.expenseBreakdown.consumables, color: "#6B7280" },
          { name: "Other Expenses", value: response.data.charts.expenseBreakdown.others, color: "#F97316" },
        ].filter(item => item.value > 0);
        
        setExpenseChartData(expenseData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // ============================================
  // SALARY FUNCTIONS
  // ============================================
  const addStaffSalary = async () => {
    // Validation
    if (!salaryInput.staffId || !salaryInput.salaryAmount || !salaryInput.month || !salaryInput.role) {
      alert("Staff ID, role, salary amount, and month are required");
      return;
    }

    if (!clinicToken) {
      alert("User not authenticated. Please log in.");
      return;
    }

    setIsSubmittingSalary(true);

    try {
      // Prepare the request body
      const salaryData = {
        staffId: salaryInput.staffId,
        role: salaryInput.role,
        salaryAmount: parseFloat(salaryInput.salaryAmount),
        note: salaryInput.note || "",
        month: salaryInput.month,
      };

      // Make the API call to the unified salary endpoint
      const response = await axios.post(
        `${baseUrl}api/v1/salary/add`,
        salaryData,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );
      
      if (response.data.success) {
        alert("Salary added successfully!");
        
        // Add to local list for UI update
        setSalaryList([
          ...salaryList,
          {
            staffId: salaryInput.staffId,
            role: salaryInput.role,
            salaryAmount: parseFloat(salaryInput.salaryAmount) || 0,
            month: salaryInput.month,
            note: salaryInput.note,
            id: Date.now() + Math.random(),
            clinicId: clinicId,
            _id: response.data.data?._id,
          },
        ]);
        
        // Reset form
        setSalaryInput({
          staffId: "",
          role: "",
          salaryAmount: "",
          month: "",
          note: "",
        });

        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (error: any) {
      console.error("Error adding salary:", error);
      
      // Handle specific error messages
      if (error.response) {
        switch (error.response.status) {
          case 403:
            alert("Only clinic admin can add staff salary");
            break;
          case 400:
            alert(error.response.data.message || "Invalid request");
            break;
          case 409:
            alert("Salary already added for this staff in this month");
            break;
          case 502:
            alert("Staff service unavailable. Please try again later.");
            break;
          default:
            alert(error.response.data.message || "Failed to add salary");
        }
      } else if (error.request) {
        alert("Network error. Please check your connection.");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  // ============================================
  // EXPENSE FUNCTIONS - Integrated with controller
  // ============================================
  const addExpense = async () => {
    // Validation based on controller requirements
    if (!expenseInput.amount || !expenseInput.paymentDate) {
      alert("Amount and payment date are required");
      return;
    }

    if (isNaN(parseFloat(expenseInput.amount))) {
      alert("Amount must be a valid number");
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expenseInput.paymentDate)) {
      alert("Payment date must be in YYYY-MM-DD format");
      return;
    }

    if (!clinicToken) {
      alert("User not authenticated. Please log in.");
      return;
    }

    setIsSubmittingExpense(true);

    try {
      // Prepare the request body according to the controller
      const expenseData = {
        amount: parseFloat(expenseInput.amount),
        category: expenseInput.category || "other",
        productName: expenseInput.productName || "",
        paymentDate: expenseInput.paymentDate,
        note: expenseInput.note || "",
      };

      // Make the API call to the expense endpoint
      const response = await axios.post(
        `${baseUrl}api/v1/expense/add`,
        expenseData,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );

      if (response.data.success) {
        alert("Expense added successfully!");
          
        // Add to local list for UI update
        setExpenseList([
          ...expenseList,
          {
            amount: parseFloat(expenseInput.amount) || 0,
            category: expenseInput.category || "other",
            productName: expenseInput.productName,
            paymentDate: expenseInput.paymentDate,
            note: expenseInput.note,
            id: Date.now() + Math.random(),
            clinicId: clinicId,
            _id: response.data.data?._id,
          },
        ]);
        
        // Reset form
        setExpenseInput({
          productName: "",
          amount: "",
          category: "",
          paymentDate: "",
          note: "",
        });

        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);
      
      // Handle specific error messages
      if (error.response) {
        switch (error.response.status) {
          case 400:
            alert(error.response.data.message || "Invalid request");
            break;
          case 401:
            alert("Unauthorized. Please login again.");
            break;
          case 403:
            alert("You don't have permission to add expenses");
            break;
          default:
            alert(error.response.data.message || "Failed to add expense");
        }
      } else if (error.request) {
        alert("Network error. Please check your connection.");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Fetch salaries
  const fetchSalaries = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}api/v1/salary/get/${clinicId}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );
      if (response.data.success) {
        const transformedSalaries = response.data.data.map((salary: any) => ({
          ...salary,
          id: Date.now() + Math.random() + salary._id,
        }));
        setSalaryList(transformedSalaries);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    }
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}api/v1/expense/get-expenses/${clinicId}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );
      if (response.data.success) {
        const transformedExpenses = response.data.data.map((exp: any) => ({
          ...exp,
          id: Date.now() + Math.random() + exp._id,
        }));
        setExpenseList(transformedExpenses);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  // Update dashboard when view changes
  useEffect(() => {
    fetchDashboardData();
  }, [revenueView, selectedMonth, selectedYear, clinicId, clinicToken]);

  // Calculate totals
  const totalSalaryAmount = salaryList.reduce(
    (total, item) => total + (item.salaryAmount || 0),
    0,
  );
  const totalExpenseAmount = expenseList.reduce(
    (total, item) => total + (item.amount || 0),
    0,
  );

  // Get current date for default value
  const getCurrentDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const fetchStaffData = async (): Promise<void> => {
    setIsLoadingStaff(true);
    try {
      const res = await axios.get<StaffDataResponse>(
        `${baseUrl}api/v1/auth/clinic/all-staffs/${clinicId}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        }
      );
      
      setStaffData(res.data);

      const flattenedStaff: StaffWithRole[] = [
        ...(res.data.staff?.accountants || []).map((staff: Staff) => ({
          ...staff,
          role: "accountant",
        })),
        ...(res.data.staff?.nurses || []).map((staff: Staff) => ({
          ...staff,
          role: "nurse",
        })),
        ...(res.data.staff?.pharmacists || []).map((staff: Staff) => ({
          ...staff,
          role: "pharmacist",
        })),
        ...(res.data.staff?.receptionists || []).map((staff: Staff) => ({
          ...staff,
          role: "receptionist",
        })),
        ...(res.data.staff?.technicians || []).map((staff: Staff) => ({
          ...staff,
          role: "technician",
        })),
      ];

      setAllStaffList(flattenedStaff);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch staff data");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (clinicId && clinicToken) {
      fetchStaffData();
      fetchSalaries();
      fetchExpenses();
    }
  }, [clinicId, clinicToken]);

  return (
    <div className="space-y-6">
      {/* Header with navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Financial Dashboard</h2>
          <p className="text-muted-foreground">
            {dashboardData ? (
              <>
                {dashboardData.view === 'yearly' 
                  ? `Year ${dashboardData.period.year} Overview`
                  : `${new Date(dashboardData.period.startDate).toLocaleString('default', { month: 'long' })} ${dashboardData.period.year} Overview`
                }
              </>
            ) : (
              'Financial Overview'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={currentPage === "dashboard" ? "default" : "outline"}
            onClick={() => setCurrentPage("dashboard")}
          >
            Dashboard
          </Button>
          <Button
            variant={currentPage === "amounts" ? "default" : "outline"}
            onClick={() => setCurrentPage("amounts")}
          >
            Amounts
          </Button>
        </div>
      </div>

      {/* Page: Dashboard */}
      {currentPage === "dashboard" && (
        <>
          {/* Financial Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Income
                    </p>
                    <p className="text-2xl text-primary">
                      ${(dashboardData?.summary.totalIncome.amount || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        Billing: ${dashboardData?.summary.totalIncome.breakdown.billingIncome || 0}
                      </span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Outstanding Dues
                    </p>
                    <p className="text-2xl text-destructive">
                      ${(dashboardData?.summary.outstandingDues.amount || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      <span className="text-xs text-destructive">
                        Billing: ${dashboardData?.summary.outstandingDues.breakdown.billingOutstanding || 0}
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-destructive/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Petty Cash</p>
                    <p className="text-2xl text-secondary">
                      ${(dashboardData?.summary.pettyCash || 0).toLocaleString()}
                    </p>
                    <Progress 
                      value={dashboardData?.summary.pettyCash ? 45 : 0} 
                      className="mt-2" 
                    />
                  </div>
                  <Wallet className="w-8 h-8 text-secondary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Expenses
                    </p>
                    <p className="text-2xl text-orange-600">
                      ${(dashboardData?.summary.totalExpenses.amount || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-orange-600" />
                      <span className="text-xs text-orange-600">
                        Salary: ${dashboardData?.summary.totalExpenses.breakdown.salaryExpenses || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-2xl text-green-600">
                      ${(dashboardData?.summary.netProfit || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        Margin: {dashboardData?.summary.profitMargin || '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue Trend</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={revenueView === 'yearly' ? 'default' : 'outline'}
                    onClick={() => setRevenueView('yearly')}
                  >
                    Yearly
                  </Button>
                  <Button
                    size="sm"
                    variant={revenueView === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setRevenueView('monthly')}
                  >
                    Monthly
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoadingDashboard ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis dataKey={revenueView === 'yearly' ? 'month' : 'day'} />
                        <YAxis />
                        <Bar
                          dataKey="revenue"
                          fill="#1E4D2B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {isLoadingDashboard ? (
                    <div className="text-muted-foreground">Loading...</div>
                  ) : expenseChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {expenseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted-foreground">
                      No expense data available
                    </div>
                  )}
                </div>
                <div className="space-y-2 mt-4">
                  {expenseChartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ${item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <p className="text-xl font-bold">{dashboardData?.billingSummary.totalBills || 0}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Paid</p>
                  <p className="text-xl font-bold text-green-600">{dashboardData?.billingSummary.paidBills || 0}</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">{dashboardData?.billingSummary.pendingBills || 0}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Partial</p>
                  <p className="text-xl font-bold text-blue-600">{dashboardData?.billingSummary.partialBills || 0}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Cancelled</p>
                  <p className="text-xl font-bold text-red-600">{dashboardData?.billingSummary.cancelledBills || 0}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">Payment Rate</p>
                <p className="text-lg font-bold text-green-600">{dashboardData?.billingSummary.paymentRate || '0%'}</p>
              </div>
            </CardContent>
          </Card> */}
        </>
      )}

      {/* Page: Amounts */}
      {currentPage === "amounts" && (
        <div className="space-y-8">
          {/* Summary Totals Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> Total Salary (Pending)
                    </p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      ${totalSalaryAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {salaryList.length} employee
                      {salaryList.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" /> Total Expenses
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      ${totalExpenseAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {expenseList.length} expense
                      {expenseList.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Management Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <CardTitle>Salary Management</CardTitle>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
                  Schema: Salary
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Add staff salaries with role, amount, month, and notes
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Add Salary Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <User className="w-4 h-4" /> Staff{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={salaryInput.staffId}
                    onChange={(e) => {
                      const selectedStaff = allStaffList.find(
                        (staff) => staff._id === e.target.value,
                      );
                      setSalaryInput({
                        ...salaryInput,
                        staffId: e.target.value,
                        role: selectedStaff
                          ? selectedStaff.role
                          : salaryInput.role,
                      });
                    }}
                    disabled={isSubmittingSalary}
                  >
                    <option value="">Select staff member</option>

                    {/* Group by role */}
                    {[
                      "accountant",
                      "nurse",
                      "pharmacist",
                      "receptionist",
                      "technician",
                    ].map((role) => {
                      const staffInRole = allStaffList.filter(
                        (staff) => staff.role === role,
                      );
                      if (staffInRole.length === 0) return null;

                      return (
                        <optgroup
                          key={role}
                          label={`${role.charAt(0).toUpperCase() + role.slice(1)}s`}
                        >
                          {staffInRole.map((staff) => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name} ({staff.employeeId})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    
                    {/* Note: Doctors would need to be fetched from a separate service */}
                    <optgroup label="Doctors">
                      <option value="" disabled>
                        Doctors - Select from role dropdown
                      </option>
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Tag className="w-4 h-4" /> Role{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={salaryInput.role}
                    onChange={(e) =>
                      setSalaryInput({ ...salaryInput, role: e.target.value })
                    }
                    disabled={isSubmittingSalary}
                  >
                    <option value="">Select role</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Salary Amount{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="50000"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2"
                    value={salaryInput.salaryAmount}
                    onChange={(e) =>
                      setSalaryInput({
                        ...salaryInput,
                        salaryAmount: e.target.value,
                      })
                    }
                    disabled={isSubmittingSalary}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Month{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="month"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={salaryInput.month}
                    onChange={(e) =>
                      setSalaryInput({ ...salaryInput, month: e.target.value })
                    }
                    disabled={isSubmittingSalary}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Note (max 300)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    maxLength={300}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={salaryInput.note}
                    onChange={(e) =>
                      setSalaryInput({ ...salaryInput, note: e.target.value })
                    }
                    disabled={isSubmittingSalary}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={addStaffSalary}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmittingSalary}
                  >
                    {isSubmittingSalary ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⚪</span>
                        Adding...
                      </span>
                    ) : (
                      "Add Salary Entry"
                    )}
                  </Button>
                </div>
              </div>

              {/* Salary List Display */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Salary Records (
                  {salaryList.length})
                </h3>
                {salaryList.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {salaryList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-muted/30 rounded-lg text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              ID: {item.staffId.substring(0, 8)}...
                            </span>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                              {item.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary">
                              ${item.salaryAmount.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.month}
                            </span>
                          </div>
                        </div>
                        {item.note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/10">
                    No salary records added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Management Card */}
          <Card className="border-2 border-orange-500/20">
            <CardHeader className="bg-orange-500/5 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <CardTitle>Expense Management</CardTitle>
                <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full ml-2">
                  Schema: Expense
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Add expenses with category, amount, date, and notes
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Add Expense Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Product Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., X-Ray Machine"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={expenseInput.productName}
                    onChange={(e) =>
                      setExpenseInput({
                        ...expenseInput,
                        productName: e.target.value,
                      })
                    }
                    disabled={isSubmittingExpense}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Tag className="w-4 h-4" /> Category
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={expenseInput.category}
                    onChange={(e) =>
                      setExpenseInput({
                        ...expenseInput,
                        category: e.target.value,
                      })
                    }
                    disabled={isSubmittingExpense}
                  >
                    <option value="">Select category (default: other)</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Amount{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="1200"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={expenseInput.amount}
                    onChange={(e) =>
                      setExpenseInput({
                        ...expenseInput,
                        amount: e.target.value,
                      })
                    }
                    disabled={isSubmittingExpense}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Payment Date{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={expenseInput.paymentDate}
                    onChange={(e) =>
                      setExpenseInput({ ...expenseInput, paymentDate: e.target.value })
                    }
                    disabled={isSubmittingExpense}
                  />
                  <p className="text-xs text-muted-foreground">Format: YYYY-MM-DD</p>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Note
                  </label>
                  <input
                    type="text"
                    placeholder="Optional note"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={expenseInput.note}
                    onChange={(e) =>
                      setExpenseInput({
                        ...expenseInput,
                        note: e.target.value,
                      })
                    }
                    disabled={isSubmittingExpense}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={addExpense}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={isSubmittingExpense}
                  >
                    {isSubmittingExpense ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⚪</span>
                        Adding...
                      </span>
                    ) : (
                      "Add Expense Entry"
                    )}
                  </Button>
                </div>
              </div>

              {/* Expense List Display */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Expense Records (
                  {expenseList.length})
                </h3>
                {expenseList.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {expenseList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-muted/30 rounded-lg text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {item.productName || "Unnamed"}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full text-xs">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-orange-600">
                              ${item.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.paymentDate}
                            </span>
                          </div>
                        </div>
                        {item.note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/10">
                    No expense records added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}