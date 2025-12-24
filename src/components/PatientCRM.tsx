import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Activity,
  Stethoscope,
  Phone,
  Mail,
  User,
  MapPin,
  Droplet,
  FileText,
  HeartPulse,
  CalendarDays
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import patientServiceBaseUrl from "../patientServiceBaseUrl";

/* =======================
   🔹 TYPES
======================= */

interface Doctor {
  _id?: string;
  name?: string;
}

interface Appointment {
  _id?: string;
  appointmentDate: string;
  appointmentTime: string;
  department: string;
  status: "scheduled" | "completed" | "cancelled" | "needs_reschedule";
  doctor?: Doctor;
}

interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: number;
  duration: number;
}

interface Visit {
  _id?: string;
  visitDate: string;
  doctor?: Doctor;
  symptoms?: string[];
  diagnosis?: string[];
  prescriptions?: Prescription[];
  notes?: string;
}

interface Stage {
  stageName: string;
  description?: string;
  status: "pending" | "ongoing" | "completed";
}

interface TreatmentPlan {
  _id?: string;
  planName: string;
  status: "ongoing" | "completed";
  createdByDoctor?: Doctor;
  stages?: Stage[];
}

interface MedicalHistory {
  conditions: string[];
  allergies: string[];
  surgeries: string[];
  familyHistory: string[];
}
interface Address {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface PatientProfile {
  name: string;
  patientUniqueId: string;
  phone: number;
  email?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  address?: Address;
}

interface Summary {
  totalVisits: number;
  totalSpent: number;
  unpaidAmount: number;
  activeTreatmentPlans: number;
}

interface CRMData {
  patientProfile: PatientProfile;
  medicalHistory: MedicalHistory;
  appointments: Appointment[];
  visitHistory: Visit[];
  treatmentPlans: TreatmentPlan[];
  summary?: Summary;
}

interface ViewAppointment {
  patientId?: {
    patientUniqueId?: string;
  };
  clinicId?: string;
}

interface PatientCRMModalProps {
  viewOpen: boolean;
  setViewOpen: (open: boolean) => void;
  viewAppointment: ViewAppointment | null;
}
interface InfoItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}


const PatientCRMModal: React.FC<PatientCRMModalProps> = ({
  viewOpen,
  setViewOpen,
  viewAppointment,
}) => {
  const [crmData, setCrmData] = useState<CRMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  useEffect(() => {
    const patientUniqueId = viewAppointment?.patientId?.patientUniqueId;
    const clinicId = viewAppointment?.clinicId || "690b0fff66e1bf5813b5ccfc";

    if (!viewOpen || !patientUniqueId) return;

    const fetchCRM = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${patientServiceBaseUrl}/api/v1/patient-service/patient/full-crm?uniqueId=${patientUniqueId}&clinicId=${clinicId}`
        );
        const result = await res.json();

        if (result.success) {
          setCrmData(result.data);
        }
      } catch (err) {
        console.error("CRM fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCRM();
  }, [viewOpen, viewAppointment]);

  if (!viewOpen) return null;

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}
      >
        <div style={{ color: "white", fontSize: "18px" }}>Loading...</div>
      </div>
    );
  }

  if (!crmData) return null;

  const patient = crmData.patientProfile;
  const medical = crmData.medicalHistory;
  const appointments = crmData.appointments ?? [];
  const visits = crmData.visitHistory ?? [];
  const plans = crmData.treatmentPlans ?? [];

  const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: "#f0f9ff", text: "#0369a1" },
    scheduled: { bg: "#f0fdf4", text: "#15803d" },
    cancelled: { bg: "#fef2f2", text: "#dc2626" },
    needs_reschedule: { bg: "#fefce8", text: "#a16207" },
  };
const personalInfoItems: InfoItem[] = [
  { label: "Phone", value: patient.phone, icon: Phone, color: "#2563EB" },
  { label: "Email", value: patient.email || "N/A", icon: Mail, color: "#7C3AED" },
  { label: "Age", value: patient.age || "N/A", icon: Calendar, color: "#EA580C" },
  { label: "Gender", value: patient.gender || "N/A", icon: User, color: "#16A34A" },
  { label: "Blood Group", value: patient.bloodGroup || "N/A", icon: Droplet, color: "#DC2626" },
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
  { label: "Height", value: patient.height || "N/A", icon: Activity, color: "#9333EA" },
  { label: "Weight", value: patient.weight || "N/A", icon: Activity, color: "#DB2777" },
];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#F9FAF9",
          borderRadius: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "2px solid rgba(107, 114, 128, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            background:"linear-gradient(to left, var(--primary), var(--primary-end))"
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
              {patient.name}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.9)",
                margin: "4px 0 0 0",
                fontWeight: "500",
              }}
            >
              Patient ID: {patient.patientUniqueId}
            </p>
          </div>

          <button
            onClick={() => setViewOpen(false)}
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

        {/* Body - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
            backgroundColor: "#F9FAF9",
          }}
        >
          {/* Personal Information */}
        <div
  style={{
    background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9))",
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
      Personal Information
    </h3>
    {/* <button>Add</button> */}
  </div>

  {/* Grid */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 18,
    }}
  >
    {personalInfoItems.map((item, idx) => {
      const Icon = item.icon;

      return (
        <div
          key={idx}
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
                background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 8px 18px ${item.color}55`,
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
                {item.label}
              </p>
              <p
                style={{
                  fontSize: 15,
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
      );
    })}

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
          <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "#64748B" }}>
            Address
          </p>
        <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
            {patient.address 
              ? `${patient.address.line1 || ''}, ${patient.address.city || ''}, ${patient.address.state || ''} ${patient.address.pincode || ''}`.replace(/,\s*,/g, ',').trim()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

       {/* Medical History */}
{medical && (
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
        <HeartPulse size={22} color="#fff" />
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
        Medical History
      </h3>
    </div>

    {/* Grid */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 18,
      }}
    >
      {[
        { label: "Conditions", value: medical.conditions },
        { label: "Allergies", value: medical.allergies },
        { label: "Surgeries", value: medical.surgeries },
        { label: "Family History", value: medical.familyHistory },
      ].map((item, idx) => (
        <div
          key={idx}
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
              fontSize: 11,
              fontWeight: 600,
              margin: 0,
              color: "#64748B",
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </p>

          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginTop: 6,
              color: "#0F172A",
            }}
          >
            {item.value?.length ? item.value.join(", ") : "None"}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
     
{/* Appointments */}
{appointments.length > 0 && (
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
        Appointments ({appointments.length})
      </h3>
    </div>

    {/* Scrollable List */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxHeight: 300,           // ✅ scroll height (same feel as Visit History)
        overflowY: "auto",
        paddingRight: 4,
      }}
    >
      {appointments.map((apt, idx) => {
        const status = statusColors[apt.status];

        return (
          <div
            key={idx}
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
              cursor: "pointer",
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
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                {new Date(apt.appointmentDate).toLocaleDateString()} ·{" "}
                {apt.appointmentTime}
              </p>
              <p style={{ fontSize: 12, margin: "4px 0 0", color: "#64748B" }}>
                Dr. {apt.doctor?.name || "N/A"} · {apt.department}
              </p>
            </div>

            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                backgroundColor: status?.bg,
                color: status?.text,
                whiteSpace: "nowrap",
              }}
            >
              {apt.status}
            </span>
          </div>
        );
      })}
    </div>
  </div>
)}
          {/* Visit History */}
       {visits.length > 0 && (
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
        Visit History ({visits.length})
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
      {visits.map((visit: Visit, idx: number) => {
        const isExpanded = expandedVisitId === visit._id;

        return (
          <div
            key={idx}
            onClick={() =>
              setExpandedVisitId(isExpanded ? null : visit._id || null)
            }
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
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {new Date(visit.visitDate).toLocaleDateString()}
                </p>
                <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                  Dr. {visit.doctor?.name || "N/A"}
                </p>
              </div>

              <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                {isExpanded ? "Collapse ▲" : "Expand ▼"}
              </span>
            </div>

                 {isExpanded && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                }}
              > 
                          <div style={{ marginBottom: "8px" }}>
                            <p
                              style={{
                                fontSize: "11px",
                                color: "hsl(var(--muted-foreground))",
                                margin: "0 0 4px 0",
                                fontWeight: "600",
                              }}
                            >
                              Symptoms:
                            </p>
                            <p
                              style={{
                                fontSize: "13px",
                                margin: 0,
                                color: "hsl(var(--foreground))",
                              }}
                            >
                              {visit.symptoms?.join(", ") || "N/A"}
                            </p>
                          </div>

                          <div style={{ marginBottom: "8px" }}>
                            <p
                              style={{
                                fontSize: "11px",
                                color: "hsl(var(--muted-foreground))",
                                margin: "0 0 4px 0",
                                fontWeight: "600",
                              }}
                            >
                              Diagnosis:
                            </p>
                            <p
                              style={{ fontSize: "13px", margin: 0, color: "hsl(var(--foreground))" }}
                            >
                              {visit.diagnosis?.join(", ") || "N/A"}
                            </p>
                          </div>

                          {visit.prescriptions && visit.prescriptions.length > 0 && (
                            <div>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "hsl(var(--muted-foreground))",
                                  margin: "0 0 4px 0",
                                  fontWeight: "600",
                                }}
                              >
                                Prescriptions:
                              </p>
                              {visit.prescriptions.map(
                                (pres: Prescription, pidx: number) => (
                                  <p
                                    key={pidx}
                                    style={{
                                      fontSize: "12px",
                                      margin: "2px 0",
                                      color: "hsl(var(--foreground))",
                                    }}
                                  >
                                    • {pres.medicineName} - {pres.dosage} (
                                    {pres.frequency} times/day for {pres.duration}{" "}
                                    days)
                                  </p>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Treatment Plans */}
       {plans.length > 0 && (
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
    <h3
      style={{
        fontSize: 19,
        fontWeight: 700,
        marginBottom: 24,
        color: "#0F172A",
        letterSpacing: "-0.3px",
      }}
    >
      Treatment Plans ({plans.length})
    </h3>

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {plans.map((plan: TreatmentPlan, idx: number) => (
        <div
          key={idx}
          style={{
            padding: 22,
            borderRadius: 16,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.9))",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {plan.planName}
            </p>

            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                backgroundColor:
                  plan.status === "ongoing" ? "#fef3c7" : "#dcfce7",
                color:
                  plan.status === "ongoing" ? "#92400e" : "#166534",
              }}
            >
              {plan.status}
            </span>
          </div>

          <p style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
            Created by: {plan.createdByDoctor?.name || "N/A"}
          </p>

          {plan.stages && plan.stages.length > 0 && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {plan.stages.map((stage: Stage, sidx: number) => (
                <div key={sidx} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {stage.stageName} – {stage.status}
                  </p>
                  <p style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}


          {/* Summary */}
          {crmData.summary && (
            <div
              style={{
                backgroundColor: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                padding: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: "0 0 16px 0",
                  color: "hsl(var(--foreground))",
                }}
              >
                Summary
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px",
                }}
              >
                <div>
                  <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", margin: 0 }}>
                    Total Visits
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      margin: "4px 0 0 0",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {crmData.summary.totalVisits}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", margin: 0 }}>
                    Total Spent
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      margin: "4px 0 0 0",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    ₹{crmData.summary.totalSpent}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", margin: 0 }}>
                    Unpaid Amount
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      margin: "4px 0 0 0",
                      color: "hsl(var(--destructive))",
                    }}
                  >
                    ₹{crmData.summary.unpaidAmount}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", margin: 0 }}>
                    Active Plans
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      margin: "4px 0 0 0",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {crmData.summary.activeTreatmentPlans}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCRMModal;