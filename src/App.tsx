import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store } from "./redux/store";
import { persistor } from "./redux/persistor";

// Pages
import LoginPage from "./components/LoginPage/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import {OverviewDashboard} from "./components/admin/pages/overview-dashboard";
import { AppointmentsOverview } from "./components/admin/pages/appointments-overview";
import {FinancialDashboard} from "./components/admin/pages/financial-dashboard";
import { InventoryTracker } from "./components/admin/pages/inventory-tracker";
import {MarketplaceTab} from "./components/admin/pages/marketplace-tab";
import LabOrdersPage from "./components/admin/pages/Laborders-dashboard";
import DoctorPage from "./components/admin/pages/doctor-dashboard";
import SettingsPage from "./components/admin/pages/settings-sidebar";
import StaffRegistration from "./components/admin/pages/staff-dashboard";
import Cart from "./components/admin/pages/Cart";
import Patients from "./components/admin/pages/patient-dashboard";
import ReviewsPageAdmin from "./components/admin/pages/ReviewListing";
// Receptionist
import ReceptionistLayout from "./components/receptionist/ReceptionistLayout";
import Dashboard from "./components/receptionist/pages/Dashboard";
import PatientManagement from "./components/receptionist/pages/PatientManagement";
import AppointmentScheduler from "./components/receptionist/pages/AppointmentScheduler";
import QueueManagement from "./components/receptionist/pages/QueueManagement";
import Billing from "./components/receptionist/pages/Billing";
import DoctorAllocation from "./components/receptionist/pages/DoctorAllocation";

// Dental Lab
import DentalLabLayout from "./components/dental-lab/DentalLabModule";
import LabDashboardPage from "./components/dental-lab/pages/DashboardPage";
import LabRevenuePage from "./components/dental-lab/pages/RevenuePage";
import SubClinic from "./components/admin/pages/SubClinic";
import { useAppSelector } from "./redux/hook";
import ReviewPage from "./components/receptionist/pages/ReviewPage";

interface PrivateRouteProps {
  element: React.ReactNode;
  allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, allowedRoles }) => {
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.userRole); 
  const isHybrid = useAppSelector((state) => state.auth.isHybrid);

  console.log("PrivateRoute - auth state:", { token, role, isHybrid });

  if (!token) return <Navigate to="/login" replace />;

  if (isHybrid || role === "760") {
   
    return <>{element}</>;
  }

  if (!allowedRoles.includes(role || "")) {
    console.warn(`Role ${role} not allowed for this route. Allowed:`, allowedRoles);
    return <Navigate to="/login" replace />;
  }

  return <>{element}</>;
};

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Routes>
            {/* Login */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard/:clinicId"
              element={
                <PrivateRoute
                  allowedRoles={["700", "760"]} 
                  element={<AdminLayout />}
                />
              }
            >
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
              <Route path="staff" element={<StaffRegistration />} />
              <Route path="subclinic" element={<SubClinic />} />
              <Route path="reviews" element={<ReviewsPageAdmin />} />
            </Route>

            {/* Admin (without clinicId) */}
            <Route
              path="/admin"
              element={
                <PrivateRoute
                  allowedRoles={["500", "760"]}
                  element={<AdminLayout />}
                />
              }
            >
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
              <Route path="staff" element={<StaffRegistration />} />
            </Route>

            {/* ---- RECEPTIONIST ROUTES ---- */}
            <Route
              path="/receptionist"
              element={
                <PrivateRoute
                  allowedRoles={["500", "nurse", "760"]}
                  element={<ReceptionistLayout />}
                />
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients" element={<PatientManagement />} />
              <Route path="appointments" element={<AppointmentScheduler />} />
              <Route path="queue" element={<QueueManagement />} />
              <Route path="billing" element={<Billing />} />
              <Route path="doctors" element={<DoctorAllocation />} />
              <Route path="review/:token" element={<ReviewPage />} />
            </Route>

            {/* ---- DENTAL LAB ROUTES ---- */}
            <Route
              path="/labadmin"
              element={
                <PrivateRoute
                  allowedRoles={["700","500", "760"]} 
                  element={<DentalLabLayout />}
                />
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LabDashboardPage />} />
              <Route path="orders" element={<LabOrdersPage />} />
              <Route path="revenue" element={<LabRevenuePage />} />
              <Route path="vendors" element={<div>Lab Vendors Page</div>} />
              <Route path="settings" element={<div>Lab Settings</div>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}