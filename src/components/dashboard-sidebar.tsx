import { useEffect, useState } from "react";
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
  Home,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import axios from "axios";
import  patientServiceBaseUrl  from "../patientServiceBaseUrl.js";
import { useParams } from "react-router-dom";
import baseUrl from "../baseUrl.js";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}
interface Clinic {
  id: string;
  name: string; 
  address: string;
  contactNumber: string;
  email: string;
  // Add other relevant fields as needed
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  const { clinicId } = useParams();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get(
          `${patientServiceBaseUrl}/api/v1/patient-service/appointment/clinic-appointments/${clinicId}`
        );

        // Assuming API returns an array of appointments in response.data.data
        const appointments = response.data?.data || [];
        setAppointmentCount(appointments.length); // Dynamic badge count
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    if (clinicId) {
      fetchAppointments();
    }
  }, [clinicId]);

 useEffect(() => {
    const fetchClinicDetails = async () => {
      try {
        const response = await axios.get(`${baseUrl}api/v1/auth/clinic/view-clinic/${clinicId}`);
        const clinicData = response.data.data;
        setClinic(clinicData);
        console.log("Clinic Details:", clinicData);
      } catch (error) {
        console.error("Error fetching clinic details:", error);
      }
    };

    if (clinicId) {
      fetchClinicDetails();
    }
  }, [clinicId]);
   const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 16) return "Good Afternoon";
    if (hour >= 16 && hour < 20) return "Good Evening";
    return "Good Night";
  };
  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: appointmentCount },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "staff", label: "Staff", icon: Users },
    { id: "inventory", label: "Inventory", icon: Package, badge: 3 },
    { id: "lab", label: "Lab Orders", icon: FlaskConical, badge: 7 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 5 },
    { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
    { id: "doctoronboard", label: "Doctor", icon: Stethoscope },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={`bg-white border-r border-border h-full flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
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
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white"
                  : "hover:bg-muted hover:text-primary"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm">{item.label}</span>
                  {item.badge ? (
                    <Badge
                      variant="secondary"
                      className={`ml-auto ${
                        isActive ? "bg-white text-primary" : "bg-secondary"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      {!collapsed && (  
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-sm text-secondary-foreground"> {clinic?.name ? clinic.name[0].toUpperCase() : "D"}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{getGreeting()}</p>
              <p className="text-sm">{clinic?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
