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
  Eye,
  X,
  Users,
  Phone,
  Mail,
  FileText as FileTextIcon,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
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
  };
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

// New interface for the detailed salary response from the API
interface SalaryDetail {
  salaryId: string;
  role: string;
  month: string;
  salaryAmount: number;
  note: string;
  staff: {
    id: string;
    name: string;
    phoneNumber: string | number;
    email: string;
  };
}

interface SalaryDetailsResponse {
  success: boolean;
  month: string;
  count: number;
  data: SalaryDetail[];
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

// Expense Detail interface
interface ExpenseDetail {
  _id: string;
  clinicId: string;
  amount: number;
  category: string;
  productName: string;
  paymentDate: string;
  note: string;
  addedBy: string;
  addedByRole: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Month options for filtering
const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Year options (current year and previous 2 years)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
};

// Salary Details Modal Component
interface SalaryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryDetails: SalaryDetail[];
  selectedMonth: string;
  selectedYear: number;
  isLoading: boolean;
  onMonthChange: (month: string) => void;
  onYearChange: (year: number) => void;
  onRefresh: () => void;
}

function SalaryDetailsModal({
  isOpen,
  onClose,
  salaryDetails,
  selectedMonth,
  selectedYear,
  isLoading,
  onMonthChange,
  onYearChange,
  onRefresh,
}: SalaryDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .modal-content {
        animation: fadeIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isOpen) return null;

  const totalSalaryAmount =
    salaryDetails?.reduce(
      (total, item) => total + (item?.salaryAmount || 0),
      0,
    ) || 0;

  const filteredDetails =
    salaryDetails?.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item?.staff?.name?.toLowerCase().includes(searchLower) ||
        item?.role?.toLowerCase().includes(searchLower) ||
        item?.staff?.email?.toLowerCase().includes(searchLower) ||
        item?.staff?.phoneNumber?.toString().includes(searchLower)
      );
    }) || [];

  const monthName =
    months.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const styles = {
    modalOverlay: {
      position: "fixed" as const,
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "1rem",
      height: "100vh",
    },
    modalContainer: {
      backgroundColor: "white",
      borderRadius: "1rem",
      width: "100%",
      maxWidth: "80rem",
      maxHeight: "90vh",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      animation: "fadeIn 0.3s ease-out",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.5rem 2rem",
      borderBottom: "1px solid #e9ecef",
      background: "linear-gradient(135deg, #f8faf8 0%, #ffffff 100%)",
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "1.75rem",
      fontWeight: 600,
      margin: 0,
      color: "#f97316",
    },
    headerSubtitle: {
      color: "#6c757d",
      marginTop: "0.375rem",
      fontSize: "0.95rem",
    },
    closeButton: {
      background: "transparent",
      border: "none",
      borderRadius: "0.5rem",
      width: "2.5rem",
      height: "2.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      color: "#6c757d",
    },
    filtersSection: {
      padding: "1.25rem 2rem",
      borderBottom: "1px solid #e9ecef",
      backgroundColor: "#ffffff",
    },
    filtersContainer: {
      display: "flex",
      flexWrap: "wrap" as const,
      alignItems: "center",
      gap: "1rem",
    },
    filterLabel: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      color: "#495057",
      fontWeight: 500,
    },
    select: {
      height: "2.5rem",
      borderRadius: "0.5rem",
      border: "1px solid black",
      backgroundColor: "white",
      color: "black",
      padding: "0 1rem",
      fontSize: "0.95rem",
      outline: "none",
      cursor: "pointer",
      minWidth: "120px",
      transition: "all 0.2s ease",
    },
    refreshButton: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.625rem 1.25rem",
      fontSize: "0.95rem",
      fontWeight: 500,
      borderRadius: "0.5rem",
      border: "1px solid #dee2e6",
      backgroundColor: "white",
      cursor: "pointer",
      transition: "all 0.2s ease",
      color: "#495057",
    },
    searchContainer: {
      position: "relative" as const,
      minWidth: "280px",
    },
    searchInput: {
      height: "2.5rem",
      width: "100%",
      borderRadius: "0.5rem",
      border: "1px solid #dee2e6",
      backgroundColor: "white",
      padding: "0 1rem 0 2.5rem",
      fontSize: "0.95rem",
      outline: "none",
      transition: "all 0.2s ease",
    },
    searchIcon: {
      position: "absolute" as const,
      left: "0.875rem",
      top: "0.75rem",
      width: "1rem",
      height: "1rem",
      color: "#adb5bd",
    },
    content: {
      padding: "2rem",
      overflowY: "auto" as const,
      maxHeight: "calc(90vh - 200px)",
      backgroundColor: "#f8faf8",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 0",
      gap: "1rem",
    },
    spinner: {
      animation: "spin 1s linear infinite",
      borderRadius: "50%",
      height: "3rem",
      width: "3rem",
      border: "3px solid #e9ecef",
      borderTopColor: "#f97316",
    },
    loadingText: {
      color: "#6c757d",
      fontSize: "1rem",
    },
    emptyState: {
      textAlign: "center" as const,
      padding: "4rem 2rem",
    },
    emptyStateIcon: {
      width: "4rem",
      height: "4rem",
      color: "#adb5bd",
      margin: "0 auto 1.5rem",
    },
    emptyStateText: {
      color: "#6c757d",
      fontSize: "1.1rem",
      marginBottom: "0.5rem",
    },
    emptyStateSubtext: {
      color: "#adb5bd",
      fontSize: "0.95rem",
    },
    summaryCard: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8faf8 100%)",
      border: "1px solid rgba(30, 77, 43, 0.15)",
      borderRadius: "1rem",
      marginBottom: "2rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    summaryContent: {
      padding: "1.5rem 2rem",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "2rem",
    },
    summaryItem: {
      textAlign: "left" as const,
    },
    summaryLabel: {
      fontSize: "0.95rem",
      color: "#6c757d",
      marginBottom: "0.5rem",
      fontWeight: 500,
    },
    summaryValue: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#f97316",
      lineHeight: 1.2,
    },
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "1.5rem",
    },
    salaryCard: {
      border: "1px solid #e9ecef",
      borderRadius: "1rem",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "default",
      backgroundColor: "white",
      overflow: "hidden",
    },
    salaryCardContent: {
      padding: "1.5rem",
    },
    cardHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "1rem",
    },
    staffInfo: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    avatar: {
      height: "3rem",
      width: "3rem",
      background: "linear-gradient(135deg, #d05802 0%, #f97316 100%)",
      borderRadius: "0.75rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 6px -1px rgba(30, 77, 43, 0.2)",
    },
    avatarText: {
      color: "white",
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    staffName: {
      fontWeight: 600,
      color: "#f97316",
      margin: 0,
      fontSize: "1.1rem",
    },
    roleBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      backgroundColor: "rgba(30, 77, 43, 0.08)",
      color: "#f97316",
      borderRadius: "2rem",
      fontSize: "0.85rem",
      fontWeight: 500,
      marginTop: "0.375rem",
    },
    salaryAmount: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#f97316",
      margin: 0,
    },
    salaryMonth: {
      fontSize: "0.85rem",
      color: "#6c757d",
      margin: 0,
      marginTop: "0.25rem",
    },
    staffDetails: {
      marginTop: "1rem",
      paddingTop: "1rem",
      borderTop: "1px solid #e9ecef",
    },
    detailItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "0.95rem",
      marginBottom: "0.75rem",
      color: "#495057",
    },
    detailIcon: {
      width: "1rem",
      height: "1rem",
      color: "#adb5bd",
    },
    salaryId: {
      fontSize: "0.85rem",
      color: "#adb5bd",
      marginTop: "1rem",
      paddingTop: "0.75rem",
      borderTop: "1px dashed #e9ecef",
      fontFamily: "monospace",
    },
    footer: {
      padding: "1.25rem 2rem",
      borderTop: "1px solid #e9ecef",
      backgroundColor: "#ffffff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: "0.95rem",
      color: "#6c757d",
    },
    footerHighlight: {
      color: "#1e4d2b",
      fontWeight: 600,
    },
    closeFooterButton: {
      padding: "0.625rem 1.5rem",
      fontSize: "0.95rem",
      fontWeight: 500,
      borderRadius: "0.5rem",
      border: "1px solid #1e4d2b",
      backgroundColor: "#1e4d2b",
      color: "white",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    clearSearchButton: {
      padding: "0.5rem 1rem",
      fontSize: "0.85rem",
      color: "#1e4d2b",
      background: "transparent",
      border: "1px solid #1e4d2b",
      borderRadius: "0.5rem",
      cursor: "pointer",
      marginLeft: "0.5rem",
      transition: "all 0.2s ease",
    },
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={styles.modalContainer}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>
              <Briefcase
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  color: "#1e4d2b",
                }}
              />
              Salary Details
            </h2>
            <p style={styles.headerSubtitle}>
              {monthName} {selectedYear} • {filteredDetails.length} employee
              {filteredDetails.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.color = "#1e4d2b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#6c757d";
            }}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
        </div>

        <div style={styles.filtersSection}>
          <div style={styles.filtersContainer}>
            <div style={styles.filterLabel}>
              <Filter style={{ width: "1rem", height: "1rem" }} />
              <span>Filters:</span>
            </div>

            <select
              style={styles.select}
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              style={styles.select}
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              style={styles.refreshButton}
              onClick={onRefresh}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
                e.currentTarget.style.borderColor = "#1e4d2b";
                e.currentTarget.style.color = "#1e4d2b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#dee2e6";
                e.currentTarget.style.color = "#495057";
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={styles.content}>
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading salary details...</p>
            </div>
          ) : !filteredDetails || filteredDetails.length === 0 ? (
            <div style={styles.emptyState}>
              <Users style={styles.emptyStateIcon} />
              <p style={styles.emptyStateText}>No salary records found</p>
              <p style={styles.emptyStateSubtext}>
                {searchTerm
                  ? `No results matching "${searchTerm}" for ${monthName} ${selectedYear}`
                  : `No salary records available for ${monthName} ${selectedYear}`}
              </p>
              {searchTerm && (
                <button
                  style={styles.clearSearchButton}
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div style={styles.summaryCard}>
                <div style={styles.summaryContent}>
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryItem}>
                      <p style={styles.summaryLabel}>Total Salary Amount</p>
                      <p style={styles.summaryValue}>
                        ${totalSalaryAmount.toLocaleString()}
                      </p>
                    </div>
                    <div style={styles.summaryItem}>
                      <p style={styles.summaryLabel}>Total Employees</p>
                      <p style={styles.summaryValue}>
                        {filteredDetails.length}
                      </p>
                    </div>
                    <div style={styles.summaryItem}>
                      <p style={styles.summaryLabel}>Average Salary</p>
                      <p style={styles.summaryValue}>
                        $
                        {filteredDetails.length > 0
                          ? Math.round(
                              totalSalaryAmount / filteredDetails.length,
                            ).toLocaleString()
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.cardsGrid}>
                {filteredDetails.map((item, index) => (
                  <div
                    key={item?.salaryId || index}
                    style={{
                      ...styles.salaryCard,
                      transform:
                        hoveredCard === item?.salaryId
                          ? "translateY(-4px)"
                          : "translateY(0)",
                      boxShadow:
                        hoveredCard === item?.salaryId
                          ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    }}
                    onMouseEnter={() =>
                      setHoveredCard(item?.salaryId || index.toString())
                    }
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={styles.salaryCardContent}>
                      <div style={styles.cardHeader}>
                        <div style={styles.staffInfo}>
                          <div style={styles.avatar}>
                            <span style={styles.avatarText}>
                              {item?.staff?.name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </span>
                          </div>
                          <div>
                            <h3 style={styles.staffName}>
                              {item?.staff?.name || "Unknown"}
                            </h3>
                            <span style={styles.roleBadge}>
                              {item?.role || "No role"}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={styles.salaryAmount}>
                            ${item?.salaryAmount?.toLocaleString() || 0}
                          </p>
                          <p style={styles.salaryMonth}>
                            {item?.month || "No month"}
                          </p>
                        </div>
                      </div>

                      <div style={styles.staffDetails}>
                        {item?.staff?.phoneNumber && (
                          <div style={styles.detailItem}>
                            <Phone style={styles.detailIcon} />
                            <span>{item.staff.phoneNumber}</span>
                          </div>
                        )}
                        {item?.staff?.email && (
                          <div style={styles.detailItem}>
                            <Mail style={styles.detailIcon} />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.staff.email}
                            </span>
                          </div>
                        )}
                        {item?.note && (
                          <div style={styles.detailItem}>
                            <FileText style={styles.detailIcon} />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.note}
                            </span>
                          </div>
                        )}
                      </div>

                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Showing{" "}
            <span style={styles.footerHighlight}>{filteredDetails.length}</span>{" "}
            of{" "}
            <span style={styles.footerHighlight}>
              {salaryDetails?.length || 0}
            </span>{" "}
            records
          </p>
          <button
            style={styles.closeFooterButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#153b21";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 6px -1px rgba(30, 77, 43, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1e4d2b";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Expense Details Modal Component
interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseDetails: ExpenseDetail[];
  selectedMonth: string;
  selectedYear: number;
  isLoading: boolean;
  totalAmount: number;
  onMonthChange: (month: string) => void;
  onYearChange: (year: number) => void;
  onRefresh: () => void;
}

function ExpenseDetailsModal({
  isOpen,
  onClose,
  expenseDetails,
  selectedMonth,
  selectedYear,
  isLoading,
  totalAmount,
  onMonthChange,
  onYearChange,
  onRefresh,
}: ExpenseDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .modal-content {
        animation: fadeIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isOpen) return null;

  const filteredDetails =
    expenseDetails?.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item?.productName?.toLowerCase().includes(searchLower) ||
        item?.category?.toLowerCase().includes(searchLower) ||
        item?.note?.toLowerCase().includes(searchLower) ||
        item?.amount?.toString().includes(searchLower)
      );
    }) || [];

  const monthName =
    months.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        equipment: {
          bg: "rgba(59, 130, 246, 0.1)",
          text: "#2563eb",
          border: "#3b82f6",
        },
        supplies: {
          bg: "rgba(16, 185, 129, 0.1)",
          text: "#059669",
          border: "#10b981",
        },
        utilities: {
          bg: "rgba(245, 158, 11, 0.1)",
          text: "#d97706",
          border: "#f59e0b",
        },
        maintenance: {
          bg: "rgba(139, 92, 246, 0.1)",
          text: "#7c3aed",
          border: "#8b5cf6",
        },
        marketing: {
          bg: "rgba(236, 72, 153, 0.1)",
          text: "#db2777",
          border: "#ec4899",
        },
        rent: {
          bg: "rgba(239, 68, 68, 0.1)",
          text: "#dc2626",
          border: "#ef4444",
        },
        insurance: {
          bg: "rgba(245, 158, 11, 0.1)",
          text: "#d97706",
          border: "#f59e0b",
        },
        other: {
          bg: "rgba(107, 114, 128, 0.1)",
          text: "#4b5563",
          border: "#6b7280",
        },
      };
    return colors[category?.toLowerCase()] || colors.other;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const styles = {
    modalOverlay: {
      position: "fixed" as const,
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "1rem",
      height: "100vh",
    },
    modalContainer: {
      backgroundColor: "white",
      borderRadius: "1rem",
      width: "100%",
      maxWidth: "80rem",
      maxHeight: "90vh",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      animation: "fadeIn 0.3s ease-out",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.5rem 2rem",
      borderBottom: "1px solid #e9ecef",
      background: "linear-gradient(135deg, #fff7f0 0%, #ffffff 100%)",
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "1.75rem",
      fontWeight: 600,
      margin: 0,
      color: "#9a3412",
    },
    headerSubtitle: {
      color: "#6c757d",
      marginTop: "0.375rem",
      fontSize: "0.95rem",
    },
    closeButton: {
      background: "transparent",
      border: "none",
      borderRadius: "0.5rem",
      width: "2.5rem",
      height: "2.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      color: "#6c757d",
    },
    filtersSection: {
      padding: "1.25rem 2rem",
      borderBottom: "1px solid #e9ecef",
      backgroundColor: "#ffffff",
    },
    filtersContainer: {
      display: "flex",
      flexWrap: "wrap" as const,
      alignItems: "center",
      gap: "1rem",
    },
    filterLabel: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      color: "#495057",
      fontWeight: 500,
    },
    select: {
      height: "2.5rem",
      borderRadius: "0.5rem",
      border: "1px solid black",
      backgroundColor: "white",
      color: "black",
      padding: "0 1rem",
      fontSize: "0.95rem",
      outline: "none",
      cursor: "pointer",
      minWidth: "120px",
      transition: "all 0.2s ease",
    },
    refreshButton: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.625rem 1.25rem",
      fontSize: "0.95rem",
      fontWeight: 500,
      borderRadius: "0.5rem",
      border: "1px solid #dee2e6",
      backgroundColor: "white",
      cursor: "pointer",
      transition: "all 0.2s ease",
      color: "#495057",
    },
    searchContainer: {
      position: "relative" as const,
      minWidth: "280px",
    },
    searchInput: {
      height: "2.5rem",
      width: "100%",
      borderRadius: "0.5rem",
      border: "1px solid #dee2e6",
      backgroundColor: "white",
      padding: "0 1rem 0 2.5rem",
      fontSize: "0.95rem",
      outline: "none",
      transition: "all 0.2s ease",
    },
    searchIcon: {
      position: "absolute" as const,
      left: "0.875rem",
      top: "0.75rem",
      width: "1rem",
      height: "1rem",
      color: "#adb5bd",
    },
    content: {
      padding: "2rem",
      overflowY: "auto" as const,
      maxHeight: "calc(90vh - 200px)",
      backgroundColor: "#f8faf8",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 0",
      gap: "1rem",
    },
    spinner: {
      animation: "spin 1s linear infinite",
      borderRadius: "50%",
      height: "3rem",
      width: "3rem",
      border: "3px solid #e9ecef",
      borderTopColor: "#f97316",
    },
    loadingText: {
      color: "#6c757d",
      fontSize: "1rem",
    },
    emptyState: {
      textAlign: "center" as const,
      padding: "4rem 2rem",
    },
    emptyStateIcon: {
      width: "4rem",
      height: "4rem",
      color: "#adb5bd",
      margin: "0 auto 1.5rem",
    },
    emptyStateText: {
      color: "#6c757d",
      fontSize: "1.1rem",
      marginBottom: "0.5rem",
    },
    emptyStateSubtext: {
      color: "#adb5bd",
      fontSize: "0.95rem",
    },
    summaryCard: {
      background: "linear-gradient(135deg, #ffffff 0%, #fff7f0 100%)",
      border: "1px solid rgba(249, 115, 22, 0.15)",
      borderRadius: "1rem",
      marginBottom: "2rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    summaryContent: {
      padding: "1.5rem 2rem",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "2rem",
    },
    summaryItem: {
      textAlign: "left" as const,
    },
    summaryLabel: {
      fontSize: "0.95rem",
      color: "#6c757d",
      marginBottom: "0.5rem",
      fontWeight: 500,
    },
    summaryValue: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#f97316",
      lineHeight: 1.2,
    },
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "1.5rem",
    },
    expenseCard: {
      border: "1px solid #e9ecef",
      borderRadius: "1rem",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "default",
      backgroundColor: "white",
      overflow: "hidden",
    },
    expenseCardContent: {
      padding: "1.5rem",
    },
    cardHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "1rem",
    },
    productInfo: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    iconContainer: {
      height: "3rem",
      width: "3rem",
      background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
      borderRadius: "0.75rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 6px -1px rgba(249, 115, 22, 0.2)",
    },
    iconText: {
      color: "white",
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    productName: {
      fontWeight: 600,
      color: "#1a2e1f",
      margin: 0,
      fontSize: "1.1rem",
    },
    categoryBadge: {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "2rem",
      fontSize: "0.85rem",
      fontWeight: 500,
      marginTop: "0.375rem",
    },
    amountContainer: {
      textAlign: "right" as const,
    },
    amount: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#f97316",
      margin: 0,
    },
    paymentDate: {
      fontSize: "0.85rem",
      color: "#6c757d",
      margin: 0,
      marginTop: "0.25rem",
    },
    expenseDetails: {
      marginTop: "1rem",
      paddingTop: "1rem",
      borderTop: "1px solid #e9ecef",
    },
    detailItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "0.95rem",
      marginBottom: "0.75rem",
      color: "#495057",
    },
    detailIcon: {
      width: "1rem",
      height: "1rem",
      color: "#adb5bd",
    },
    noteSection: {
      marginTop: "0.75rem",
      padding: "0.75rem",
      backgroundColor: "#f8f9fa",
      borderRadius: "0.5rem",
      fontSize: "0.9rem",
      color: "#495057",
      borderLeft: "3px solid #f97316",
    },
    expenseId: {
      fontSize: "0.85rem",
      color: "#adb5bd",
      marginTop: "1rem",
      paddingTop: "0.75rem",
      borderTop: "1px dashed #e9ecef",
      fontFamily: "monospace",
    },
    footer: {
      padding: "1.25rem 2rem",
      borderTop: "1px solid #e9ecef",
      backgroundColor: "#ffffff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: "0.95rem",
      color: "#6c757d",
    },
    footerHighlight: {
      color: "#f97316",
      fontWeight: 600,
    },
    closeFooterButton: {
      padding: "0.625rem 1.5rem",
      fontSize: "0.95rem",
      fontWeight: 500,
      borderRadius: "0.5rem",
      border: "1px solid #f97316",
      backgroundColor: "#f97316",
      color: "white",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    clearSearchButton: {
      padding: "0.5rem 1rem",
      fontSize: "0.85rem",
      color: "#f97316",
      background: "transparent",
      border: "1px solid #f97316",
      borderRadius: "0.5rem",
      cursor: "pointer",
      marginLeft: "0.5rem",
      transition: "all 0.2s ease",
    },
    metaInfo: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "0.8rem",
      color: "#6c757d",
      marginTop: "0.5rem",
    },
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={styles.modalContainer}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>
              <ShoppingCart
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  color: "#f97316",
                }}
              />
              Expense Details
            </h2>
            <p style={styles.headerSubtitle}>
              {monthName} {selectedYear} • {filteredDetails.length} expense
              {filteredDetails.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.color = "#f97316";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#6c757d";
            }}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
        </div>

        <div style={styles.filtersSection}>
          <div style={styles.filtersContainer}>
            <div style={styles.filterLabel}>
              <Filter style={{ width: "1rem", height: "1rem" }} />
              <span>Filters:</span>
            </div>

            <select
              style={styles.select}
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              style={styles.select}
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              style={styles.refreshButton}
              onClick={onRefresh}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
                e.currentTarget.style.borderColor = "#f97316";
                e.currentTarget.style.color = "#f97316";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#dee2e6";
                e.currentTarget.style.color = "#495057";
              }}
            >
              Refresh
            </button>

           
          </div>
        </div>

        <div style={styles.content}>
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading expense details...</p>
            </div>
          ) : !filteredDetails || filteredDetails.length === 0 ? (
            <div style={styles.emptyState}>
              <ShoppingCart style={styles.emptyStateIcon} />
              <p style={styles.emptyStateText}>No expense records found</p>
              <p style={styles.emptyStateSubtext}>
                {searchTerm
                  ? `No results matching "${searchTerm}" for ${monthName} ${selectedYear}`
                  : `No expense records available for ${monthName} ${selectedYear}`}
              </p>
              {searchTerm && (
                <button
                  style={styles.clearSearchButton}
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div style={styles.summaryCard}>
                <div style={styles.summaryContent}>
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryItem}>
                      <p style={styles.summaryLabel}>Total Expense Amount</p>
                      <p style={styles.summaryValue}>
                        ${totalAmount?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div style={styles.summaryItem}>
                      <p style={styles.summaryLabel}>Total Expenses</p>
                      <p style={styles.summaryValue}>
                        {filteredDetails.length}
                      </p>
                    </div>
                    <div style={styles.summaryItem}>
                      <p style={styles.summaryLabel}>Average Expense</p>
                      <p style={styles.summaryValue}>
                        $
                        {filteredDetails.length > 0
                          ? Math.round(
                              (totalAmount || 0) / filteredDetails.length,
                            ).toLocaleString()
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.cardsGrid}>
                {filteredDetails.map((item, index) => {
                  const categoryColor = getCategoryColor(item.category);
                  const isHovered = hoveredCard === item._id;

                  return (
                    <div
                      key={item._id || index}
                      style={{
                        ...styles.expenseCard,
                        transform: isHovered
                          ? "translateY(-4px)"
                          : "translateY(0)",
                        boxShadow: isHovered
                          ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseEnter={() => setHoveredCard(item._id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div style={styles.expenseCardContent}>
                        <div style={styles.cardHeader}>
                          <div style={styles.productInfo}>
                            <div style={styles.iconContainer}>
                              <span style={styles.iconText}>
                                {item.productName?.charAt(0)?.toUpperCase() ||
                                  "E"}
                              </span>
                            </div>
                            <div>
                              <h3 style={styles.productName}>
                                {item.productName || "Unnamed Product"}
                              </h3>
                              <span
                                style={{
                                  ...styles.categoryBadge,
                                  backgroundColor: categoryColor.bg,
                                  color: categoryColor.text,
                                }}
                              >
                                {item.category || "other"}
                              </span>
                            </div>
                          </div>
                          <div style={styles.amountContainer}>
                            <p style={styles.amount}>
                              ${item.amount?.toLocaleString() || 0}
                            </p>
                            <p style={styles.paymentDate}>
                              {formatDate(item.paymentDate)}
                            </p>
                          </div>
                        </div>

                        <div style={styles.expenseDetails}>
                          {item.note && (
                            <div style={styles.noteSection}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                <FileText
                                  style={{
                                    width: "0.875rem",
                                    height: "0.875rem",
                                    color: "#f97316",
                                  }}
                                />
                                <span
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Note
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                                {item.note}
                              </p>
                            </div>
                          )}

                          <div style={styles.metaInfo}>
                            <span>
                              Added by: {item.addedByRole || "Unknown"}
                            </span>
                            <span>
                              Created:{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <p style={styles.expenseId}>
                          ID: {item._id?.slice(0, 8) || "N/A"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Showing{" "}
            <span style={styles.footerHighlight}>{filteredDetails.length}</span>{" "}
            of{" "}
            <span style={styles.footerHighlight}>
              {expenseDetails?.length || 0}
            </span>{" "}
            records
          </p>
          <button
            style={styles.closeFooterButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ea580c";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 6px -1px rgba(249, 115, 22, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f97316";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
    },
  });

  const [allStaffList, setAllStaffList] = useState<StaffWithRole[]>([]);

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null,
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Chart data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);

  // View state for charts
  const [revenueView, setRevenueView] = useState<"yearly" | "monthly">(
    "yearly",
  );
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

  // New state for salary details modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetail[]>([]);
  const [isLoadingSalaryDetails, setIsLoadingSalaryDetails] = useState(false);
    const [selectedSalaryMonth, setSelectedSalaryMonth] = useState(
      String(new Date().getMonth() + 1).padStart(2, "0"),
    );
    const [selectedSalaryYear, setSelectedSalaryYear] = useState(
      new Date().getFullYear(),
    );

  // ============================================
  // EXPENSE SCHEMA Section
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

  // Expense modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>([]);
  const [isLoadingExpenseDetails, setIsLoadingExpenseDetails] = useState(false);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [selectedExpenseYear, setSelectedExpenseYear] = useState(
    new Date().getFullYear(),
  );
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);

  // ============================================
  // DASHBOARD DATA FETCHING
  // ============================================

  const fetchDashboardData = async () => {
    if (!clinicId || !clinicToken) return;

    setIsLoadingDashboard(true);
    try {
      let url = `${billingBaseUrl}/api/v1/billing/dashboard/${clinicId}?view=${revenueView}`;

      if (revenueView === "yearly") {
        url += `&year=${selectedYear}`;
      } else {
        url += `&year=${selectedYear}&month=${selectedMonth}`;
      }

      const response = await axios.get<DashboardResponse>(url, {
        headers: {
          Authorization: `Bearer ${clinicToken}`,
        },
      });

      if (response.data.success) {
        setDashboardData(response.data);

        const trendData = Object.entries(
          response.data.charts?.revenueTrend || {},
        ).map(([key, value]) => {
          if (revenueView === "yearly") {
            return { month: key, revenue: value || 0 };
          } else {
            return { day: key, revenue: value || 0 };
          }
        });
        setRevenueData(trendData);

        const expenseData = [
          {
            name: "Staff Salaries",
            value: response.data.charts?.expenseBreakdown?.staffSalaries || 0,
            color: "#1E4D2B",
          },
          {
            name: "Medicines",
            value: response.data.charts?.expenseBreakdown?.medicines || 0,
            color: "#3FA796",
          },
          {
            name: "Equipment",
            value: response.data.charts?.expenseBreakdown?.equipment || 0,
            color: "#D1FAE5",
          },
          {
            name: "Consumables",
            value: response.data.charts?.expenseBreakdown?.consumables || 0,
            color: "#6B7280",
          },
          {
            name: "Other Expenses",
            value: response.data.charts?.expenseBreakdown?.others || 0,
            color: "#F97316",
          },
        ].filter((item) => item.value > 0);

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
    if (
      !salaryInput.staffId ||
      !salaryInput.salaryAmount ||
      !salaryInput.month ||
      !salaryInput.role
    ) {
      alert("Staff ID, role, salary amount, and month are required");
      return;
    }

    if (!clinicToken) {
      alert("User not authenticated. Please log in.");
      return;
    }

    setIsSubmittingSalary(true);

    try {
      const salaryData = {
        staffId: salaryInput.staffId,
        role: salaryInput.role,
        salaryAmount: parseFloat(salaryInput.salaryAmount) || 0,
        note: salaryInput.note || "",
        month: salaryInput.month,
      };

      const response = await axios.post(
        `${baseUrl}api/v1/salary/add`,
        salaryData,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        },
      );

      if (response.data.success) {
        alert("Salary added successfully!");

        setSalaryList([
          ...(salaryList || []),
          {
            staffId: salaryInput.staffId || "",
            role: salaryInput.role || "",
            salaryAmount: parseFloat(salaryInput.salaryAmount) || 0,
            month: salaryInput.month || "",
            note: salaryInput.note || "",
            id: Date.now() + Math.random(),
            clinicId: clinicId,
            _id: response.data.data?._id,
          },
        ]);

        setSalaryInput({
          staffId: "",
          role: "",
          salaryAmount: "",
          month: "",
          note: "",
        });

        fetchDashboardData();
      }
    } catch (error: any) {
      console.error("Error adding salary:", error);

      if (error?.response) {
        switch (error.response.status) {
          case 403:
            alert("Only clinic admin can add staff salary");
            break;
          case 400:
            alert(error.response.data?.message || "Invalid request");
            break;
          case 409:
            alert("Salary already added for this staff in this month");
            break;
          case 502:
            alert("Staff service unavailable. Please try again later.");
            break;
          default:
            alert(error.response.data?.message || "Failed to add salary");
        }
      } else if (error?.request) {
        alert("Network error. Please check your connection.");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  const fetchSalaryDetails = async (month: string, year: number) => {
    if (!clinicId || !clinicToken) {
      alert("Please ensure you are logged in and clinic ID is available");
      return;
    }

    setIsLoadingSalaryDetails(true);
    try {
      const response = await axios.get<SalaryDetailsResponse>(
        `${baseUrl}api/v1/auth/clinic/staff-salaries/${clinicId}?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        },
      );

      if (response.data.success) {
        setSalaryDetails(response.data.data || []);
      } else {
        setSalaryDetails([]);
      }

      setIsSalaryModalOpen(true);
    } catch (error: any) {
      console.error("Error fetching salary details:", error);

      if (error?.response?.status === 404) {
        setSalaryDetails([]);
        setIsSalaryModalOpen(true);
      } else {
        alert("Failed to fetch salary details. Please try again.");
      }
    } finally {
      setIsLoadingSalaryDetails(false);
    }
  };

  // ============================================
  // EXPENSE FUNCTIONS
  // ============================================
  const addExpense = async () => {
    if (!expenseInput.amount || !expenseInput.paymentDate) {
      alert("Amount and payment date are required");
      return;
    }

    if (isNaN(parseFloat(expenseInput.amount))) {
      alert("Amount must be a valid number");
      return;
    }

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
      const expenseData = {
        amount: parseFloat(expenseInput.amount) || 0,
        category: expenseInput.category || "other",
        productName: expenseInput.productName || "",
        paymentDate: expenseInput.paymentDate,
        note: expenseInput.note || "",
      };

      const response = await axios.post(
        `${baseUrl}api/v1/expense/add`,
        expenseData,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        },
      );

      if (response.data.success) {
        alert("Expense added successfully!");

        setExpenseList([
          ...(expenseList || []),
          {
            amount: parseFloat(expenseInput.amount) || 0,
            category: expenseInput.category || "other",
            productName: expenseInput.productName || "",
            paymentDate: expenseInput.paymentDate || "",
            note: expenseInput.note || "",
            id: Date.now() + Math.random(),
            clinicId: clinicId,
            _id: response.data.data?._id,
          },
        ]);

        setExpenseInput({
          productName: "",
          amount: "",
          category: "",
          paymentDate: "",
          note: "",
        });

        fetchDashboardData();
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);

      if (error?.response) {
        switch (error.response.status) {
          case 400:
            alert(error.response.data?.message || "Invalid request");
            break;
          case 401:
            alert("Unauthorized. Please login again.");
            break;
          case 403:
            alert("You don't have permission to add expenses");
            break;
          default:
            alert(error.response.data?.message || "Failed to add expense");
        }
      } else if (error?.request) {
        alert("Network error. Please check your connection.");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setIsSubmittingExpense(false);
    }
  };
  const fetchDetailExpense=()=>{
      setIsExpenseModalOpen(true);
      
  }
  const fetchExpenseDetails = async (month: string, year: number) => {
    if (!clinicId || !clinicToken) {
      alert("Please ensure you are logged in and clinic ID is available");
      return;
    }

    setIsLoadingExpenseDetails(true);
    try {
      const response = await axios.get(
        `${baseUrl}api/v1/expense/clinic/month/${clinicId}?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        },
      );

      if (response.data.success) {
        setExpenseDetails(response.data.data || []);
        setTotalExpenseAmount(response.data.totalAmount || 0);
      } else {
        setExpenseDetails([]);
        setTotalExpenseAmount(0);
      }

    } catch (error: any) {
      console.error("Error fetching expense details:", error);

      if (error?.response?.status === 404) {
        setExpenseDetails([]);
        setTotalExpenseAmount(0);
        setIsExpenseModalOpen(true);
      } else {
        alert("Failed to fetch expense details. Please try again.");
      }
    } finally {
      setIsLoadingExpenseDetails(false);
    }
  };

  const fetchSalaries = async () => {
    if (!clinicToken) return;

    try {
      const response = await axios.get(
        `${baseUrl}api/v1/auth/clinic/staff-salaries/${clinicId}?month=${selectedSalaryMonth}&year=${selectedSalaryYear}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        },
      );
      if (response.data.success) {
        const transformedSalaries = (response.data.data || []).map(
          (salary: any) => ({
            ...salary,
            id: Date.now() + Math.random() + (salary._id || ""),
          }),
        );
        setSalaryList(transformedSalaries);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    }
  };

  const fetchExpenses = async () => {
    if (!clinicToken) return;

    try {
      const response = await axios.get(`${baseUrl}api/v1/expense/monthly`, {
        headers: {
          Authorization: `Bearer ${clinicToken}`,
        },
      });
      if (response.data.success) {
        const transformedExpenses = (response.data.data || []).map(
          (exp: any) => ({
            ...exp,
            id: Date.now() + Math.random() + (exp._id || ""),
          }),
        );
        setExpenseList(transformedExpenses);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchStaffData = async (): Promise<void> => {
    if (!clinicId || !clinicToken) return;

    setIsLoadingStaff(true);
    try {
      const res = await axios.get<StaffDataResponse>(
        `${baseUrl}api/v1/auth/clinic/all-staffs/${clinicId}`,
        {
          headers: {
            Authorization: `Bearer ${clinicToken}`,
          },
        },
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

      setAllStaffList(flattenedStaff || []);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch staff data");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Update dashboard when view changes
  useEffect(() => {
    fetchDashboardData();
  }, [revenueView, selectedMonth, selectedYear, clinicId, clinicToken]);

  // Initial data fetch
  useEffect(() => {
    if (clinicId && clinicToken) {
      fetchStaffData();
      fetchSalaries();
      fetchExpenses();
      fetchExpenseDetails(selectedExpenseMonth, selectedExpenseYear);
    }
  }, [clinicId, clinicToken]);

  const totalSalaryAmount = (salaryList || []).reduce(
    (total, item) => total + (item?.salaryAmount || 0),
    0,
  );
  const totalExpenseAmountCalc = (expenseDetails || []).reduce(
    (total, item) => total + (item?.amount || 0),
    0,
  );
  console.log("de",expenseDetails);
  
  return (
    <div className="space-y-6">
      {/* Salary Details Modal */}
      <SalaryDetailsModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        salaryDetails={salaryDetails}
        selectedMonth={selectedSalaryMonth}
        selectedYear={selectedSalaryYear}
        isLoading={isLoadingSalaryDetails}
        onMonthChange={(month) => {
          setSelectedSalaryMonth(month);
          fetchSalaryDetails(month, selectedSalaryYear);
        }}
        onYearChange={(year) => {
          setSelectedSalaryYear(year);
          fetchSalaryDetails(selectedSalaryMonth, year);
        }}
        onRefresh={() =>
          fetchSalaryDetails(selectedSalaryMonth, selectedSalaryYear)
        }
      />

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseDetails={expenseDetails}
        selectedMonth={selectedExpenseMonth}
        selectedYear={selectedExpenseYear}
        isLoading={isLoadingExpenseDetails}
        totalAmount={totalExpenseAmount}
        onMonthChange={(month) => {
          setSelectedExpenseMonth(month);
          fetchExpenseDetails(month, selectedExpenseYear);
        }}
        onYearChange={(year) => {
          setSelectedExpenseYear(year);
          fetchExpenseDetails(selectedExpenseMonth, year);
        }}
        onRefresh={() =>
          fetchExpenseDetails(selectedExpenseMonth, selectedExpenseYear)
        }
      />

      {/* Header with navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Financial Dashboard</h2>
          <p className="text-muted-foreground">
            {dashboardData ? (
              <>
                {dashboardData.view === "yearly"
                  ? `Year ${dashboardData.period?.year || "N/A"} Overview`
                  : `${dashboardData.period?.startDate ? new Date(dashboardData.period.startDate).toLocaleString("default", { month: "long" }) : "Month"} ${dashboardData.period?.year || ""} Overview`}
              </>
            ) : (
              "Financial Overview"
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
                      $
                      {(
                        dashboardData?.summary?.totalIncome?.amount || 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        Billing: $
                        {dashboardData?.summary?.totalIncome?.breakdown
                          ?.billingIncome || 0}
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
                      $
                      {(
                        dashboardData?.summary?.outstandingDues?.amount || 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      <span className="text-xs text-destructive">
                        Billing: $
                        {dashboardData?.summary?.outstandingDues?.breakdown
                          ?.billingOutstanding || 0}
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
                      $
                      {(
                        dashboardData?.summary?.pettyCash || 0
                      ).toLocaleString()}
                    </p>
                    <Progress
                      value={dashboardData?.summary?.pettyCash ? 45 : 0}
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
                      $
                      {(
                        dashboardData?.summary?.totalExpenses?.amount || 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-orange-600" />
                      <span className="text-xs text-orange-600">
                        Salary: $
                        {dashboardData?.summary?.totalExpenses?.breakdown
                          ?.salaryExpenses || 0}
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
                      $
                      {(
                        dashboardData?.summary?.netProfit || 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        Margin: {dashboardData?.summary?.profitMargin || "0"}%
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
                    variant={revenueView === "yearly" ? "default" : "outline"}
                    onClick={() => setRevenueView("yearly")}
                  >
                    Yearly
                  </Button>
                  <Button
                    size="sm"
                    variant={revenueView === "monthly" ? "default" : "outline"}
                    onClick={() => setRevenueView("monthly")}
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
                  ) : revenueData && revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey={revenueView === "yearly" ? "month" : "day"}
                        />
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
                  ) : expenseChartData && expenseChartData.length > 0 ? (
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
                  {expenseChartData &&
                    expenseChartData.map((item, index) => (
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
                          ${(item.value || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Page: Amounts */}
      {currentPage === "amounts" && (
        <div className="space-y-8">
          {/* Summary Totals Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card from-primary/5 to-transparent">
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
                      {(salaryList || []).length} employee
                      {(salaryList || []).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card from-orange-500/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" /> Total Expenses
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      ${totalExpenseAmountCalc.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {(expenseList || []).length} expense
                      {(expenseList || []).length !== 1 ? "s" : ""}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle>Salary Management</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
                    Schema: Salary
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchSalaryDetails(selectedSalaryMonth, selectedSalaryYear)
                  }
                  className="flex items-center gap-2 hover:bg-primary/10"
                >
                  <Eye className="w-4 h-4" />
                  View Salary Details
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Add staff salaries with role, amount, month, and notes
              </p>
            </CardHeader>
            <CardContent className="pt-6">
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
                      const selectedStaff = (allStaffList || []).find(
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

                    {[
                      "accountant",
                      "nurse",
                      "pharmacist",
                      "receptionist",
                      "technician",
                    ].map((role) => {
                      const staffInRole = (allStaffList || []).filter(
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
                    style={{marginTop: "1.8rem"}}
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
            </CardContent>
          </Card>

          {/* Expense Management Card */}
          <Card className="border-2 border-orange-500/20">
            <CardHeader className="bg-orange-500/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                  <CardTitle>Expense Management</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    // fetchExpenseDetails(
                    //   selectedExpenseMonth,
                    //   selectedExpenseYear,
                    // )
                    fetchDetailExpense()
                  }
                  className="flex items-center gap-2 hover:bg-orange-500/10"
                >
                  <Eye className="w-4 h-4" />
                  View Expense Details
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Add expenses with category, amount, date, and notes
              </p>
            </CardHeader>
            <CardContent className="pt-6">
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
                      setExpenseInput({
                        ...expenseInput,
                        paymentDate: e.target.value,
                      })
                    }
                    disabled={isSubmittingExpense}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: YYYY-MM-DD
                  </p>
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
                    className="w-full bg-primary hover:bg-primary/90"
                    style={{marginTop: "1.8rem"}}
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}