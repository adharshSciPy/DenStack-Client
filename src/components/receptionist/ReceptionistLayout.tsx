// ReceptionistLayout.tsx
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Clock,
  DollarSign,
  UserCog,
  LogOut,
} from "lucide-react";
import { useAppSelector } from "../../redux/hook";
import styles from "./styles/Receptionistlayout.module.css";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slice/authSlice.js";


interface ReceptionistUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  clinicId: string;
  role: string;
  clinicData?: ClinicData;
}

interface ClinicData {
  _id: string;
  name: string;
  phoneNumber: number;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  theme: {
    startColor: string;
    endColor: string;
  };
  subscription: {
    package: string;
    type: string;
    price: number;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    isActive: boolean;
  };
}

export default function ReceptionistLayout() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
    dispatch(logout());
  };

  const reception = useAppSelector(
    (state) => state.auth.user
  ) as ReceptionistUser | null;

  console.log("rea", reception);

  const initials = reception?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("");

  const tabs = [
    { path: "dashboard", label: "Dashboard", icon: Home },
    { path: "patients", label: "Patients", icon: Users },
    { path: "appointments", label: "Appointments", icon: Calendar },
    // { path: "queue", label: "Queue", icon: Clock },
    { path: "billing", label: "Billing", icon: DollarSign },
    { path: "doctors", label: "Doctors", icon: UserCog },
  ];

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>
              {reception?.clinicData?.name} Receptionist
            </h1>
            <p className={styles.headerSubtitle}></p>
          </div>

          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{reception?.name}</p>
              <p className={styles.userRole}>Receptionist</p>
            </div>

            <div className={styles.avatar}>{initials}</div>

            {/* 🔴 Logout Button */}
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut />
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <div className={styles.tabsContainer}>
            {tabs.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `${styles.tab} ${
                    isActive ? styles.tabActive : styles.tabInactive
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
