import { useState } from "react";
import { DashboardSidebar } from "./components/admin/pages/dashboard-sidebar";
import { OverviewDashboard } from "./components/admin/pages/overview-dashboard";
import { AppointmentsOverview } from "./components/admin/pages/appointments-overview";
import { FinancialDashboard } from "./components/admin/pages/financial-dashboard";
import { InventoryTracker } from "./components/admin/pages/inventory-tracker";
import { MarketplaceTab } from "./components/admin/pages/marketplace-tab";
import { useClinicTheme } from "./hooks/UseClinicTheme";
import LoginPage from "./components/LoginPage/LoginPage";
import LabOrdersPage from "./components/admin/pages/Laborders-dashboard";
import DoctorPage from "./components/admin/pages/doctor-dashboard";
import SettingsPage from "./components/admin/pages/settings-sidebar";
import AdminLayout from "./components/admin/AdminLayout";
import ReceptionistLayout from "./components/receptionist/ReceptionistLayout";
import Dashboard from "./components/receptionist/pages/Dashboard";
import StaffRegistration from "./components/admin/pages/staff-dashboard";
import PatientManagement from "./components/receptionist/pages/PatientManagement"
import AppointmentScheduler from "./components/receptionist/pages/AppointmentScheduler"
import QueueManagement from "./components/receptionist/pages/QueueManagement"
import Billing from "./components/receptionist/pages/Billing"
import DoctorAllocation from "./components/receptionist/pages/DoctorAllocation"

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import Cart from "./components/admin/pages/Cart";
import { persistor } from "./redux/persistor";
import Patients from "./components/admin/pages/patient-dashboard";
import Receptionist from "./components/receptionist/pages/Dashboard";
// Placeholder components for other tabs
function StaffPayroll() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Staff & Payroll Management</h2>
      <p className="text-muted-foreground">
        Manage staff schedules, payroll, and HR tasks
      </p>
      <div className="p-8 text-center bg-muted/30 rounded-lg">
        <p>Staff & Payroll management module coming soon...</p>
      </div>
    </div>
  );
}

function Notifications() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Notifications & Alerts</h2>
      <p className="text-muted-foreground">
        Manage clinic notifications and alerts
      </p>
      <div className="p-8 text-center bg-muted/30 rounded-lg">
        <p>Notifications management module coming soon...</p>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { clinicId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  useClinicTheme(clinicId);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewDashboard />;
      case "appointments":
        return <AppointmentsOverview />;
      case "financial":
        return <FinancialDashboard />;
      case "staff":
        return <StaffRegistration />;
      case "inventory":
        return <InventoryTracker />;
      case "lab":
        return <LabOrdersPage />;
      case "patients":
        return <Patients />;
      case "notifications":
        return <Notifications />;
      case "marketplace":
        return <MarketplaceTab />;
      case "settings":
        return <SettingsPage />;
      case "doctoronboard":
        return <DoctorPage />;
      case "cart":
        return <Cart />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <main
        className="flex-1 overflow-auto  "
        style={{
          background: `
      radial-gradient(at 0% 0%, rgba(238, 174, 202, 0.4) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(147, 197, 253, 0.4) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(253, 186, 116, 0.2) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(233, 213, 255, 0.5) 0px, transparent 50%),
      linear-gradient(to bottom right, #f8fafc, #f1f5f9)
    `,
        }}
      >
        <div className="p-6 max-w-7xl mx-auto ">{renderContent()}</div>
      </main>
    </div>
  );
}
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard/:clinicId" element={<AdminLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewDashboard />} />
              <Route path="appointments" element={<AppointmentsOverview />} />
              <Route path="financial" element={<FinancialDashboard />} />
              <Route path="inventory" element={<InventoryTracker />} />
              <Route path="marketplace" element={<MarketplaceTab />} />
              <Route path="lab" element={<LabOrdersPage />} />
              <Route path="patients" element={<Patients />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="doctoronboard" element={<DoctorPage />} />
              <Route path="cart" element={<Cart />} />
              <Route path="staff" element={<StaffRegistration/>}/>
            </Route>
            <Route
              path="/receptionist"
              element={<ReceptionistLayout />}
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients" element={<PatientManagement />} />
              <Route path="appointments" element={<AppointmentScheduler />} />
              <Route path="queue" element={<QueueManagement />} />
              <Route path="billing" element={<Billing />} />
              <Route path="doctors" element={<DoctorAllocation />} />
              {/* <Route path="notifications" element={<NotificationCenter />} /> */}
              {/* <Route path="chat" element={<InternalChat />} /> */}
            </Route>
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}
