import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Package,
  TrendingUp,
  Settings,
  Calendar,
  FileText,
  LogOut,
  Bell,
  Building2,
  ShoppingCart,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number | null;
}

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      icon: Activity,
      label: "Dashboard",
      path: "/labadmin/dashboard",
    },
    {
      id: "orders",
      icon: Package,
      label: "Orders",
      path: "orders",
      badge: 12,
    },
    {
      id: "revenue",
      icon: TrendingUp,
      label: "Revenue",
      path: "/labadmin/revenue",
    },
    {
      id: "vendors",
      icon: Building2,
      label: "Vendors",
      path: "/labadmin/vendors",
    },
    {
      id: "calendar",
      icon: Calendar,
      label: "Calendar",
      path: "/labadmin/calendar",
    },
    {
      id: "reports",
      icon: FileText,
      label: "Reports",
      path: "/labadmin/reports",
    },
    {
      id: "marketplace",
      icon: ShoppingCart,
      label: "Marketplace",
      path: "/labadmin/marketplace",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      path: "/labadmin/settings",
    },
  ];

  return (
    <aside className="w-64 border-r bg-white/80 backdrop-blur-sm h-[calc(100vh-76px)] sticky top-16">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const active = activeTab === item.id;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              className={({ isActive }) =>
                `
      flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all group
      ${
        isActive
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-100 shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }
    `
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>

              {item.badge && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Notifications */}
        <button className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </div>
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
            3
          </span>
        </button>

        {/* Logout */}
        <div className="pt-4 mt-4 border-t">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Navigation;
