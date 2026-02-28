import { Outlet, useParams } from "react-router-dom";
import { DashboardSidebar } from "../../components/admin/pages/dashboard-sidebar";
import { useClinicTheme } from "../../hooks/useClinicTheme";

export default function AdminLayout() {
  const { clinicId } = useParams();
  useClinicTheme(clinicId);
  
  return (
    <div className="flex h-screen relative" style={{ background: "var(--clinic-bg)" }}>
      {/* 🔥 DYNAMIC BACKGROUND */}
      <div
        className="absolute inset-0 -z-10"
        
      />

      {/* LEFT SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <main
        className="flex-1 overflow-auto h-full"
        style={{ color: "var(--clinic-text)" }}
      >
        <div className="p-6 w-full min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}