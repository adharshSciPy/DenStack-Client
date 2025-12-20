import { Outlet, useParams } from "react-router-dom";
import  {DashboardSidebar}  from "../../components/admin/pages/dashboard-sidebar";
import { useClinicTheme } from "../../hooks/UseClinicTheme";

export default function AdminLayout() {
  const { clinicId } = useParams();
  useClinicTheme(clinicId);

  return (
    <div className="flex h-screen bg-background">
      {/* LEFT SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <main
        className="flex-1 overflow-auto"
        style={{
          background: `
            radial-gradient(at 0% 0%, rgba(238, 174, 202, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(147, 197, 253, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(253, 186, 116, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(233, 213, 255, 0.5) 0px, transparent 50%),
            linear-gradient(to bottom right, #f8fafc, #f1f5f9)
          `
        }}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
