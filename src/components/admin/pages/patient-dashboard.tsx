import { useState, useEffect } from "react";
import { Card, CardContent } from "../../ui/card";
import ThreeDCBCTViewer from "./nifti/Niftiviewer";
import labBaseUrl from "../../../labBaseUrl";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import React from "react";
import {
  Search,
  User,
  Calendar,
  FileText,
  Pill,
  Home,
  DollarSign,
  Activity,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Droplet,
  HeartPulse,
  CalendarDays,
  Stethoscope,
  AlertTriangle,
  Scissors,
  Users,
  MessageCircle
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import jsPDF from "jspdf";
import baseUrl from "../../../baseUrl";
import DentalChartView from "./DentalChartView";

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

interface InfoItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

interface FileMeta {
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
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
  attachments: FileMeta[];
  resultFiles: ResultFile[];
  vendor: string;
  dentist: string;
  appointmentId: string;
  note: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#F9FAF9",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: 40,
              borderRadius: 16,
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              maxWidth: 500,
            }}
          >
            <AlertCircle
              size={48}
              color="#EF4444"
              style={{ marginBottom: 20 }}
            />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              Something went wrong
            </h2>
            <p style={{ color: "#64748B", marginBottom: 16 }}>
              There was an error loading the patient data:{" "}
              {this.state.errorMessage}
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
// Add this function inside ReportsContent component, before the return statement
const generateWhatsAppLink = async (patient: Patient) => {
  try {
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/patient/encrypted-link/${patient._id}`
    );
    
    const { secureLink } = response.data.data;
    const lastFourDigits = patient.patientUniqueId.slice(-4);
    
    // The secureLink now has NO special characters
    const portalUrl = `${window.location.origin}/patient-access/${secureLink}`;
    
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

function ReportsContent() {
  const { clinicId } = useParams();
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PatientHistory | null>(
    null,
  );
  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(
    null,
  );
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labDetails, setLabDetails] = useState<ResultFile | undefined>();
  const [ishandleResult, setHandleResult] = useState(false);
  const [viewDentalHistory, setViewDentalHistory] = useState(false);
  const [patientDetails, setPatientDetails] = useState({
    bloodGroup: "",
    dateOfBirth: "",
    height: "",
    weight: "",
    address: {
      line1: "",
      city: "",
      state: "",
      pincode: "",
    },
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
    medicalHistory: {
      conditions: "",
      allergies: "",
      surgeries: "",
      medications: "",
      familyHistory: "",
    },
  });

  useEffect(() => {
    if (!clinicId) return;

    async function fetchClinic() {
      try {
        const res = await axios.get(
          `${baseUrl}api/v1/auth/clinic/view-clinic/${clinicId}`,
        );
        const clinic = res.data?.data;

        setClinicDetails({
          name: clinic?.name || "Clinic",
          address: clinic?.address || "",
          phone: clinic?.phone || "",
        });
      } catch (err) {
        console.error("Failed to fetch clinic details", err);
      }
    }

    fetchClinic();
  }, [clinicId]);

  const fetchAllPatients = async () => {
    try {
      setPatientsLoading(true);
      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/all-patients/${clinicId}`,
      );
      setAllPatients(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setAllPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  const handleViewResult = (resultFile: ResultFile) => {
    console.log("Viewing result file:", resultFile);
    if (resultFile) {
      setLabDetails(resultFile);
    }
    setHandleResult(true);
  };

  const closeModal = () => {
    setHandleResult(false);
    setViewDentalHistory(false);
  };

  const downloadReport = (
    patient: Patient,
    visit: PatientHistory,
    clinicDetails: ClinicDetails,
  ) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(clinicDetails.name || "Clinic Name", pageWidth / 2, 20, {
        align: "center",
      });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      if (clinicDetails.address) {
        pdf.text(clinicDetails.address, pageWidth / 2, 28, { align: "center" });
      }
      if (clinicDetails.phone) {
        pdf.text(`Phone: ${clinicDetails.phone}`, pageWidth / 2, 34, {
          align: "center",
        });
      }

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.text("Official Prescription / Visit Summary", pageWidth / 2, 42, {
        align: "center",
      });
      pdf.line(20, 44, pageWidth - 20, 44);

      // Patient Info
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Patient Information", 20, 54);

      pdf.setFont("helvetica", "normal");
      pdf.text(`Name: ${patient.name || "N/A"}`, 20, 62);
      pdf.text(`Patient ID: ${patient.patientUniqueId || "N/A"}`, 20, 70);
      pdf.text(`Age: ${patient.age || "N/A"} years`, 20, 78);
      pdf.text(`Phone: ${patient.phone || "N/A"}`, 20, 86);
      pdf.text(`Email: ${patient.email || "N/A"}`, 20, 94);

      // Visit Info
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `Visit Date: ${visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : "N/A"}`,
        20,
        110,
      );
      pdf.text(
        `Doctor: ${visit.doctor?.name || "N/A"} (${
          visit.doctor?.specialization || "N/A"
        })`,
        20,
        118,
      );

      // Symptoms
      pdf.setFont("helvetica", "bold");
      pdf.text("Symptoms:", 20, 134);

      pdf.setFont("helvetica", "normal");
      if (Array.isArray(visit.symptoms)) {
        visit.symptoms.forEach((symptom: string, idx: number) => {
          pdf.text(`- ${symptom}`, 25, 142 + idx * 8);
        });
      }

      // Prescriptions
      if (
        Array.isArray(visit.prescriptions) &&
        visit.prescriptions.length > 0
      ) {
        let presStart = 142 + (visit.symptoms?.length || 0) * 8 + 8;

        pdf.setFont("helvetica", "bold");
        pdf.text("Prescriptions:", 20, presStart);

        pdf.setFont("helvetica", "normal");
        visit.prescriptions.forEach((pres: Prescription, idx: number) => {
          const yPos = presStart + 8 + idx * 8;
          pdf.text(
            `- ${pres.medicineName || "N/A"} (${pres.dosage || "N/A"}, ${pres.frequency || "N/A"}/day, ${pres.duration || "N/A"} days)`,
            25,
            yPos,
          );
        });
      }

      const fileName = `${patient.name?.replace(/\s+/g, "_") || "patient"}_${
        patient.patientUniqueId || "unknown"
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Search for patient
  const handlePatientSearch = async (searchId?: string) => {
    const query = searchId || patientSearchQuery;

    if (!query?.trim()) {
      alert("Please enter a Patient ID");
      return;
    }

    try {
      setSearchLoading(true);
      setPatient(null);
      setHistory([]);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/single-patient`,
        {
          params: {
            id: query,
            clinicId: clinicId,
          },
        },
      );
      
      const foundPatient = res.data?.data;
      if (foundPatient?._id) {
        setPatient(foundPatient);
        fetchPatientHistory(foundPatient._id);
        setPatientSearchQuery("");
      } else {
        alert("No patient found for this ID");
      }
    } catch (error: any) {
      console.error("Error fetching patient:", error);
      alert(error.response?.data?.message || "Error fetching patient");
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch patient history
  const fetchPatientHistory = async (patientId: string) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/patient-history/${patientId}`,
        {
          params: { clinicId },
        },
      );
      console.log("pa",res);

      if (res.data?.success) {
        setHistory(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (error: any) {
      console.error("Error fetching history:", error);
      alert(error.response?.data?.message || "Error fetching patient history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setPatientSearchQuery("");
    setPatient(null);
    setHistory([]);
    setSelectedVisit(null);
    fetchAllPatients();
  };

  // Handle patient click from all patients list
  const handlePatientClick = (clickedPatient: Patient) => {
    if (!clickedPatient?._id) return;
    setPatient(clickedPatient);
    setPatientSearchQuery(clickedPatient.patientUniqueId || "");
    fetchPatientHistory(clickedPatient._id);
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

  useEffect(() => {
    if (patient?._id) {
      getLabData();
    }
  }, [patient]);

  const getLabData = async () => {
    try {
      if (
        !patient?.labHistory ||
        !Array.isArray(patient.labHistory) ||
        patient.labHistory.length === 0
      ) {
        console.log("No lab history found");
        setLabOrders([]);
        return;
      }

      const urls = patient.labHistory.map(
        (id) => `${labBaseUrl}api/v1/lab-orders/dental-orders/${id}`,
      );

      const responses = await Promise.all(
        urls.map((url) =>
          axios.get(url).catch((err) => {
            console.error(`Error fetching lab order from ${url}:`, err);
            return { data: null };
          }),
        ),
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

  // Helper function to safely format medical history values
  const formatMedicalValue = (value: string[] | string | undefined): string => {
    if (!value) return "None";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "None";
    }
    return value || "None";
  };

  // Info Item Component
  const InfoItem: React.FC<InfoItemProps> = ({
    label,
    value,
    icon: Icon,
    color,
  }) => (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 18px ${color}55`,
          }}
        >
          <Icon size={18} color="#fff" />
        </div>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              margin: 0,
              color: "#64748B",
              textTransform: "uppercase",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginTop: 4,
              color: "#0F172A",
            }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  const personalInfoItems: InfoItemProps[] = patient
    ? [
        {
          label: "Phone",
          value: patient.phone?.toString() || "N/A",
          icon: Phone,
          color: "#2563EB",
        },
        {
          label: "Email",
          value: patient.email || "N/A",
          icon: Mail,
          color: "#7C3AED",
        },
        {
          label: "Age",
          value: patient.age?.toString() || "N/A",
          icon: Calendar,
          color: "#EA580C",
        },
        {
          label: "Gender",
          value: patient.gender || "N/A",
          icon: User,
          color: "#16A34A",
        },
        {
          label: "Blood Group",
          value: patient.bloodGroup || "N/A",
          icon: Droplet,
          color: "#DC2626",
        },
        {
          label: "DOB",
          value: patient.dateOfBirth
            ? new Date(patient.dateOfBirth).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          icon: Calendar,
          color: "#0EA5E9",
        },
        {
          label: "Height",
          value: patient.height || "N/A",
          icon: Activity,
          color: "#9333EA",
        },
        {
          label: "Weight",
          value: patient.weight || "N/A",
          icon: Activity,
          color: "#DB2777",
        },
      ]
    : [];

  const medicalHistoryItems = [
    {
      label: "Conditions",
      value: formatMedicalValue(patient?.medicalHistory?.conditions),
      icon: HeartPulse,
      color: "#8B5CF6",
    },
    {
      label: "Allergies",
      value: formatMedicalValue(patient?.medicalHistory?.allergies),
      icon: AlertTriangle,
      color: "#EF4444",
    },
    {
      label: "Surgeries",
      value: formatMedicalValue(patient?.medicalHistory?.surgeries),
      icon: Scissors,
      color: "#0EA5E9",
    },
    {
      label: "Medications",
      value: formatMedicalValue(patient?.medicalHistory?.medications),
      icon: Pill,
      color: "#22C55E",
    },
    {
      label: "Family History",
      value: formatMedicalValue(patient?.medicalHistory?.familyHistory),
      icon: Users,
      color: "#F97316",
    },
  ];

  // Safely get last dental visit
  const getLastDentalVisit = () => {
    try {
      if (!history || !Array.isArray(history) || history.length === 0)
        return "Not Recorded";
      const sortedVisits = [...history].sort(
        (a, b) =>
          new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
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

  return (
    <div style={{ backgroundColor: "#F9FAF9", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "2px solid rgba(107, 114, 128, 0.2)",
          backgroundColor: "#ffffff",
          background:
            "linear-gradient(to left, var(--primary), var(--primary-end))",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            margin: 0,
            color: "#ffffff",
            letterSpacing: "0.5px",
          }}
        >
          Patient Reports & History
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.9)",
            margin: "4px 0 0 0",
            fontWeight: "500",
          }}
        >
          Search and view detailed patient medical history
        </p>
      </div>

      <div style={{ padding: "32px", overflowY: "auto" }}>
        {/* Search Section */}
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderRadius: 16,
            padding: 28,
            marginBottom: 28,
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.4)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#0F172A",
                }}
              >
                Patient ID
              </Label>
              <Input
                placeholder="Enter Patient ID"
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePatientSearch();
                }}
                style={{ height: 48 }}
              />
            </div>

            <Button
              onClick={() => handlePatientSearch()}
              disabled={searchLoading}
              style={{ height: 48, minWidth: 140 }}
            >
              <Search className="w-4 h-4 mr-2" />
              {searchLoading ? "Searching..." : "Search"}
            </Button>

            {patient && (
              <Button
                variant="outline"
                onClick={handleClearSearch}
                style={{ height: 48 }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Conditional Rendering */}
        {patient ? (
          <>
            {/* Patient Info Section */}
            {!loading && (
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  borderRadius: 16,
                  padding: 28,
                  marginBottom: 28,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 20px rgba(20,184,166,0.35)",
                    }}
                  >
                    <User size={22} color="#fff" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        margin: 0,
                        color: "#0F172A",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {patient.name || "Unknown Patient"}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748B",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Patient ID: {patient.patientUniqueId || "N/A"}
                    </p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {Array.isArray(history) ? history.length : 0} Visit
                    {Array.isArray(history) && history.length !== 1 ? "s" : ""}
                  </Badge>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      height: 40,
                      padding: "0 18px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(59,130,246,0.35)",
                    }}
                  >
                    + Add Details
                  </button>
                </div>

                {/* Info Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 18,
                  }}
                >
                  {personalInfoItems.map((item, idx) => (
                    <InfoItem
                      key={idx}
                      label={item.label}
                      value={item.value}
                      icon={item.icon}
                      color={item.color}
                    />
                  ))}

                  {/* Address */}
                  <div
                    style={{
                      gridColumn: "span 2",
                      padding: 20,
                      borderRadius: 14,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                      backdropFilter: "blur(14px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background:
                            "linear-gradient(135deg, #F97316, #FB923C)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 18px rgba(249,115,22,0.4)",
                        }}
                      >
                        <MapPin size={18} color="#fff" />
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            margin: 0,
                            color: "#64748B",
                          }}
                        >
                          Address
                        </p>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          {patient.address
                            ? `${patient.address.line1 || ""}, ${
                                patient.address.city || ""
                              }, ${patient.address.state || ""} ${
                                patient.address.pincode || ""
                              }`
                                .replace(/,\s*,/g, ",")
                                .trim() || "N/A"
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medical History Section */}
            {!loading && (
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  borderRadius: 16,
                  padding: 28,
                  marginBottom: 28,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 20px rgba(124,58,237,0.35)",
                    }}
                  >
                    <HeartPulse size={22} color="#fff" />
                  </div>

                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      margin: 0,
                      color: "#0F172A",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Medical History
                  </h3>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 18,
                  }}
                >
                  {medicalHistoryItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 20,
                        borderRadius: 14,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                        backdropFilter: "blur(14px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: item.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
                          }}
                        >
                          <item.icon size={18} color="#fff" />
                        </div>

                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              margin: 0,
                              color: "#64748B",
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              marginTop: 4,
                              color: "#0F172A",
                            }}
                          >
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dental History Section */}
            {!loading && (
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  borderRadius: 16,
                  padding: 28,
                  marginBottom: 28,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #0EA5E9, #38BDF8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(14,165,233,0.35)",
                      }}
                    >
                      <Activity size={22} color="#fff" />
                    </div>

                    <div>
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          margin: 0,
                          color: "#0F172A",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        Dental History
                      </h3>
                      <p
                        style={{
                          fontSize: 12,
                          marginTop: 4,
                          color: "#64748B",
                        }}
                      >
                        View and manage dental records
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setViewDentalHistory(true)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      fontWeight: 600,
                      border: "1px solid rgba(14,165,233,0.3)",
                      background: "rgba(14,165,233,0.1)",
                      color: "#0EA5E9",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    View Dental Chart
                  </Button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 14,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                      backdropFilter: "blur(14px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background:
                            "linear-gradient(135deg, #10B981, #34D399)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 18px rgba(16,185,129,0.25)",
                        }}
                      >
                        <Calendar size={18} color="#fff" />
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            margin: 0,
                            color: "#64748B",
                          }}
                        >
                          Last Dental Checkup
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            marginTop: 4,
                            color: "#0F172A",
                          }}
                        >
                          {getLastDentalVisit()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 20,
                      borderRadius: 14,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                      backdropFilter: "blur(14px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background:
                            "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 18px rgba(139,92,246,0.25)",
                        }}
                      >
                        <Activity size={18} color="#fff" />
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            margin: 0,
                            color: "#64748B",
                          }}
                        >
                          Total Dental Visits
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            marginTop: 4,
                            color: "#0F172A",
                          }}
                        >
                          {Array.isArray(history) ? history.length : 0} visit
                          {Array.isArray(history) && history.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lab Details Section */}
            {!loading && Array.isArray(labOrders) && labOrders.length > 0 && (
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  borderRadius: 16,
                  padding: 28,
                  marginBottom: 28,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 20px rgba(124,58,237,0.35)",
                    }}
                  >
                    <Home size={22} color="#fff" />
                  </div>

                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      margin: 0,
                      color: "#0F172A",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Lab Details
                  </h3>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 18,
                  }}
                >
                  {labOrders.map((item, idx) => {
                    // Safely access nested properties
                    const order = item?.order || {};
                    const note = order?.note || "No note";
                    const price = order?.price;
                    const resultFiles = Array.isArray(order?.resultFiles)
                      ? order.resultFiles
                      : [];
                    const niftiFile = order?.niftiFile;

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: 20,
                          borderRadius: 14,
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                          backdropFilter: "blur(14px)",
                          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              marginBottom: 8,
                              color: "#0F172A",
                            }}
                          >
                            {note}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              margin: 0,
                              color: "#64748B",
                            }}
                          >
                            $
                            {typeof price === "number"
                              ? price.toFixed(2)
                              : "0.00"}
                          </p>

                          {resultFiles.length > 0 && niftiFile && (
                            <div style={{ marginTop: 12 }}>
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#475569",
                                  marginBottom: 8,
                                }}
                              >
                                Result Files:
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                {niftiFile && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "10px 14px",
                                      backgroundColor: "#f8fafc",
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  >
                                    <div>
                                      <p
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 600,
                                          margin: 0,
                                          color: "#334155",
                                        }}
                                      >
                                        {niftiFile.fileName || "Unknown file"}
                                      </p>
                                      <p
                                        style={{
                                          fontSize: 11,
                                          color: "#64748B",
                                          marginTop: 4,
                                        }}
                                      >
                                        NIfTI Result File
                                      </p>
                                    </div>

                                    <button
                                      style={{
                                        backgroundColor: "#2563eb",
                                        color: "#fff",
                                        padding: "6px 14px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderRadius: 6,
                                        border: "none",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                      }}
                                      onClick={() =>
                                        niftiFile && handleViewResult(niftiFile)
                                      }
                                    >
                                      View 3D
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading patient history...
                </p>
              </div>
            )}

            {/* Visit History */}
            {!selectedVisit &&
              !loading &&
              Array.isArray(history) &&
              history.length > 0 && (
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color:"black"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #2563EB, #60A5FA)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(96,165,250,0.4)",
                      }}
                    >
                      <CalendarDays size={22} color="#fff" />
                    </div>

                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        margin: 0,
                        color: "#0F172A",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Visit History ({history.length})
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      maxHeight: 400,
                      overflowY: "auto",
                      paddingRight: 4,
                    }}
                  >
                    {history.map((visit, index) => (
                      <div
                        key={visit?._id || index}
                        onClick={() => setSelectedVisit(visit)}
                        style={{
                          padding: 22,
                          borderRadius: 16,
                          cursor: "pointer",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.9))",
                          backdropFilter: "blur(16px)",
                          WebkitBackdropFilter: "blur(16px)",
                          boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
                          border: "1px solid rgba(255,255,255,0.45)",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 14,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Calendar className="w-5 h-5 text-primary" />
                            <span style={{ fontSize: 16, fontWeight: 700 }}>
                              {visit?.visitDate
                                ? formatDate(visit.visitDate)
                                : "Unknown Date"}
                            </span>
                          </div>

                          <span
                            style={{
                              padding: "6px 14px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              backgroundColor:
                                visit?.status === "completed"
                                  ? "#16a34a"
                                  : "#64748b",
                              color: "#fff",
                            }}
                          >
                            {visit?.status || "Unknown"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 14,
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>
                              <strong>Doctor:</strong>{" "}
                              {visit?.doctor?.name || "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4 text-gray-500" />
                            <span>
                              <strong>Specialization:</strong>{" "}
                              {visit?.doctor?.specialization || "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>
                              <strong>Symptoms:</strong>{" "}
                              {Array.isArray(visit?.symptoms)
                                ? visit.symptoms.length
                                : 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Pill className="w-4 h-4 text-gray-500" />
                            <span>
                              <strong>Prescriptions:</strong>{" "}
                              {Array.isArray(visit?.prescriptions)
                                ? visit.prescriptions?.length
                                : 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span>
                              <strong>Total:</strong> ₹{visit?.totalAmount || 0}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            {visit?.isPaid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            )}
                            <span>
                              <strong>Payment:</strong>{" "}
                              {visit?.isPaid ? "Paid" : "Pending"}
                            </span>
                          </div>
                        </div>

                        {visit?.treatmentPlan && (
                          <div
                            style={{
                              marginTop: 14,
                              padding: 12,
                              borderRadius: 12,
                              background: "rgba(37, 99, 235, 0.08)",
                              border: "1px solid rgba(37, 99, 235, 0.2)",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#1d4ed8",
                              }}
                            >
                              Treatment Plan:{" "}
                              {visit.treatmentPlan.planName || "N/A"}
                            </p>
                            <p style={{ fontSize: 12, color: "#2563eb" }}>
                              {Array.isArray(visit.treatmentPlan.stages)
                                ? visit.treatmentPlan.stages.length
                                : 0}{" "}
                              stage(s) • {visit.treatmentPlan.status || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* No Results */}
            {!loading &&
              patient &&
              (!Array.isArray(history) || history.length === 0) && (
                <Card className="bg-muted/30">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">
                      No medical history found for this patient
                    </p>
                  </CardContent>
                </Card>
              )}
          </>
        ) : (
          // All Patients View
          <>
            {patientsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading patients...
                </p>
              </div>
            ) : (
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 20px rgba(167,139,250,0.4)",
                    }}
                  >
                    <User size={22} color="#fff" />
                  </div>
                  <h3
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      margin: 0,
                      color: "#0F172A",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    All Registered Patients (
                    {Array.isArray(allPatients) ? allPatients.length : 0})
                  </h3>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    maxHeight: 600,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {Array.isArray(allPatients) &&
                    allPatients.map((p) => (
                      <div
                        key={p?._id || Math.random()}
                        style={{
                          padding: 18,
                          borderRadius: 14,
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                          backdropFilter: "blur(14px)",
                          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          }}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background:
                                "linear-gradient(135deg, #0F766E, #14B8A6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 8px 20px rgba(20,184,166,0.35)",
                            }}
                          >
                            <User size={24} color="#fff" />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 16,
                                fontWeight: 600,
                                margin: 0,
                                color: "#0F172A",
                              }}
                            >
                              {p?.name || "Unknown"}
                            </p>
                            <div
                              style={{ display: "flex", gap: 16, marginTop: 4 }}
                            >
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#64748B",
                                  margin: 0,
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>ID:</span>{" "}
                                {p?.patientUniqueId || "N/A"}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#64748B",
                                  margin: 0,
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>
                                  Random ID:
                                </span>{" "}
                                {p?.patientRandomId || "N/A"}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#64748B",
                                  margin: 0,
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>Phone:</span>{" "}
                                {p?.phone || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              padding: "8px 16px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              backgroundColor: "#f0f9ff",
                              color: "#0369a1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {Array.isArray(p?.visitHistory)
                              ? p.visitHistory.length
                              : 0}{" "}
                            Visits
                          </span>
                          <Button
                            size="sm"
                            onClick={() => p?._id && handlePatientClick(p)}
                          >
                            View Records
                          </Button>
         <Button
  size="sm"
  variant="outline"
  onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const link = await generateWhatsAppLink(p);
      window.open(link, '_blank');
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
    }
  }}
  style={{
    marginLeft: '8px',
    backgroundColor: '#25D366',
    color: 'white',
    border: 'none',
  }}
  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#128C7E';
  }}
  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#25D366';
  }}
>
  <MessageCircle size={16} style={{ marginRight: '4px' }} />
  WhatsApp
</Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Visit Detail Modal */}
        {selectedVisit && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={() => setSelectedVisit(null)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "24px 32px",
                  borderBottom: "2px solid rgba(107, 114, 128, 0.2)",
                  background:
                    "linear-gradient(to left, var(--primary), var(--primary-end))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      margin: 0,
                      color: "#ffffff",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Visit Details
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.9)",
                      margin: "4px 0 0 0",
                      fontWeight: "500",
                    }}
                  >
                    {formatDate(selectedVisit.visitDate)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#ffffff",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)";
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "32px",
                  backgroundColor: "#F9FAF9",
                }}
              >
                {/* Doctor Info */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(20,184,166,0.35)",
                      }}
                    >
                      <User size={22} color="#fff" />
                    </div>
                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        margin: 0,
                        color: "#0F172A",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Doctor Information
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 18,
                    }}
                  >
                    <InfoItem
                      label="Name"
                      value={selectedVisit.doctor?.name || "N/A"}
                      icon={User}
                      color="#2563EB"
                    />
                    <InfoItem
                      label="Specialization"
                      value={selectedVisit.doctor?.specialization || "N/A"}
                      icon={Stethoscope}
                      color="#7C3AED"
                    />
                    <InfoItem
                      label="Phone"
                      value={selectedVisit.doctor?.phoneNumber || "N/A"}
                      icon={Phone}
                      color="#EA580C"
                    />
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 14,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                        backdropFilter: "blur(14px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background:
                              selectedVisit.status === "completed"
                                ? "linear-gradient(135deg, #16A34A, #22C55E)"
                                : "linear-gradient(135deg, #64748B, #94A3B8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow:
                              selectedVisit.status === "completed"
                                ? "0 8px 18px rgba(22,163,74,0.4)"
                                : "0 8px 18px rgba(100,116,139,0.4)",
                          }}
                        >
                          <Activity size={18} color="#fff" />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              margin: 0,
                              color: "#64748B",
                              textTransform: "uppercase",
                            }}
                          >
                            Status
                          </p>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              marginTop: 4,
                              color: "#0F172A",
                            }}
                          >
                            {selectedVisit.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symptoms & Diagnosis */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: 28,
                    marginBottom: 28,
                  }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      borderRadius: 16,
                      padding: 28,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #F59E0B, #FBBF24)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 20px rgba(245,158,11,0.35)",
                        }}
                      >
                        <AlertCircle size={22} color="#fff" />
                      </div>
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          margin: 0,
                          color: "#0F172A",
                        }}
                      >
                        Symptoms
                      </h3>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {selectedVisit?.symptoms?.map((symptom, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 14,
                            color: "#475569",
                            padding: "8px 0",
                            borderBottom:
                              idx < selectedVisit.symptoms.length - 1
                                ? "1px solid rgba(0,0,0,0.05)"
                                : "none",
                          }}
                        >
                          • {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      borderRadius: 16,
                      padding: 28,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #EC4899, #F472B6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 20px rgba(236,72,153,0.35)",
                        }}
                      >
                        <Activity size={22} color="#fff" />
                      </div>
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          margin: 0,
                          color: "#0F172A",
                        }}
                      >
                        Diagnosis
                      </h3>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {selectedVisit.diagnosis.map((diag, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 14,
                            color: "#475569",
                            padding: "8px 0",
                            borderBottom:
                              idx < selectedVisit.diagnosis.length - 1
                                ? "1px solid rgba(0,0,0,0.05)"
                                : "none",
                          }}
                        >
                          • {diag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Prescriptions */}
                {selectedVisit.prescriptions.length > 0 && (
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      borderRadius: 16,
                      padding: 28,
                      marginBottom: 28,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 20px rgba(139,92,246,0.35)",
                        }}
                      >
                        <Pill size={22} color="#fff" />
                      </div>
                      <h3
                        style={{
                          fontSize: 19,
                          fontWeight: 700,
                          margin: 0,
                          color: "#0F172A",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        Prescriptions ({selectedVisit.prescriptions.length})
                      </h3>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {selectedVisit.prescriptions.map((prescription) => (
                        <div
                          key={prescription._id}
                          style={{
                            padding: 18,
                            borderRadius: 14,
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                            backdropFilter: "blur(14px)",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              margin: "0 0 12px 0",
                              color: "#0F172A",
                            }}
                          >
                            {prescription.medicineName}
                          </p>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 16,
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  margin: 0,
                                  color: "#64748B",
                                  textTransform: "uppercase",
                                }}
                              >
                                Dosage
                              </p>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  marginTop: 4,
                                  color: "#0F172A",
                                }}
                              >
                                {prescription.dosage}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  margin: 0,
                                  color: "#64748B",
                                  textTransform: "uppercase",
                                }}
                              >
                                Frequency
                              </p>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  marginTop: 4,
                                  color: "#0F172A",
                                }}
                              >
                                {prescription.frequency}/day
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  margin: 0,
                                  color: "#64748B",
                                  textTransform: "uppercase",
                                }}
                              >
                                Duration
                              </p>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  marginTop: 4,
                                  color: "#0F172A",
                                }}
                              >
                                {prescription.duration} days
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedVisit.notes && (
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      borderRadius: 16,
                      padding: 28,
                      marginBottom: 28,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #06B6D4, #22D3EE)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 20px rgba(6,182,212,0.35)",
                        }}
                      >
                        <FileText size={22} color="#fff" />
                      </div>
                      <h3
                        style={{
                          fontSize: 19,
                          fontWeight: 700,
                          margin: 0,
                          color: "#0F172A",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        Clinical Notes
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#475569",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedVisit.notes}
                    </p>
                  </div>
                )}

                {/* Treatment Plan */}
                {selectedVisit.treatmentPlan && (
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                      backdropFilter: "blur(18px)",
                      borderRadius: 16,
                      padding: 28,
                      marginBottom: 28,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #2563EB, #60A5FA)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileText size={22} color="#fff" />
                      </div>
                      <div>
                        <h3
                          style={{ fontSize: 19, fontWeight: 700, margin: 0 }}
                        >
                          Treatment Plan
                        </h3>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#475569",
                            marginTop: 4,
                          }}
                        >
                          {selectedVisit.treatmentPlan.stages?.length || 0}{" "}
                          stages • {selectedVisit.treatmentPlan.status}
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 12,
                      }}
                    >
                      {selectedVisit.treatmentPlan.planName}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {selectedVisit.treatmentPlan.stages?.map((stage, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 14,
                            borderRadius: 12,
                            background: "rgba(37, 99, 235, 0.08)",
                            border: "1px solid rgba(37, 99, 235, 0.2)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                margin: 0,
                              }}
                            >
                              {stage.stageName}
                            </p>

                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor:
                                  stage.status === "completed"
                                    ? "#16a34a"
                                    : "#64748b",
                                color: "#fff",
                              }}
                            >
                              {stage.status}
                            </span>
                          </div>

                          {stage.description && (
                            <p
                              style={{
                                fontSize: 13,
                                color: "#475569",
                                margin: 0,
                              }}
                            >
                              {stage.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Billing */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #10B981, #34D399)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(16,185,129,0.35)",
                      }}
                    >
                      <DollarSign size={22} color="#fff" />
                    </div>
                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        margin: 0,
                        color: "#0F172A",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Billing Information
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 18,
                    }}
                  >
                    <InfoItem
                      label="Consultation Fee"
                      value={`₹${selectedVisit.consultationFee}`}
                      icon={DollarSign}
                      color="#059669"
                    />
                    <InfoItem
                      label="Total Amount"
                      value={`₹${selectedVisit.totalAmount}`}
                      icon={DollarSign}
                      color="#0891B2"
                    />
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 14,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.85))",
                        backdropFilter: "blur(14px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: selectedVisit.isPaid
                              ? "linear-gradient(135deg, #16A34A, #22C55E)"
                              : "linear-gradient(135deg, #F59E0B, #FBBF24)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: selectedVisit.isPaid
                              ? "0 8px 18px rgba(22,163,74,0.4)"
                              : "0 8px 18px rgba(245,158,11,0.4)",
                          }}
                        >
                          {selectedVisit.isPaid ? (
                            <CheckCircle size={18} color="#fff" />
                          ) : (
                            <Clock size={18} color="#fff" />
                          )}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              margin: 0,
                              color: "#64748B",
                              textTransform: "uppercase",
                            }}
                          >
                            Payment Status
                          </p>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              marginTop: 4,
                              color: "#0F172A",
                            }}
                          >
                            {selectedVisit.isPaid ? "Paid" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "16px 32px",
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                  backgroundColor: "#F9FAF9",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <Button
                  variant="outline"
                  onClick={() => setSelectedVisit(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (!patient || !selectedVisit) return;
                    downloadReport(patient, selectedVisit, {
                      name: clinicDetails?.name || "Clinic Name",
                      address: clinicDetails?.address || "",
                      phone: clinicDetails?.phone || "",
                    });
                  }}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Patient Details Modal */}
        {showAddModal && patient && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              zIndex: 10000,
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "1024px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "24px 32px",
                  borderBottom: "2px solid rgba(107, 114, 128, 0.2)",
                  background:
                    "linear-gradient(to left, var(--primary), var(--primary-end))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      margin: 0,
                      color: "#ffffff",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Update Patient Details
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.9)",
                      margin: "4px 0 0 0",
                      fontWeight: "500",
                    }}
                  >
                    {patient.name} - {patient.patientUniqueId}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#ffffff",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)";
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div
                style={{
                  overflowY: "auto",
                  padding: "32px",
                  backgroundColor: "#F9FAF9",
                  maxHeight: "calc(90vh - 160px)",
                }}
              >
                {/* Basic Information */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Basic Information
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 20,
                    }}
                  >
                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Blood Group
                      </Label>
                      <Input
                        placeholder="e.g., O+, A+, B-, AB+"
                        value={patientDetails.bloodGroup}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            bloodGroup: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Date of Birth
                      </Label>
                      <Input
                        type="date"
                        value={patientDetails.dateOfBirth}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Height
                      </Label>
                      <Input
                        placeholder="e.g., 175cm or 5'9&quot;"
                        value={patientDetails.height}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            height: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Weight
                      </Label>
                      <Input
                        placeholder="e.g., 70kg or 154lbs"
                        value={patientDetails.weight}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            weight: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Address
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 20,
                    }}
                  >
                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Address Line 1
                      </Label>
                      <Input
                        placeholder="Street address"
                        value={patientDetails.address.line1}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            address: {
                              ...patientDetails.address,
                              line1: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 20,
                      }}
                    >
                      <div>
                        <Label
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          City
                        </Label>
                        <Input
                          placeholder="City"
                          value={patientDetails.address.city}
                          onChange={(e) =>
                            setPatientDetails({
                              ...patientDetails,
                              address: {
                                ...patientDetails.address,
                                city: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          State
                        </Label>
                        <Input
                          placeholder="State"
                          value={patientDetails.address.state}
                          onChange={(e) =>
                            setPatientDetails({
                              ...patientDetails,
                              address: {
                                ...patientDetails.address,
                                state: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          Pincode
                        </Label>
                        <Input
                          placeholder="Pincode"
                          value={patientDetails.address.pincode}
                          onChange={(e) =>
                            setPatientDetails({
                              ...patientDetails,
                              address: {
                                ...patientDetails.address,
                                pincode: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Emergency Contact
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 20,
                    }}
                  >
                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Name
                      </Label>
                      <Input
                        placeholder="Contact name"
                        value={patientDetails.emergencyContact.name}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            emergencyContact: {
                              ...patientDetails.emergencyContact,
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Relation
                      </Label>
                      <Input
                        placeholder="e.g., Spouse, Parent"
                        value={patientDetails.emergencyContact.relation}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            emergencyContact: {
                              ...patientDetails.emergencyContact,
                              relation: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Phone
                      </Label>
                      <Input
                        placeholder="Phone number"
                        value={patientDetails.emergencyContact.phone}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            emergencyContact: {
                              ...patientDetails.emergencyContact,
                              phone: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
                    backdropFilter: "blur(18px)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 28,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Medical History
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 20,
                    }}
                  >
                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Existing Conditions
                      </Label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        placeholder="e.g., Diabetes, Hypertension, Asthma"
                        value={patientDetails.medicalHistory.conditions}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            medicalHistory: {
                              ...patientDetails.medicalHistory,
                              conditions: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Allergies
                      </Label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        placeholder="e.g., Penicillin, Peanuts, Dust"
                        value={patientDetails.medicalHistory.allergies}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            medicalHistory: {
                              ...patientDetails.medicalHistory,
                              allergies: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Past Surgeries
                      </Label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        placeholder="List any previous surgeries"
                        value={patientDetails.medicalHistory.surgeries}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            medicalHistory: {
                              ...patientDetails.medicalHistory,
                              surgeries: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Current Medications
                      </Label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        placeholder="List current medications"
                        value={patientDetails.medicalHistory.medications}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            medicalHistory: {
                              ...patientDetails.medicalHistory,
                              medications: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        Family History
                      </Label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        placeholder="Notable family medical history"
                        value={patientDetails.medicalHistory.familyHistory}
                        onChange={(e) =>
                          setPatientDetails({
                            ...patientDetails,
                            medicalHistory: {
                              ...patientDetails.medicalHistory,
                              familyHistory: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "16px 32px",
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                  backgroundColor: "#F9FAF9",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await axios.patch(
                        `${patientServiceBaseUrl}/api/v1/patient-service/patient/add/patient_details/${patient._id}`,
                        patientDetails,
                      );
                      alert("Patient details updated successfully!");
                      setShowAddModal(false);
                      handlePatientSearch(patient.patientUniqueId);
                    } catch (error: any) {
                      console.error("Error updating patient:", error);
                      alert(
                        error.response?.data?.message ||
                          "Failed to update patient details",
                      );
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dental History Modal */}
        {viewDentalHistory && patient && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "#F9FAF9",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                padding: "10px 20px",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                zIndex: 10001,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <X size={18} />
              Close
            </button>

            <div
              style={{
                flex: 1,
                padding: "60px 20px 20px 20px",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  maxWidth: "1200px",
                  margin: "0 auto",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  padding: "24px",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    Dental Chart - {patient.name}
                  </h2>
                  <p style={{ color: "#64748B" }}>
                    Patient ID: {patient.patientUniqueId} | Age: {patient.age}
                  </p>
                </div>

                <DentalChartView
                  patientId={patient._id}
                  onClose={() => setViewDentalHistory(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3D Viewer Modal */}
        {ishandleResult && labDetails && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "#F9FAF9",
              zIndex: 10000,
              overflow: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                padding: "8px 16px",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                zIndex: 10001,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              Close
            </button>

            <div style={{ flex: 1, marginTop: "60px" }}>
              <ThreeDCBCTViewer
                fileUrl={labDetails?.fileUrl}
                fileName={labDetails?.fileName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with ErrorBoundary
export default function Reports() {
  return (
    <ErrorBoundary>
      <ReportsContent />
    </ErrorBoundary>
  );
}
