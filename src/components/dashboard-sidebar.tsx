import { useState } from "react";
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
  Stethoscope
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const menuItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "appointments", label: "Appointments", icon: Calendar, badge: 12 },
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

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

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
              style={{
                background: isActive
                  ? "var(--primary-gradient)"
                  : "transparent",
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:text-primary)`}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--sidebar-foreground)";          
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm">{item.label}</span>
                  {item.badge && !isActive && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-secondary text-secondary-foreground"
                    >
                      {item.badge}
                    </Badge>
                  )}
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
              <span className="text-sm text-secondary-foreground">DR</span>
            </div>
            <div className="flex-1">
              <p className="text-sm">Dr. Sarah Wilson</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
