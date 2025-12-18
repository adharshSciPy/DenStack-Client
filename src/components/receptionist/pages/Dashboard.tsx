import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  MessageSquare,
  TrendingUp,
  Activity,
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

  // ---------- All State Hooks MUST be top-level (not inside any function) -----------

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

  // ------------------- Static UI Data -------------------

  const stats = [
    {
      label: "Today's Appointments",
      value: fullStatus.totalAppointments,
      change: "+12%",
      icon: Calendar,
      iconWrapperClass: styles.iconWrapperBlue,
      iconClass: styles.iconBlue,
    },
    {
      label: "In Queue",
      value: fullStatus.pendingAppointments,
      change: "Live",
      icon: Clock,
      iconWrapperClass: styles.iconWrapperOrange,
      iconClass: styles.iconOrange,
    },
    {
      label: "Completed",
      value: fullStatus.completedAppointments,
      change: "+8%",
      icon: Activity,
      iconWrapperClass: styles.iconWrapperGreen,
      iconClass: styles.iconGreen,
    },
    {
      label: "Today's Revenue",
      value: "₹24,850",
      change: "+18%",
      icon: DollarSign,
      iconWrapperClass: styles.iconWrapperPurple,
      iconClass: styles.iconPurple,
    },
  ];

  const appointmentBreakdown = [
    { status: "Scheduled", count: fullStatus.pendingAppointments, color: "#3B82F6" },
    { status: "Completed", count: fullStatus.completedAppointments, color: "#10B981" },
    { status: "Cancelled", count: fullStatus.cancelledAppointments, color: "#EF4444" },
  ];

  const dailyFootfall = [
    { time: "9 AM", patients: 5 },
    { time: "10 AM", patients: 8 },
    { time: "11 AM", patients: 12 },
    { time: "12 PM", patients: 9 },
    { time: "1 PM", patients: 4 },
    { time: "2 PM", patients: 7 },
    { time: "3 PM", patients: 10 },
    { time: "4 PM", patients: 6 },
  ];

  const patientTypes = [
    { name: "New Patients", value: 18, color: "#3B82F6" },
    { name: "Returning", value: 29, color: "#06B6D4" },
  ];

  const revenueData = [
    { category: "Consultation", amount: 15000 },
    { category: "Procedures", amount: 6500 },
    { category: "Lab Tests", amount: 2850 },
    { category: "Medicine", amount: 500 },
  ];

  // ------------------- UI RENDER -------------------

  return (
    <div className={styles.dashboard}>

      {/* WELCOME CARD */}
      <div className={styles.welcomeCard}>
        <h2 className={styles.welcomeTitle}>Good Afternoon, {reception?.name} 👋</h2>
        <p className={styles.welcomeText}>
          {fullStatus.pendingAppointments} patients waiting and {fullStatus.totalAppointments} appointments today.
        </p>
      </div>

      {/* QUICK STATS */}
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={styles.statCard}>
              <div className={styles.statHeader}>
                <div className={`${styles.iconWrapper} ${stat.iconWrapperClass}`}>
                  <Icon className={stat.iconClass} />
                </div>
                <span className={`${styles.changeBadge} ${stat.iconClass}`}>
                  {stat.change}
                </span>
              </div>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* APPOINTMENT BREAKDOWN */}
      <div className={styles.twoColumnGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Today's Appointments</h3>
          <div className={styles.breakdownList}>
            {appointmentBreakdown.map((item, index) => (
              <div key={index} className={styles.breakdownItem}>
                <div className={styles.breakdownLeft}>
                  <div 
                    className={styles.statusDot} 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className={styles.breakdownLabel}>{item.status}</span>
                </div>
                <span className={styles.breakdownCount}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PATIENT DISTRIBUTION */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Patient Distribution</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {patientTypes.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FOOTFALL AND REVENUE */}
      <div className={styles.twoColumnGrid}>
        {/* DAILY FOOTFALL */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <TrendingUp className={`${styles.chartIcon} ${styles.chartIconBlue}`} /> 
            Daily Footfall
          </h3>
          <div className={styles.chartContainerLarge}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyFootfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REVENUE BREAKDOWN */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <DollarSign className={`${styles.chartIcon} ${styles.chartIconGreen}`} /> 
            Revenue Breakdown
          </h3>
          <div className={styles.chartContainerLarge}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="category" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}