import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Package,
  DollarSign,
  LogOut,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number | null;
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();

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
      path: "/labadmin/orders",
    },
    {
      id: "revenue",
      icon: DollarSign,
      label: "Accounts",
      path: "/labadmin/revenue",
    },
    {
      id: "inventory",
      icon: Package,
      label: "Inventory",
      path: "/labadmin/inventory",
    },
  ];

  return (
    <aside
      className="border-r bg-white/80 backdrop-blur-sm h-full"
      style={{
        position: "fixed",
        width: "20%",
        height: "calc(100vh - 80px)",
      }}
    >
      <nav className="p-4 space-y-1 h-full overflow-y-auto mt-5">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `
              flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all
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
        ))}

        {/* Logout */}
        <div className="pt-4 mt-4 border-t">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Navigation;
