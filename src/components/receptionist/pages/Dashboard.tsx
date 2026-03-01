import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  MessageSquare,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useAppSelector } from "../../../redux/hook";
import { useEffect, useState } from "react";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import axios from "axios";
import styles from "../styles/dashboard.module.css";

// ------------------- Types -------------------

interface ClinicData {
  _id: string;
  name: string;
  phoneNumber: number;
  address: any;
  theme: {
    startColor: string;
    endColor: string;
  };
  subscription: any;
}

interface ReceptionistUser {
  id: string;
  name: string;
  clinicId: string;
  clinicData?: ClinicData;
}

interface FullStatus {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  tomorrowRescheduleCount?: number;
}

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  patientId: {
    _id: string;
    name: string;
    phone: number;
    email: string;
    patientUniqueId: string;
    age: number;
  };
}

// ------------------- Component -------------------

export default function Dashboard() {
  const reception = useAppSelector((state) => state.auth.user) as ReceptionistUser | null;
  const clinicId = reception?.clinicData?._id || "";

  // ---------- All State Hooks -----------
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [showingRange, setShowingRange] = useState("");
  const [missingOps, setMissingOps] = useState<any[]>([]);
  const [fullStatus, setFullStatus] = useState<FullStatus>({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
  });

  const LIMIT = 15;

  // ------------------- Fetch Appointments -------------------
  const fetchAppointments = async (
    cursor: string | null = null,
    query = "",
    date = ""
  ) => {
    if (!clinicId) return;

    try {
      setLoading(true);

      const response = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/clinic-appointments/${clinicId}`,
        {
          params: {
            search: query || undefined,
            startDate: date || undefined,
            lastId: cursor || undefined,
            limit: LIMIT,
          },
        }
      );

      const data = response.data || {};
      console.log(data);
      
      setAppointments(data.data || []);
      setNextCursor(data.nextCursor || null);
      setTotalAppointments(data.totalAppointments || 0);
      setMissingOps(data.missingOps || []);

      // Stats
      const stats = data.stats || {};
      setFullStatus({
        totalAppointments: stats.totalAppointments || data.totalAppointments || 0,
        completedAppointments: stats.completedCount || 0,
        pendingAppointments: stats.scheduledCount || 0,
        cancelledAppointments: stats.cancelledCount || 0,
        tomorrowRescheduleCount: data.tomorrowRescheduleCount || 0,
      });

      // Showing range
      const start = cursor ? currentPageIndex * LIMIT + 1 : 1;
      const end = start + (data.data?.length || 0) - 1;
      setShowingRange(`${start}-${end} of ${data.totalAppointments || 0}`);

      // Pagination cursor saving
      if (cursor !== null) {
        setPageCursors((prev) => [...prev, cursor]);
        setCurrentPageIndex((prev) => prev + 1);
      }

    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Initial Fetch -------------------
  useEffect(() => {
    if (clinicId) {
      fetchAppointments(null);
    }
  }, [clinicId]);

  // ------------------- Stats Data -------------------
  const stats = [
    {
      label: "Today's Total",
      value: fullStatus.totalAppointments,
      change: "+12%",
      icon: Calendar,
      iconWrapperClass: styles.iconWrapperBlue,
      iconClass: styles.iconBlue,
    },
    {
      label: "In Queue",
      value: fullStatus.pendingAppointments,
      change: "Active",
      icon: Clock3,
      iconWrapperClass: styles.iconWrapperOrange,
      iconClass: styles.iconOrange,
    },
    {
      label: "Completed",
      value: fullStatus.completedAppointments,
      change: "+8%",
      icon: CheckCircle,
      iconWrapperClass: styles.iconWrapperGreen,
      iconClass: styles.iconGreen,
    },
    {
      label: "Cancelled",
      value: fullStatus.cancelledAppointments,
      change: "-2%",
      icon: XCircle,
      iconWrapperClass: styles.iconWrapperRed,
      iconClass: styles.iconRed,
    },
  ];

  const appointmentBreakdown = [
    { status: "Scheduled", count: fullStatus.pendingAppointments, color: "#3B82F6" },
    { status: "Completed", count: fullStatus.completedAppointments, color: "#10B981" },
    { status: "Cancelled", count: fullStatus.cancelledAppointments, color: "#EF4444" },
  ];

  // ------------------- Recent Appointments -------------------
  const recentAppointments = appointments.slice(0, 5);

  // ------------------- UI RENDER -------------------
  return (
    <div className={`${styles.dashboard} bg-card`}>
      {/* HEADER SECTION */}
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Overview</h1>
          <p className={styles.pageSubtitle}>
            Welcome back, {reception?.name || 'User'}! Here's what's happening today.
          </p>
        </div>
        {/* <button className={styles.createButton}>
          <Plus size={20} />
          <span>New Appointment</span>
        </button> */}
      </div>

      {/* WELCOME CARD */}
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeContent}>
          <div>
            <h2 className={styles.welcomeTitle}>
              Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {reception?.name} 👋
            </h2>
            <p className={styles.welcomeText}>
              You have {fullStatus.pendingAppointments} patients waiting and {fullStatus.completedAppointments} completed appointments today.
            </p>
          </div>
          <div className={styles.welcomeStats}>
            <div className={styles.welcomeStat}>
              <span className={styles.welcomeStatValue}>{fullStatus.totalAppointments}</span>
              <span className={styles.welcomeStatLabel}>Total Today</span>
            </div>
            <div className={styles.welcomeStatDivider}></div>
            <div className={styles.welcomeStat}>
              <span className={styles.welcomeStatValue}>{fullStatus.pendingAppointments}</span>
              <span className={styles.welcomeStatLabel}>Waiting</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS GRID */}
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIconWrapper}>
                <div className={`${styles.iconWrapper} ${stat.iconWrapperClass}`}>
                  <Icon className={stat.iconClass} />
                </div>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
                <span className={`${styles.statChange} ${stat.iconClass}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className={styles.mainGrid}>
        {/* LEFT COLUMN - Charts and Breakdown */}
        <div className={styles.leftColumn}>
          {/* APPOINTMENT BREAKDOWN */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Appointment Status</h3>
              <span className={styles.cardBadge}>Today</span>
            </div>
            <div className={styles.breakdownContainer}>
              {appointmentBreakdown.map((item, index) => (
                <div key={index} className={styles.breakdownItem}>
                  <div className={styles.breakdownInfo}>
                    <div className={styles.breakdownLeft}>
                      <div 
                        className={styles.statusDot} 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={styles.breakdownLabel}>{item.status}</span>
                    </div>
                    <span className={styles.breakdownCount}>{item.count}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${(item.count / (fullStatus.totalAppointments || 1)) * 100}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PIE CHART */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Appointment Distribution</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={appointmentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {appointmentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Recent Appointments */}
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Appointments</h3>
            </div>
            <div className={styles.appointmentsList}>
              {loading ? (
                <div className={styles.loadingState}>Loading appointments...</div>
              ) : recentAppointments.length > 0 ? (
                recentAppointments.map((appointment) => (
                  <div key={appointment._id} className={styles.appointmentItem}>
                    <div className={styles.appointmentTime}>
                      <Clock size={14} />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <span className={styles.patientName}>
                        {appointment.patientId?.name || 'Unknown Patient'}
                      </span>
                      <span className={styles.patientId}>
                        ID: {appointment.patientId?.patientUniqueId || 'N/A'}
                      </span>
                    </div>
                    <div className={styles.appointmentStatus}>
                      <span className={`${styles.statusBadge} ${styles[appointment.status?.toLowerCase() || 'pending']}`}>
                        {appointment.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No appointments found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}