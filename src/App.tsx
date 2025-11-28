import {  useState } from "react";
import { DashboardSidebar } from "./components/dashboard-sidebar";
import { OverviewDashboard } from "./components/overview-dashboard";
import { AppointmentsOverview } from "./components/appointments-overview";
import { FinancialDashboard } from "./components/financial-dashboard";
import {InventoryTracker} from "./components/inventory-tracker";
import { MarketplaceTab } from "./components/marketplace-tab";
import { useClinicTheme } from "./hooks/UseClinicTheme";
import LoginPage from "./components/LoginPage/LoginPage";
import LabOrdersPage from "./components/Laborders-dashboard";
import DoctorPage from "./components/doctor-dashboard"
import SettingsPage from "./components/settings-sidebar";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import StaffRegistration from "./components/staff-dashboard";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import Cart from "./components/Cart";
import { persistor } from "./redux/persistor";
import Patients from "./components/patient-dashboard";
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



// function Reports() {
//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl">Reports & Exports</h2>
//       <p className="text-muted-foreground">
//         Generate and export clinic reports
//       </p>
//       <div className="p-8 text-center bg-muted/30 rounded-lg">
//         <p>Reports & exports module coming soon...</p>
//       </div>
//     </div>
//   );
// }

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
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto  bg-primary-gradient">
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/:clinicId" element={<DashboardLayout />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="cart" element={<Cart/>} />
      </Routes>
    </Router>
    </PersistGate>
   
    </Provider>
  );
}