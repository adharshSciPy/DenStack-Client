import { Outlet, useParams } from "react-router-dom";
import { DashboardSidebar } from "../../components/admin/pages/dashboard-sidebar";
import { useClinicTheme } from "../../hooks/UseClinicTheme";

export default function AdminLayout() {
  const { clinicId } = useParams();
  useClinicTheme(clinicId);

  return (
    <div className="flex h-screen bg-background">
      {/* LEFT SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      {/* <main
  className="flex-1 overflow-auto "
  style={{
    background: `
      radial-gradient(1400px at 15% 10%, rgba(34, 211, 238, 0.55), transparent 45%),
      radial-gradient(1200px at 85% 15%, rgba(52, 211, 153, 0.55), transparent 45%),
      radial-gradient(1000px at 50% 90%, rgba(16, 185, 129, 0.45), transparent 50%),
      linear-gradient(135deg, #0ea5a8 0%, #10b981 45%, #22d3ee 100%)
    `
  }}
> */}
      <main
        className="flex-1 overflow-auto h-full"
        style={{
          background: `
      radial-gradient(1400px at 10% 15%, rgba(236, 72, 153, 0.65), transparent 45%),
      radial-gradient(1200px at 85% 20%, rgba(168, 85, 247, 0.55), transparent 45%),
      radial-gradient(1000px at 90% 80%, rgba(96, 165, 250, 0.55), transparent 50%),
      linear-gradient(135deg, #ec4899 0%, #a855f7 45%, #60a5fa 100%)
    `,
        }}
      >
        <div className="p-6 w-full min-h-full text-white">
          <Outlet />
        </div>
      </main>
    </div>
  );
}