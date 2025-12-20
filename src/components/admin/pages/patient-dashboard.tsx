import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import {
  Search,
  User,
  Calendar,
  FileText,
  Pill,
  DollarSign,
  Activity,
  Eye,
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
  Stethoscope
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import jsPDF from "jspdf";
import baseUrl from "../../../baseUrl";

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

export default function Reports() {
  const { clinicId } = useParams();
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PatientHistory | null>(null);
  const [clinicDetails, setClinicDetails] = useState<ClinicDetails | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    async function fetchClinic() {
      try {
        const res = await axios.get(
          `${baseUrl}/api/v1/auth/clinic/view-clinic/${clinicId}`
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
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/all-patients/${clinicId}`
      );
      setAllPatients(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  // to download pdf
  const downloadReport = (
    patient: Patient,
    visit: PatientHistory,
    clinicDetails: ClinicDetails
  ) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // ---- Header ----
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

    // ---- Patient Info ----
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Patient Information", 20, 54);

    pdf.setFont("helvetica", "normal");
    pdf.text(`Name: ${patient.name}`, 20, 62);
    pdf.text(`Patient ID: ${patient.patientUniqueId}`, 20, 70);
    pdf.text(`Age: ${patient.age} years`, 20, 78);
    pdf.text(`Phone: ${patient.phone || "N/A"}`, 20, 86);
    pdf.text(`Email: ${patient.email || "N/A"}`, 20, 94);

    // ---- Visit Info ----
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `Visit Date: ${new Date(visit.visitDate).toLocaleDateString()}`,
      20,
      110
    );
    pdf.text(
      `Doctor: ${visit.doctor?.name || "N/A"} (${
        visit.doctor?.specialization || "N/A"
      })`,
      20,
      118
    );

    // ---- Symptoms ----
    pdf.setFont("helvetica", "bold");
    pdf.text("Symptoms:", 20, 134);

    pdf.setFont("helvetica", "normal");
    visit.symptoms.forEach((symptom: string, idx: number) => {
      pdf.text(`- ${symptom}`, 25, 142 + idx * 8);
    });

    // ---- Prescriptions ----
    if (visit.prescriptions.length > 0) {
      let presStart = 142 + visit.symptoms.length * 8 + 8;

      pdf.setFont("helvetica", "bold");
      pdf.text("Prescriptions:", 20, presStart);

      pdf.setFont("helvetica", "normal");
      visit.prescriptions.forEach((pres: Prescription, idx: number) => {
        const yPos = presStart + 8 + idx * 8;
        pdf.text(
          `- ${pres.medicineName} (${pres.dosage}, ${pres.frequency}/day, ${pres.duration} days)`,
          25,
          yPos
        );
      });
    }

    // ---- Treatment Plan ----
    if (visit.treatmentPlan) {
      let treatmentStart =
        142 + visit.symptoms.length * 8 + visit.prescriptions.length * 8 + 16;

      pdf.setFont("helvetica", "bold");
      pdf.text("Treatment Plan:", 20, treatmentStart);

      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${visit.treatmentPlan.planName} (${visit.treatmentPlan.status})`,
        25,
        treatmentStart + 8
      );
      pdf.text(
        `${visit.treatmentPlan.stages.length} stage(s)`,
        25,
        treatmentStart + 16
      );
    }

    // ---- Notes ----
    if (visit.notes) {
      let notesStart =
        142 +
        visit.symptoms.length * 8 +
        visit.prescriptions.length * 8 +
        (visit.treatmentPlan?.stages.length || 0) * 8 +
        32;

      pdf.setFont("helvetica", "bold");
      pdf.text("Clinical Notes:", 20, notesStart);

      pdf.setFont("helvetica", "normal");
      pdf.text(visit.notes, 25, notesStart + 8, {
        maxWidth: pageWidth - 40,
      });
    }

    // ---- Footer ----
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      "This prescription is electronically generated and official.",
      pageWidth / 2,
      290,
      { align: "center" }
    );

    const fileName = `${patient.name.replace(/\s+/g, "_")}_${
      patient.patientUniqueId
    }.pdf`;
    pdf.save(fileName);
  };

  // Search for patient
  const handlePatientSearch = async (searchId?: string) => {
    const query = searchId || patientSearchQuery;

    if (!query.trim()) {
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
        }
      );

      const foundPatient = res.data.data;
      if (foundPatient?._id) {
        setPatient(foundPatient);
        fetchPatientHistory(foundPatient._id);
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
        }
      );

      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching history:", error);
      alert(error.response?.data?.message || "Error fetching patient history");
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
    setExpandedVisitId(null);
    fetchAllPatients();
  };

  // Handle patient click from all patients list
  const handlePatientClick = (clickedPatient: Patient) => {
    setPatient(clickedPatient);
    setPatientSearchQuery(clickedPatient.patientRandomId);
    fetchPatientHistory(clickedPatient._id);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Info Item Component
  const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon: Icon, color }) => (
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
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 45px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)";
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
        { label: "Phone", value: patient.phone, icon: Phone, color: "#2563EB" },
        {
          label: "Email",
          value: patient.email || "N/A",
          icon: Mail,
          color: "#7C3AED",
        },
        {
          label: "Age",
          value: patient.age || "N/A",
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

  return (
    <div style={{ backgroundColor: "#F9FAF9", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "2px solid rgba(107, 114, 128, 0.2)",
          backgroundColor: "#ffffff",
          background: "linear-gradient(to left, var(--primary), var(--primary-end))",
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
                placeholder="Enter Patient Random ID (e.g., PE-848422)"
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

        {/* CONDITIONAL RENDERING: Show searched patient OR all patients */}
        {patient ? (
          // ========== SEARCHED PATIENT VIEW ==========
          <>
            {/* Patient Info Card */}
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
                      {patient.name}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748B",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Patient ID: {patient.patientUniqueId}
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
                    {history.length} Visit{history.length !== 1 ? "s" : ""}
                  </Badge>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #F97316, #FB923C)",
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
                                .trim()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
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
            {!selectedVisit && !loading && history.length > 0 && (
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

                {/* Scrollable List */}
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
                {history.map((visit) => (
  <div
    key={visit._id}
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
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow =
        "0 22px 45px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow =
        "0 14px 32px rgba(0,0,0,0.08)";
    }}
  >
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Calendar className="w-5 h-5 text-primary" />
        <span style={{ fontSize: 16, fontWeight: 700 }}>
          {formatDate(visit.visitDate)}
        </span>
      </div>

      <span
        style={{
          padding: "6px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          backgroundColor:
            visit.status === "completed" ? "#16a34a" : "#64748b",
          color: "#fff",
        }}
      >
        {visit.status}
      </span>
    </div>

    {/* Info Grid */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14,
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        <User className="w-4 h-4 text-gray-500" />
        <span>
          <strong>Doctor:</strong> {visit.doctor?.name || "N/A"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-gray-500" />
        <span>
          <strong>Specialization:</strong>{" "}
          {visit.doctor?.specialization || "N/A"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <FileText className="w-4 h-4 text-gray-500" />
        <span>
          <strong>Symptoms:</strong> {visit.symptoms.length}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Pill className="w-4 h-4 text-gray-500" />
        <span>
          <strong>Prescriptions:</strong>{" "}
          {visit.prescriptions.length}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <span>
          <strong>Total:</strong> ₹{visit.totalAmount}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {visit.isPaid ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-orange-600" />
        )}
        <span>
          <strong>Payment:</strong>{" "}
          {visit.isPaid ? "Paid" : "Pending"}
        </span>
      </div>
    </div>

    {/* Treatment Plan */}
    {visit.treatmentPlan && (
      <div
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 12,
          background: "rgba(37, 99, 235, 0.08)",
          border: "1px solid rgba(37, 99, 235, 0.2)",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
          Treatment Plan: {visit.treatmentPlan.planName}
        </p>
        <p style={{ fontSize: 12, color: "#2563eb" }}>
          {visit.treatmentPlan.stages.length} stage(s) •{" "}
          {visit.treatmentPlan.status}
        </p>
      </div>
    )}
  </div>
))}

                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && patient && history.length === 0 && (
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
          // ========== ALL PATIENTS VIEW ==========
          <>
            {patientsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading patients...</p>
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
                    All Registered Patients ({allPatients.length})
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
                  {allPatients.map((p) => (
                    <div
                      key={p._id}
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 45px rgba(0,0,0,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 12px 30px rgba(0,0,0,0.08)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, #0F766E, #14B8A6)",
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
                            {p.name}
                          </p>
                          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                            <p
                              style={{
                                fontSize: 12,
                                color: "#64748B",
                                margin: 0,
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>ID:</span>{" "}
                              {p.patientUniqueId}
                            </p>
                            <p
                              style={{
                                fontSize: 12,
                                color: "#64748B",
                                margin: 0,
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>Random ID:</span>{" "}
                              {p.patientRandomId}
                            </p>
                            <p
                              style={{
                                fontSize: 12,
                                color: "#64748B",
                                margin: 0,
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>Phone:</span>{" "}
                              {p.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                          {p.visitHistory?.length || 0} Visits
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handlePatientClick(p)}
                        >
                          View Records
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
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
                  backgroundColor: "#ffffff",
                  background: "linear-gradient(to left, var(--primary), var(--primary-end))",
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
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
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
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 18,
                    }}
                  >
                    <InfoItem label="Name" value={selectedVisit.doctor?.name || "N/A"} icon={User} color="#2563EB" />
                    <InfoItem label="Specialization" value={selectedVisit.doctor?.specialization || "N/A"} icon={Stethoscope} color="#7C3AED" />
                    <InfoItem label="Phone" value={selectedVisit.doctor?.phoneNumber || "N/A"} icon={Phone} color="#EA580C" />
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
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: selectedVisit.status === "completed" 
                              ? "linear-gradient(135deg, #16A34A, #22C55E)" 
                              : "linear-gradient(135deg, #64748B, #94A3B8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: selectedVisit.status === "completed" 
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
                  {/* Symptoms */}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
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
                      {selectedVisit.symptoms.map((symptom, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 14,
                            color: "#475569",
                            padding: "8px 0",
                            borderBottom: idx < selectedVisit.symptoms.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                          }}
                        >
                          • {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Diagnosis */}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #EC4899, #F472B6)",
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
                            borderBottom: idx < selectedVisit.diagnosis.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
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
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
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

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                          <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px 0", color: "#0F172A" }}>
                            {prescription.medicineName}
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "#64748B", textTransform: "uppercase" }}>
                                Dosage
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: "#0F172A" }}>
                                {prescription.dosage}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "#64748B", textTransform: "uppercase" }}>
                                Frequency
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: "#0F172A" }}>
                                {prescription.frequency}/day
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "#64748B", textTransform: "uppercase" }}>
                                Duration
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: "#0F172A" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #06B6D4, #22D3EE)",
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
                    <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
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
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "linear-gradient(135deg, #2563EB, #60A5FA)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileText size={22} color="#fff" />
      </div>
      <div>
        <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
          Treatment Plan
        </h3>
        <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          {selectedVisit.treatmentPlan.stages?.length || 0} stages •{" "}
          {selectedVisit.treatmentPlan.status}
        </p>
      </div>
    </div>

    {/* Plan Name */}
    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
      {selectedVisit.treatmentPlan.planName}
    </p>

    {/* Stages List */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
              {stage.stageName}
            </p>

            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor:
                  stage.status === "completed" ? "#16a34a" : "#64748b",
                color: "#fff",
              }}
            >
              {stage.status}
            </span>
          </div>

          {stage.description && (
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                <Button variant="outline" onClick={() => setSelectedVisit(null)}>
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
      </div>
    </div>
  );
}