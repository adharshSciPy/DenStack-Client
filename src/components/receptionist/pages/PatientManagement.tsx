import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Calendar,
  FileText,
  DollarSign,
  User,
  MessageCircle
} from "lucide-react";
import PatientProfile from "./PatientProfile";
import PatientBilling from "./PatientBilling";
import PatientMedicalHistory from "./PatientMedicalHistory"; // Import the medical history component
import styles from "../styles/PatientManagement.module.css";
import axios from "axios";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import { useAppSelector } from "../../../redux/hook";

interface MedicalHistory {
  allergies: string[];
  conditions: string[];
  familyHistory: string[];
  surgeries: string[];
}

interface PatientData {
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
  bloodGroup:string;
  address:string;
  allergies:string[]
  pendingDues:number;
  lastVisit:string
}

interface ClinicData {
  _id: string;
  name: string;
  phoneNumber: number;
  address: any;
  theme: {
    startColor: string;
    endColor: string;
  };
  subscription: any;
}

interface ReceptionistUser {
  id: string;
  name: string;
  clinicId: string;
  clinicData?: ClinicData;
}

export default function PatientManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"list" | "profile" | "billing" | "history">("list");
  
  const reception = useAppSelector(
    (state) => state.auth.user
  ) as ReceptionistUser | null;
  const clinicId = reception?.clinicData?._id || "";

  const getPatients = async (search = "") => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const url = `${patientServiceBaseUrl}/api/v1/patient-service/patient/clinic-patients/${clinicId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await axios.get(url);
      setPatients(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!clinicId) return;

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length === 0 || searchQuery.trim().length >= 3) {
        getPatients(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [clinicId, searchQuery]);

  const filteredPatients = patients.filter((patient) => {
    const matchesFilter = filterStatus === "all" || filterStatus === "active";
    return matchesFilter;
  });

  const getDaysSinceCreation = (createdAt: string) => {
    const days = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setCurrentView("list");
  };

  const handleViewProfile = (patient: PatientData) => {
    setSelectedPatient(patient);
    setCurrentView("profile");
  };

  const handleViewBilling = (patient: PatientData) => {
    setSelectedPatient(patient);
    setCurrentView("billing");
  };

  const handleViewHistory = (patient: PatientData) => {
    setSelectedPatient(patient);
    setCurrentView("history");
  };

  // Add this function to generate WhatsApp link
const generateWhatsAppLink = async (patient: PatientData) => {
  try {
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/patient/encrypted-link/${patient._id}`
    );
    
    const { secureLink } = response.data.data;
    const lastFourDigits = patient.patientUniqueId.slice(-4);
    
    // The secureLink now has NO special characters
    const portalUrl = `${window.location.origin}/patient-access/${secureLink}`;
    
    console.log('Clean URL:', portalUrl); // Should show only alphanumeric + - and _
    
   const message = encodeURIComponent(
`Hello ${patient.name},
Click this link to access your dental records:
${portalUrl}
Verification code: ${lastFourDigits}`
);

    
    return `https://wa.me/${patient.phone}?text=${message}`;
  } catch (error) {
    console.error('Error generating secure link:', error);
    alert('Failed to generate secure access link. Please try again.');
    throw error;
  }
};

  // Render based on current view
  if (currentView === "profile" && selectedPatient) {
    return (
      <PatientProfile
        patient={selectedPatient}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === "billing" && selectedPatient) {
    return (
      <PatientBilling
        patient={selectedPatient}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === "history" && selectedPatient) {
    return (
      <PatientMedicalHistory
        patient={selectedPatient}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Patient Directory</h2>
          <p className={styles.subtitle}>
            {loading ? "Loading..." : `${patients.length} total patients`}
          </p>
        </div>
        <button className={styles.addButton}>
          <Plus className={styles.buttonIcon} />
          Add New Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchCard}>
        <div className={styles.searchContainer}>
          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filter Buttons */}
          <div className={styles.filterContainer}>
            {["all"].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`${styles.filterButton} ${
                  filterStatus === filter ? styles.filterButtonActive : ""
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeader}>Patient ID</th>
                <th className={styles.tableHeader}>Name</th>
                <th className={styles.tableHeader}>Age/Gender</th>
                <th className={styles.tableHeader}>Contact</th>
                <th className={styles.tableHeader}>Registered</th>
                <th className={styles.tableHeader}>Medical History</th>
                <th className={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    Loading patients...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    No patients found
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => (
                  <tr
                    key={patient._id}
                    className={`${styles.tableRow} ${
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                    }`}
                  >
                    <td className={styles.tableCell}>
                      <span className={styles.patientId}>
                        {patient.patientUniqueId}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className={styles.patientName}>{patient.name}</span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.ageGender}>
                        {patient.age} / {patient.gender}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.contactCell}>
                        <p className={styles.phone}>{patient.phone}</p>
                        <p className={styles.email}>{patient.email}</p>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.lastVisit}>
                        {new Date(patient.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <br />
                      <small style={{ color: "#666", fontSize: "0.85em" }}>
                        {getDaysSinceCreation(patient.createdAt)} days ago
                      </small>
                    </td>
                    <td className={styles.tableCell}>
                      <div style={{ fontSize: "0.9em" }}>
                        {patient.medicalHistory.allergies.length > 0 && (
                          <div>
                            <strong>Allergies:</strong>{" "}
                            {patient.medicalHistory.allergies.join(", ")}
                          </div>
                        )}
                        {patient.medicalHistory.conditions.length > 0 && (
                          <div>
                            <strong>Conditions:</strong>{" "}
                            {patient.medicalHistory.conditions.join(", ")}
                          </div>
                        )}
                        {patient.medicalHistory.allergies.length === 0 &&
                          patient.medicalHistory.conditions.length === 0 && (
                            <span style={{ color: "#666" }}>None recorded</span>
                          )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleViewProfile(patient)}
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          title="View Profile"
                        >
                          <Eye className={styles.actionIcon} />
                        </button>
                        <button
                          onClick={() => handleViewHistory(patient)}
                          className={`${styles.actionButton} ${styles.historyButton}`}
                          title="View History"
                        >
                          <FileText className={styles.actionIcon} />
                        </button>
                        <button
                          onClick={() => handleViewBilling(patient)}
                          className={`${styles.actionButton} ${styles.billingButton}`}
                          title="Billing"
                        >
                          <DollarSign className={styles.actionIcon} />
                        </button>
                        {/* Add WhatsApp button here */}
                        <button
                       onClick={async () => {
    const link = await generateWhatsAppLink(patient);
    window.open(link, '_blank');
  }}
                          className={`${styles.actionButton} ${styles.whatsappButton}`}
                          title="Send Access Link via WhatsApp"
                        >
                          <MessageCircle className={styles.actionIcon} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredPatients.length === 0 && patients.length > 0 && (
        <div className={styles.emptyState}>
          <User className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            No patients found matching your search
          </p>
        </div>
      )}
    </div>
  );
}