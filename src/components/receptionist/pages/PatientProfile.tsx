import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Droplet,
  AlertCircle,
  FileText,
  DollarSign,
  Paperclip,
  Calendar,
  Activity,
} from "lucide-react";
import styles from "../styles/patientProfile.module.css";
import axios from "axios";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import { useEffect, useState } from "react";
interface Patient {
  _id: string;
  patientUniqueId: string;
  patientRandomId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: number;
  role: string;
  clinicId: string;
  createdBy: string;
  medicalHistory: MedicalHistory;
  linkedPatients: string[];
  treatmentPlans: string[];
  visitHistory: string[];
  parentPatient: string | null;
  createdAt: string;
  __v: number;
  bloodGroup: string;
  address: string;
  allergies: string[];
  pendingDues: number;
  lastVisit: string;
}
type Props = {
  patient: Patient;
  onBack: () => void;
};
interface PatientQueryParams {
  clinicId: string;
  uniqueId?: string;
}
interface PatientDashboardData {
  appointments: Appointment[];
  patientProfile: PatientProfile;
  summary: PatientSummary;
  visitHistory: VisitHistory[];
  treatmentPlans: TreatmentPlan[];
  dentalChart: any[];
}
interface TreatmentPlan {
  _id: string;
  name?: string;
  status?: "active" | "completed" | "cancelled";
  totalCost?: number;
}
interface MedicalHistory {
  allergies: string[];
  conditions: string[];
  surgeries: string[];
  familyHistory: string[];
}
interface PatientSummary {
  totalVisits: number;
  totalSpent: number;
  unpaidAmount: number;
  activeTreatmentPlans: number;
}
interface Appointment {
  _id: string;
  doctorId: string;
  department: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  status?: "pending" | "completed" | "cancelled" | "rescheduled";
  doctor?: {
    _id: string;
    name: string;
  };
}
interface PatientProfile {
  _id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: number;
  clinicId: string;
  role: string;
  patientRandomId: string;
  patientUniqueId: string;
  parentPatient: string | null;
  linkedPatients: string[];
  dentalChart: any[];
  labHistory: any[];
  treatmentPlans: any[];
  visitHistory: string[];
  medicalHistory: MedicalHistory;
  createdAt: string;
  createdBy: string;
  __v: number;
  address:{
    line1:string
  }
}
interface VisitHistory {
  _id: string;
  doctorId: string;
  appointmentId: string;
  symptoms: string[];
  diagnosis: string[];
  prescriptions?: Prescription[];
  notes?: string;
  createdAt?: string;
  doctor: {
    name: string;
    _id: string;
  };
  visitDate: Date;
  totalAmount: number;
  prescription: Medicine[];
}
interface Medicine {
  dosage: string;
  duration: string;
  frequency: string;
  medicineName: string;
  _id: string;
}
interface Prescription {
  dosage: string;
  duration: string;
  frequency: string;
  medicineName: string;
  _id: string;
}
export default function PatientProfile({ patient, onBack }: Props) {
  // const visitHistory = [
  //   {
  //     date: "2024-11-28",
  //     doctor: "Dr. Amit Sharma",
  //     diagnosis: "Common Cold",
  //     prescription: "Paracetamol 500mg",
  //     amount: 500,
  //   },
  //   {
  //     date: "2024-10-15",
  //     doctor: "Dr. Priya Patel",
  //     diagnosis: "Routine Checkup",
  //     prescription: "Multivitamins",
  //     amount: 800,
  //   },
  //   {
  //     date: "2024-09-05",
  //     doctor: "Dr. Rajesh Kumar",
  //     diagnosis: "High BP Monitoring",
  //     prescription: "Amlodipine 5mg",
  //     amount: 1200,
  //   },
  // ];

  // const labResults = [
  //   {
  //     test: "Complete Blood Count",
  //     date: "2024-11-28",
  //     status: "Normal",
  //     file: "CBC_Report.pdf",
  //   },
  //   {
  //     test: "Lipid Profile",
  //     date: "2024-10-15",
  //     status: "Borderline",
  //     file: "Lipid_Report.pdf",
  //   },
  // ];

  // const invoices = [
  //   { id: "INV-001", date: "2024-11-28", amount: 500, status: "Paid" },
  //   { id: "INV-002", date: "2024-10-15", amount: 800, status: "Paid" },
  //   { id: "INV-003", date: "2024-09-05", amount: 1200, status: "Pending" },
  // ];

  const [dashboard, setDashboard] = useState<PatientDashboardData | null>(null);
  const getPatientData = async () => {
    const params: PatientQueryParams = {
      clinicId: patient.clinicId,
      uniqueId: patient.patientUniqueId,
    };
    try {
      console.log("paea", params);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/full-crm`,
        { params }
      );
      setDashboard(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getPatientData();
  }, [patient]);

  console.log("ds", dashboard);

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button onClick={onBack} className={styles.backButton}>
        <ArrowLeft className={styles.icon} />
        Back to Patient List
      </button>

      {/* Patient Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.avatar}>
            <User className={styles.avatarIcon} />
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>
              <h2 className={styles.patientName}>{patient.name}</h2>
              <span className={styles.patientId}>{patient._id}</span>
            </div>
            <div className={styles.statsGrid}>
              <div>
                <p className={styles.statLabel}>Age / Gender</p>
                <p className={styles.statValue}>
                  {patient.age} years / {patient.gender}
                </p>
              </div>
              <div>
                <p className={styles.statLabel}>Blood Group</p>
                <p className={styles.statValue}>{patient.bloodGroup}</p>
              </div>
              <div>
                <p className={styles.statLabel}>Last Visit</p>
                <p className={styles.statValue}>
                  {new Date(patient.lastVisit).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <p className={styles.statLabel}>Pending Dues</p>
                <p className={styles.statValue}>
                  {patient.pendingDues > 0
                    ? `₹${patient.pendingDues}`
                    : "Clear"}
                </p>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryButton}>Book Appointment</button>
            <button className={styles.secondaryButton}>Edit Profile</button>
          </div>
        </div>
      </div>

      <div className={styles.threeColGrid}>
        {/* Contact Information */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Contact Information</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <Phone className={`${styles.icon} ${styles.blueIcon}`} />
              <div>
                <p className={styles.infoLabel}>Phone</p>
                <p className={styles.infoValue}>{patient.phone}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Mail className={`${styles.icon} ${styles.blueIcon}`} />
              <div>
                <p className={styles.infoLabel}>Email</p>
                <p className={styles.infoValue}>{patient.email}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <MapPin className={`${styles.icon} ${styles.blueIcon}`} />
              <div>
                <p className={styles.infoLabel}>Address</p>
                <p className={styles.infoValue}>{dashboard?.patientProfile?.address.line1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Medical Information</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <Droplet className={`${styles.icon} ${styles.redIcon}`} />
              <div>
                <p className={styles.infoLabel}>Blood Group</p>
                <p className={styles.infoValue}>{patient.bloodGroup}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <AlertCircle className={`${styles.icon} ${styles.orangeIcon}`} />
              <div>
                <p className={styles.infoLabel}>Allergies</p>
                {/* {patient.allergies.length > 0 ? (
                  <div className={styles.allergyList}>
                    {patient.allergies.map((allergy, index) => (
                      <span key={index} className={styles.allergyTag}>
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.infoValue}>None reported</p>
                )} */}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Quick Stats</h3>
          <div className={styles.infoList}>
            <div className={styles.quickStat + " " + styles.blueStat}>
              <span className={styles.quickStatLabel}>Total Visits</span>
              <span className={styles.quickStatValue + " " + styles.blueValue}>
                {dashboard?.summary.totalVisits}
              </span>
            </div>
            <div className={styles.quickStat + " " + styles.greenStat}>
              <span className={styles.quickStatLabel}>Total Spent</span>
              <span className={styles.quickStatValue + " " + styles.greenValue}>
                {dashboard?.summary.totalSpent}
              </span>
            </div>
            <div className={styles.quickStat + " " + styles.purpleStat}>
              <span className={styles.quickStatLabel}>Lab Tests</span>
              <span
                className={styles.quickStatValue + " " + styles.purpleValue}
              >
                {/* {labResults.length} */}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Activity className={`${styles.icon} ${styles.blueIcon}`} />
          Visit History
        </h3>
        <div className={styles.visitList}>
          {dashboard?.visitHistory.map((visit, index) => (
            <div key={index} className={styles.visitItem}>
              <div className={styles.visitIcon}>
                <Calendar className={styles.visitIconInner} />
              </div>
              <div className={styles.visitContent}>
                <div className={styles.visitHeader}>
                  <div>
                    <p className={styles.visitDiagnosis}>{visit.diagnosis}</p>
                    <p className={styles.visitDoctor}>
                      {visit?.doctor?.name || ""}
                    </p>
                  </div>
                  <span className={styles.visitDate}>
                    {new Date(visit.visitDate).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className={styles.visitPrescription}>
                  <span className={styles.prescriptionLabel}>
                    Prescription:
                  </span>{" "}
                  {visit?.prescriptions?.map((item, index) => (
                    <p key={index}>{item?.medicineName}</p>
                  ))}
                </p>
                <span className={styles.visitAmount}>₹{visit.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.twoColGrid}>
        {/* Lab Results */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <FileText className={`${styles.icon} ${styles.purpleIcon}`} />
            Lab Results
          </h3>
          <div className={styles.labList}>
            {/* {labResults.map((lab, index) => (
              <div key={index} className={styles.labItem}>
                <div className={styles.labInfo}>
                  <p className={styles.labTest}>{lab.test}</p>
                  <p className={styles.labDate}>
                    {new Date(lab.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className={styles.labActions}>
                  <span
                    className={
                      lab.status === "Normal"
                        ? styles.statusNormal
                        : styles.statusBorderline
                    }
                  >
                    {lab.status}
                  </span>
                  <button className={styles.attachButton}>
                    <Paperclip className={styles.attachIcon} />
                  </button>
                </div>
              </div>
            ))} */}
          </div>
        </div>

        {/* Invoices */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <DollarSign className={`${styles.icon} ${styles.greenIcon}`} />
            Invoices & Payments
          </h3>
          <div className={styles.invoiceList}>
            {/* {invoices.map((invoice, index) => (
              <div key={index} className={styles.invoiceItem}>
                <div className={styles.invoiceInfo}>
                  <p className={styles.invoiceId}>{invoice.id}</p>
                  <p className={styles.invoiceDate}>
                    {new Date(invoice.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className={styles.invoiceDetails}>
                  <p className={styles.invoiceAmount}>₹{invoice.amount}</p>
                  <span
                    className={
                      invoice.status === "Paid"
                        ? styles.statusPaid
                        : styles.statusPending
                    }
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
}
