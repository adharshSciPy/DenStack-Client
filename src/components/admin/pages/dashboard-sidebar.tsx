import { useEffect, useState } from "react";
import { persistor } from "../../../redux/persistor.js";
import {
  Calendar,
  DollarSign,
  Users,
  Package,
  FlaskConical,
  FileText,
  Bell,
  Settings,
  ShoppingCart,
  Activity,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { Button } from "../../ui/button.js";
import { Badge } from "../../ui/badge.js";
import axios from "axios";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl.js";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import baseUrl from "../../../baseUrl.js";
import { useDispatch } from "react-redux";
import { clearCart } from "../../../redux/slice/cartSlice.js";
import { logout } from "../../../redux/slice/authSlice.js";
import { useAppSelector } from "../../../redux/hook.js";
import clinicInventoryBaseUrl from "../../../clinicInventoryBaseUrl.js";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [clinic, setClinic] = useState<{ name: string } | null>(null);
  const [inventoryCount, setInventoryCount] = useState(0);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { clinicId } = useParams();
  const cartItem = useAppSelector((state) => state.cart.items);

  // Fetch appointment counts
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get(
          `${patientServiceBaseUrl}/api/v1/patient-service/appointment/clinic-appointments/${clinicId}`
        );
        setAppointmentCount(res.data?.totalAppointments || 0);
      } catch {}
    };
    if (clinicId) fetchAppointments();
  }, [clinicId]);

  // Fetch clinic + inventory
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clinicRes = await axios.get(
          `${baseUrl}api/v1/auth/clinic/view-clinic/${clinicId}`
        );
        setClinic(clinicRes.data.data);

        const inventoryRes = await axios.get(
          `${clinicInventoryBaseUrl}/api/v1/clinicInventory/products/low-stock/${clinicId}`
        );
        setInventoryCount(inventoryRes.data.count);
      } catch {}
    };

    if (clinicId) fetchData();
  }, [clinicId]);

  const handleLogout = async () => {
    await persistor.purge();
    localStorage.clear();
    sessionStorage.clear();
    dispatch(clearCart());
    dispatch(logout());
    navigate("/")
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: appointmentCount },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "staff", label: "Staff", icon: Users },
    { id: "inventory", label: "Inventory", icon: Package, badge: inventoryCount },
    { id: "lab", label: "Lab Orders", icon: FlaskConical },
    { id: "patients", label: "Patient", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
    { id: "doctoronboard", label: "Doctor", icon: Stethoscope },
    { id: "cart", label: "Cart", icon: ShoppingCart, badge: cartItem.length },
    { id: "subclinic", label: "SubClinic", icon: Home },
    { id: "settings", label: "Settings", icon: Settings },

  ];

  return (
    <div
      className={`bg-white border-r h-full flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{ overflow: "scroll", scrollbarWidth: "none" }}
    >
      {/* HEADER */}
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-primary">ClinicCare</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 h-auto"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-2 space-y-1" style={{overflow:"scroll",scrollbarWidth:"none"}}>
        {menuItems.map(({ id, label, icon: Icon, badge }) => (
          <NavLink
            key={id}
            to={`/dashboard/${clinicId}/${id}`}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${isActive ? "text-white" : "hover:bg-muted hover:text-primary"}`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: `
                      radial-gradient(at 0% 0%, rgba(238, 174, 202, 0.4) 0px, transparent 50%),
                      radial-gradient(at 100% 0%, rgba(147, 197, 253, 0.4) 0px, transparent 50%),
                      radial-gradient(at 100% 100%, rgba(253, 186, 116, 0.2) 0px, transparent 50%),
                      radial-gradient(at 0% 50%, rgba(233, 213, 255, 0.5) 0px, transparent 50%),
                      linear-gradient(to bottom right, #f8fafc, #f1f5f9)
                    `,
                  }
                : {}
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />

            {/* Hide text if collapsed */}
            {!collapsed && (
              <>
                <span className="text-sm">{label}</span>
                {badge ? (
                  <Badge className="ml-auto bg-white text-primary">{badge}</Badge>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* USER SECTION */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              {clinic?.name ? clinic.name[0] : "U"}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Welcome</p>
              <p className="text-sm">{clinic?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
