import React, { useState } from "react";
import {
  Lock,
  User,
  Phone,
  Mail,
  Calendar,
  Activity,
  Pill,
  DollarSign,
  FileText,
  HeartPulse,
  Droplet,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  LogIn,
  Shield,
} from "lucide-react";
import axios from "axios";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import labBaseUrl from "../labBaseUrl";
// import ThreeDCBCTViewer from "./nifti/Niftiviewer";
import DentalChartView from "../components/admin/pages/DentalChartView";
import styles from "../styles/PatientPortal.module.css";

// Types (same as your existing types)
interface Prescription {
  _id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Procedure {
  _id: string;
  name: string;
  description?: string;
  fee?: number;
  doctorId?: string;
  referredToDoctorId?: string;
  referralNotes?: string;
  completed?: boolean;
}

interface Stage {
  _id: string;
  stageName: string;
  description: string;
  procedures: Procedure[];
  status: string;
  scheduledDate: string;
}

interface TreatmentPlan {
  _id: string;
  planName: string;
  description: string;
  stages: Stage[];
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface Doctor {
  name: string;
  phoneNumber: number;
  specialization: string;
}

interface PatientHistory {
  _id: string;
  doctorId: string;
  appointmentId: string;
  symptoms: string[];
  diagnosis: string[];
  prescriptions: Prescription[];
  notes: string;
  files: any[];
  consultationFee: number;
  procedures: Procedure[];
  totalAmount: number;
  isPaid: boolean;
  status: string;
  visitDate: string;
  createdAt: string;
  treatmentPlanId?: string;
  doctor: Doctor | null;
  treatmentPlan: TreatmentPlan | null;
}

interface Address {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface MedicalHistory {
  conditions?: string[] | string;
  allergies?: string[] | string;
  surgeries?: string[] | string;
  medications?: string[] | string;
  familyHistory?: string[] | string;
}

interface Patient {
  _id: string;
  name: string;
  phone: number;
  email: string;
  patientUniqueId: string;
  patientRandomId: string;
  age: number;
  gender?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  address?: Address;
  visitHistory?: string[];
  medicalHistory?: MedicalHistory;
  labHistory?: string[];
}

interface ClinicDetails {
  name: string;
  address?: string;
  phone?: string;
}

interface ResultFile {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface LabOrder {
  order: any;
  _id: string;
  status: string;
  price: number;
  attachments: any[];
  resultFiles: ResultFile[];
  vendor: string;
  dentist: string;
  appointmentId: string;
  note: string;
}

interface InfoItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

interface PatientPortalProps {
  clinicId?: string;
  encryptedId?: string; 
  baseUrl?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  onClose?: () => void;
  isEmbedded?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  icon: Icon,
  color,
}) => (
  <div className={styles.infoItem}>
    <div
      className={styles.infoIconWrapper}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
    >
      <Icon size={18} color="#fff" />
    </div>
    <div className={styles.infoContent}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  </div>
);

const PatientPortal: React.FC<PatientPortalProps> = ({
  clinicId,
   encryptedId,
  baseUrl = patientServiceBaseUrl,
  theme = {
    primaryColor: "#2563EB",
    secondaryColor: "#7C3AED",
  },
  onClose,
  isEmbedded = false,
}) => {
  const [verificationCode, setVerificationCode] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<PatientHistory | null>(
    null
  );
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labDetails, setLabDetails] = useState<ResultFile | undefined>();
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [showDentalChart, setShowDentalChart] = useState(false);
  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "lab" | "dental"
  >("overview");

  // Handle input change for verification code
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle key down for backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify patient access
const handleVerify = async () => {
  const code = verificationCode.join("");
  if (code.length !== 4) {
    setError("Please enter all 4 digits");
    return;
  }

  setIsVerifying(true);
  setError("");

  try {
    let response;
    
    if (encryptedId) {
      console.log('Verifying with encryptedId:', encryptedId); // Debug
      console.log('With code:', code); // Debug
      
      response = await axios.post(
        `${baseUrl}/api/v1/patient-service/patient/verify-encrypted`,
        {
          encryptedId,
          lastFourDigits: code,
        },
        {
          params: { clinicId } // clinicId might be optional now
        }
      );
    } else {
      // This should not happen anymore
      response = await axios.get(
        `${baseUrl}/api/v1/patient-service/patient/verify-access`,
        {
          params: {
            clinicId,
            lastFourDigits: code,
          },
        }
      );
    }

    console.log('Verification response:', response.data); // Debug

    if (response.data?.success && response.data?.data) {
      const foundPatient = response.data.data;
      setPatient(foundPatient);
      setIsAuthenticated(true);
      
      await fetchClinicDetails();
      await fetchPatientHistory(foundPatient._id);
      await fetchLabData(foundPatient);
    } else {
      setError("Invalid verification code");
    }
  } catch (error: any) {
    console.error("Verification error:", error);
    setError(
      error.response?.data?.message || "Invalid verification code. Please try again."
    );
  } finally {
    setIsVerifying(false);
  }
};

  // Fetch clinic details
  const fetchClinicDetails = async () => {
    try {
      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/clinic/${clinicId}`
      );
      setClinicDetails(res.data?.data);
    } catch (err) {
      console.error("Failed to fetch clinic details", err);
    }
  };

  // Fetch patient history
  const fetchPatientHistory = async (patientId: string) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseUrl}/api/v1/patient-service/appointment/patient-history/${patientId}`,
        {
          params: { clinicId },
        }
      );

      if (res.data?.success) {
        setHistory(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lab data
  const fetchLabData = async (patient: Patient) => {
    try {
      if (
        !patient?.labHistory ||
        !Array.isArray(patient.labHistory) ||
        patient.labHistory.length === 0
      ) {
        setLabOrders([]);
        return;
      }

      const urls = patient.labHistory.map(
        (id) => `${labBaseUrl}api/v1/lab-orders/dental-orders/${id}`
      );

      const responses = await Promise.all(
        urls.map((url) =>
          axios.get(url).catch((err) => {
            console.error(`Error fetching lab order:`, err);
            return { data: null };
          })
        )
      );

      const labData = responses
        .map((res) => res?.data)
        .filter((data) => data !== null);

      setLabOrders(Array.isArray(labData) ? labData : []);
    } catch (error) {
      console.error("Error fetching lab data", error);
      setLabOrders([]);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPatient(null);
    setHistory([]);
    setVerificationCode(["", "", "", ""]);
    setSelectedVisit(null);
    setActiveTab("overview");
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Format medical value
  const formatMedicalValue = (
    value: string[] | string | undefined
  ): string => {
    if (!value) return "None";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "None";
    }
    return value || "None";
  };

  // Get last dental visit
  const getLastDentalVisit = () => {
    try {
      if (!history || !Array.isArray(history) || history.length === 0)
        return "Not Recorded";
      const sortedVisits = [...history].sort(
        (a, b) =>
          new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      );
      const lastVisit = sortedVisits[0];
      return lastVisit?.visitDate
        ? new Date(lastVisit.visitDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Not Recorded";
    } catch {
      return "Not Recorded";
    }
  };

  // Handle view result
  const handleViewResult = (resultFile: ResultFile) => {
    if (resultFile) {
      setLabDetails(resultFile);
      setShow3DViewer(true);
    }
  };

  // Render login screen
  if (!isAuthenticated) {
    return (
      <div className={styles.portalContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div
              className={styles.logoWrapper}
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
            >
              <Shield size={32} color="#fff" />
            </div>
            <h2 className={styles.loginTitle}>Patient Portal</h2>
            <p className={styles.loginSubtitle}>
              Enter the last 4 digits of your Patient ID to access your records
            </p>
          </div>

          <div className={styles.codeInputContainer}>
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={styles.codeInput}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className={styles.verifyButton}
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            {isVerifying ? (
              "Verifying..."
            ) : (
              <>
                <LogIn size={18} />
                Access My Records
              </>
            )}
          </button>

          <p className={styles.loginFooter}>
            <Lock size={14} />
            Secure & Encrypted Access
          </p>

          {!isEmbedded && onClose && (
            <button onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render patient dashboard
  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header
        className={styles.dashboardHeader}
        style={{
          background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
        }}
      >
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>
              Welcome back, {patient?.name}
            </h1>
            <p className={styles.headerSubtitle}>
              Patient ID: {patient?.patientUniqueId}
            </p>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <Lock size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Tabs for mobile */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "overview" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "history" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        {/* <button
          className={`${styles.tabButton} ${
            activeTab === "lab" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("lab")}
        >
          Lab Reports
        </button> */}
        <button
          className={`${styles.tabButton} ${
            activeTab === "dental" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("dental")}
        >
          Dental Chart
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.dashboardContent}>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Personal Info */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Information</h2>
              <div className={styles.infoGrid}>
                <InfoItem
                  label="Phone"
                  value={patient?.phone?.toString() || "N/A"}
                  icon={Phone}
                  color="#2563EB"
                />
                <InfoItem
                  label="Email"
                  value={patient?.email || "N/A"}
                  icon={Mail}
                  color="#7C3AED"
                />
                <InfoItem
                  label="Age"
                  value={patient?.age?.toString() || "N/A"}
                  icon={Calendar}
                  color="#EA580C"
                />
                <InfoItem
                  label="Gender"
                  value={patient?.gender || "N/A"}
                  icon={User}
                  color="#16A34A"
                />
                <InfoItem
                  label="Blood Group"
                  value={patient?.bloodGroup || "N/A"}
                  icon={Droplet}
                  color="#DC2626"
                />
                <InfoItem
                  label="Height"
                  value={patient?.height || "N/A"}
                  icon={Activity}
                  color="#9333EA"
                />
                <InfoItem
                  label="Weight"
                  value={patient?.weight || "N/A"}
                  icon={Activity}
                  color="#DB2777"
                />
              </div>

              {/* Address */}
              {patient?.address && (
                <div className={styles.addressCard}>
                  <div className={styles.addressIcon}>
                    <MapPin size={20} color="#F97316" />
                  </div>
                  <div className={styles.addressContent}>
                    <p className={styles.addressLabel}>Address</p>
                    <p className={styles.addressText}>
                      {patient.address.line1}
                      {patient.address.city && `, ${patient.address.city}`}
                      {patient.address.state && `, ${patient.address.state}`}
                      {patient.address.pincode && ` - ${patient.address.pincode}`}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Medical History */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Medical History</h2>
              <div className={styles.medicalGrid}>
                <div className={styles.medicalCard}>
                  <HeartPulse size={20} color="#8B5CF6" />
                  <div>
                    <p className={styles.medicalLabel}>Conditions</p>
                    <p className={styles.medicalValue}>
                      {formatMedicalValue(patient?.medicalHistory?.conditions)}
                    </p>
                  </div>
                </div>
                <div className={styles.medicalCard}>
                  <AlertCircle size={20} color="#EF4444" />
                  <div>
                    <p className={styles.medicalLabel}>Allergies</p>
                    <p className={styles.medicalValue}>
                      {formatMedicalValue(patient?.medicalHistory?.allergies)}
                    </p>
                  </div>
                </div>
                <div className={styles.medicalCard}>
                  <Pill size={20} color="#22C55E" />
                  <div>
                    <p className={styles.medicalLabel}>Medications</p>
                    <p className={styles.medicalValue}>
                      {formatMedicalValue(patient?.medicalHistory?.medications)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Quick Stats</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <Calendar size={20} color="#0EA5E9" />
                  <div>
                    <p className={styles.statLabel}>Total Visits</p>
                    <p className={styles.statValue}>{history.length}</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Clock size={20} color="#F59E0B" />
                  <div>
                    <p className={styles.statLabel}>Last Visit</p>
                    <p className={styles.statValue}>{getLastDentalVisit()}</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Pill size={20} color="#10B981" />
                  <div>
                    <p className={styles.statLabel}>Prescriptions</p>
                    <p className={styles.statValue}>
                      {history.reduce(
                        (acc, visit) => acc + (visit.prescriptions?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Visit History</h2>
            {loading ? (
              <div className={styles.loadingState}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className={styles.emptyState}>
                <FileText size={48} color="#94A3B8" />
                <p>No visit history found</p>
              </div>
            ) : (
              <div className={styles.visitsList}>
                {history.map((visit, index) => (
                  <div
                    key={visit._id || index}
                    className={styles.visitCard}
                    onClick={() => setSelectedVisit(visit)}
                  >
                    <div className={styles.visitHeader}>
                      <div className={styles.visitDate}>
                        <Calendar size={16} />
                        <span>{formatDate(visit.visitDate)}</span>
                      </div>
                      <span
                        className={`${styles.visitStatus} ${
                          visit.status === "completed"
                            ? styles.statusCompleted
                            : styles.statusPending
                        }`}
                      >
                        {visit.status}
                      </span>
                    </div>
                    <div className={styles.visitDoctor}>
                      <User size={14} />
                      <span>Dr. {visit.doctor?.name || "Unknown"}</span>
                    </div>
                    {visit.prescriptions?.length > 0 && (
                      <div className={styles.visitPrescriptions}>
                        <Pill size={14} />
                        <span>{visit.prescriptions.length} prescriptions</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Lab Reports Tab */}
        {activeTab === "lab" && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Lab Reports</h2>
            {labOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <FileText size={48} color="#94A3B8" />
                <p>No lab reports found</p>
              </div>
            ) : (
              <div className={styles.labList}>
                {labOrders.map((item, idx) => {
                  const order = item?.order || {};
                  const resultFiles = Array.isArray(order?.resultFiles)
                    ? order.resultFiles
                    : [];
                  const niftiFile = order?.niftiFile;

                  return (
                    <div key={idx} className={styles.labCard}>
                      <p className={styles.labNote}>{order?.note || "Lab Report"}</p>
                      {niftiFile && (
                        <button
                          className={styles.view3DButton}
                          onClick={() => handleViewResult(niftiFile)}
                        >
                          View 3D Model
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Dental Chart Tab */}
        {activeTab === "dental" && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Dental Chart</h2>
            <div className={styles.dentalChartContainer}>
              <DentalChartView
                patientId={patient?._id || ""}
                onClose={() => setActiveTab("overview")}
                // isEmbedded={true}
              />
            </div>
          </section>
        )}
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedVisit(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Visit Details</h3>
              <button
                onClick={() => setSelectedVisit(null)}
                className={styles.modalClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.visitDetailSection}>
                <p className={styles.visitDetailLabel}>Date & Time</p>
                <p className={styles.visitDetailValue}>
                  {formatDate(selectedVisit.visitDate)}
                </p>
              </div>

              <div className={styles.visitDetailSection}>
                <p className={styles.visitDetailLabel}>Doctor</p>
                <p className={styles.visitDetailValue}>
                  Dr. {selectedVisit.doctor?.name || "Unknown"} (
                  {selectedVisit.doctor?.specialization || "General"})
                </p>
              </div>

              {selectedVisit.symptoms?.length > 0 && (
                <div className={styles.visitDetailSection}>
                  <p className={styles.visitDetailLabel}>Symptoms</p>
                  <ul className={styles.visitDetailList}>
                    {selectedVisit.symptoms.map((symptom, idx) => (
                      <li key={idx}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedVisit.diagnosis?.length > 0 && (
                <div className={styles.visitDetailSection}>
                  <p className={styles.visitDetailLabel}>Diagnosis</p>
                  <ul className={styles.visitDetailList}>
                    {selectedVisit.diagnosis.map((diag, idx) => (
                      <li key={idx}>{diag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedVisit.prescriptions?.length > 0 && (
                <div className={styles.visitDetailSection}>
                  <p className={styles.visitDetailLabel}>Prescriptions</p>
                  {selectedVisit.prescriptions.map((pres) => (
                    <div key={pres._id} className={styles.prescriptionCard}>
                      <p className={styles.prescriptionName}>
                        {pres.medicineName}
                      </p>
                      <p className={styles.prescriptionDetails}>
                        {pres.dosage} • {pres.frequency}/day • {pres.duration} days
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selectedVisit.notes && (
                <div className={styles.visitDetailSection}>
                  <p className={styles.visitDetailLabel}>Notes</p>
                  <p className={styles.visitDetailValue}>{selectedVisit.notes}</p>
                </div>
              )}

              <div className={styles.visitDetailSection}>
                <p className={styles.visitDetailLabel}>Billing</p>
                <div className={styles.billingInfo}>
                  <span>Total: ₹{selectedVisit.totalAmount}</span>
                  <span
                    className={
                      selectedVisit.isPaid ? styles.paidBadge : styles.pendingBadge
                    }
                  >
                    {selectedVisit.isPaid ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

   
    </div>
  );
};

export default PatientPortal;