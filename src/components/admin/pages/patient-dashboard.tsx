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

interface ComplaintItem {
  value: string;
  isCustom: boolean;
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
  patientId: string;
  clinicId: string;
  doctorId: string;
  appointmentId: string;
  chiefComplaints: ComplaintItem[];
  examinationFindings: ComplaintItem[];
  dentalHistory: ComplaintItem[];
  diagnosis: string[];
  prescriptions: Prescription[];
  notes: string;
  files: any[];
  labHistory: any[];
  consultationFee: number;
  totalAmount: number;
  isPaid: boolean;
  status: string;
  createdBy: string;
  referral: {
    status: string;
  };
  dentalWork: any[];
  softTissueExamination: any[];
  tmjExamination: any[];
  plannedProcedures: any[];
  receptionBilling: {
    procedureCharges: any[];
    consumableCharges: any[];
  };
  visitDate: string;
  procedures: any[];
  createdAt: string;
  updatedAt: string;
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

const generateWhatsAppLink = async (patient: Patient) => {
  try {
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/patient/encrypted-link/${patient._id}`
    );
    
    const { secureLink } = response.data.data;
    const lastFourDigits = patient.patientUniqueId.slice(-4);
    
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
// ─────────────────────────────────────────────────────────────────────────────
//  HOW TO USE CUSTOM ASSETS
//
//  1. Caduceus logo PNG (top-right & watermark):
//     https://www.flaticon.com/free-icon/caduceus_2382461
//     (free with attribution) — or any transparent-bg caduceus PNG you prefer.
//     Pass the base64 data-URL string as:  clinicDetails.caduceusLogoBase64
//
//  2. Clinic logo (top-left, replaces the doctor-symbol placeholder):
//     Pass the base64 data-URL string as:  clinicDetails.logoBase64
//
//  If neither is supplied the function falls back to drawn vector shapes.
// ─────────────────────────────────────────────────────────────────────────────

const downloadReport = (
  patient: Patient,
  visit: PatientHistory,
  clinicDetails: ClinicDetails,
) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const PW = pdf.internal.pageSize.getWidth();    // 210
    const PH = pdf.internal.pageSize.getHeight();   // 297

    // ── Palette ───────────────────────────────────────────────────────────────
    const BLUE      : [number,number,number] = [41,  128, 185];
    const BLUE_DARK : [number,number,number] = [21,  96,  150];
    const BLUE_BG   : [number,number,number] = [232, 244, 253];   // very light blue page tint
    const BLUE_WM   : [number,number,number] = [210, 230, 248];   // watermark colour
    const WHITE     : [number,number,number] = [255, 255, 255];
    const DARK      : [number,number,number] = [25,  25,  25];
    const GREY      : [number,number,number] = [110, 110, 110];
    const LINE      : [number,number,number] = [180, 200, 220];
    const GREEN     : [number,number,number] = [39,  174, 96];
    const RED       : [number,number,number] = [192, 57,  43];

    // ── Shortcuts ─────────────────────────────────────────────────────────────
    const fc = (...c: [number,number,number]) => pdf.setFillColor(...c);
    const dc = (...c: [number,number,number]) => pdf.setDrawColor(...c);
    const tc = (...c: [number,number,number]) => pdf.setTextColor(...c);
    const lw = (n: number)                    => pdf.setLineWidth(n);
    const B  = (sz: number) => { pdf.setFont("helvetica", "bold");   pdf.setFontSize(sz); };
    const N  = (sz: number) => { pdf.setFont("helvetica", "normal"); pdf.setFontSize(sz); };
    const I  = (sz: number) => { pdf.setFont("helvetica", "italic"); pdf.setFontSize(sz); };
    const T  = (s: string, x: number, y: number, o?: any) => pdf.text(String(s ?? ""), x, y, o);

    const safe = (v: any, fb = ""): string => {
      if (v === null || v === undefined) return fb;
      if (typeof v === "object") return fb;
      return String(v).trim() || fb;
    };
    const noDr = (n: string) => n.replace(/^\s*dr\.?\s*/i, "").trim();
    const Rs   = (n: number) => `Rs. ${n}`;

    const M  = 16;   // page margin
    const CW = PW - M * 2;

    // ── Asset references ──────────────────────────────────────────────────────
    const clinicAny      = clinicDetails as any;
    const logoB64        = clinicAny?.logoBase64        as string | undefined;
    const caduceusB64    = clinicAny?.caduceusLogoBase64 as string | undefined;

    // =========================================================================
    // 0.  PAGE BACKGROUND  (very light blue tint — matches reference)
    // =========================================================================
    fc(...BLUE_BG);
    pdf.rect(0, 0, PW, PH, "F");

    // White content card (inset slightly)
    fc(...WHITE);
    pdf.rect(6, 6, PW - 12, PH - 12, "F");

    // =========================================================================
    // 1.  HEADER  — Doctor name top-left, Caduceus top-right
    // =========================================================================
    const HDR_TOP  = 14;

    // Top accent bar (thin blue strip at very top like reference)
    fc(...BLUE_DARK);
    pdf.rect(6, 6, PW - 12, 3, "F");

    // ── Caduceus / clinic logo  top-right ────────────────────────────────────
    const LOGO_SIZE = 26;
    const LOGO_X    = PW - M - LOGO_SIZE;
    const LOGO_Y    = HDR_TOP - 2;

    if (logoB64) {
      try   { pdf.addImage(logoB64, "PNG", LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE); }
      catch (_) { drawCaduceus(LOGO_X, LOGO_Y, LOGO_SIZE, BLUE_DARK); }
    } else if (caduceusB64) {
      try   { pdf.addImage(caduceusB64, "PNG", LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE); }
      catch (_) { drawCaduceus(LOGO_X, LOGO_Y, LOGO_SIZE, BLUE_DARK); }
    } else {
      drawCaduceus(LOGO_X, LOGO_Y, LOGO_SIZE, BLUE_DARK);
    }

    // ── Doctor name + qualification  top-left ────────────────────────────────
    const dRaw   = visit?.doctor as any;
    const dName  = noDr(safe(dRaw?.name));
    const dSpec  = safe(dRaw?.specialization || dRaw?.qualification);
    const dReg   = safe(dRaw?.registrationNo || dRaw?.regNo);
    const dPhone = safe(dRaw?.phone || dRaw?.contact);

    B(20); tc(...BLUE_DARK);
    T(dName ? `Dr. ${dName}` : "Doctor Name", M, HDR_TOP + 8);

    B(9); tc(...GREY);
    if (dSpec) T(dSpec.toUpperCase(), M, HDR_TOP + 15);

    N(8); tc(...GREY);
    let certY = HDR_TOP + 23;
    if (dReg)   { T(`Reg. No: ${dReg}`,   M, certY); certY += 5.5; }
    if (dPhone) { T(`Ph: ${dPhone}`,       M, certY); }

    // Horizontal rule under header
    lw(0.4); dc(...LINE);
    pdf.line(M, HDR_TOP + 30, PW - M, HDR_TOP + 30);

    // =========================================================================
    // 2.  PATIENT INFO  (label + underline fields like the reference)
    // =========================================================================
    const PI_Y = HDR_TOP + 38;

    const drawField = (label: string, value: string, x: number, y: number, w: number) => {
      N(8); tc(...GREY);
      T(`${label}:`, x, y);
      const lw2 = pdf.getTextWidth(`${label}:`);
      N(9); tc(...DARK);
      T(value, x + lw2 + 2, y);
      lw(0.3); dc(...LINE);
      pdf.line(x, y + 1.5, x + w, y + 1.5);
    };

    const pName  = safe(patient?.name,              "________________");
    const pAge   = patient?.age ? safe(patient.age) + " yrs" : "______";
    const pPhone = safe(patient?.phone,             "_______________");
    const pId    = safe(patient?.patientUniqueId,   "______");
    const pEmail = safe((patient as any)?.email,    "");
    const visitDate = visit?.visitDate
      ? new Date(visit.visitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "____________";

    // Row 1: Patient Name (full width)
    drawField("Patient Name", pName,    M,           PI_Y,      CW);
    // Row 2: Address (if available, else phone)
    drawField("Ph / ID",      `${pPhone}  |  ID: ${pId}`,  M, PI_Y + 9,  CW);
    // Row 3: Age | Date
    drawField("Age",          pAge,     M,           PI_Y + 18, CW * 0.35);
    drawField("Date",         visitDate,M + CW * 0.42, PI_Y + 18, CW * 0.55);
    // Row 4: Diagnosis (first diagnosis as summary line)
   const firstDiag = visit?.diagnosis?.length
  ? safe(visit.diagnosis[0], "________________")
  : "________________";
    drawField("Diagnosis", firstDiag,   M,           PI_Y + 27, CW);

    // =========================================================================
    // 3.  WATERMARK CADUCEUS  (centre of page, large, light blue)
    // =========================================================================
    const WM_SIZE = 90;
    const WM_X    = (PW - WM_SIZE) / 2;
    const WM_Y    = PI_Y + 42;

    if (caduceusB64) {
      try {
        // Draw as very transparent — jsPDF can't set opacity natively,
        // so we just draw it at low-contrast colour by using GState hack:
        // Instead, draw the image and overlay a near-white rect on top
        pdf.addImage(caduceusB64, "PNG", WM_X, WM_Y, WM_SIZE, WM_SIZE);
        fc(255, 255, 255);
        (pdf as any).setGState && (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.82 }));
        pdf.rect(WM_X, WM_Y, WM_SIZE, WM_SIZE, "F");
        (pdf as any).setGState && (pdf as any).setGState(new (pdf as any).GState({ opacity: 1 }));
      } catch (_) {
        drawCaduceus(WM_X + WM_SIZE * 0.25, WM_Y, WM_SIZE * 0.5, BLUE_WM);
      }
    } else {
      drawCaduceus(WM_X + WM_SIZE * 0.2, WM_Y + 4, WM_SIZE * 0.6, BLUE_WM);
    }

    // =========================================================================
    // 4.  Rx  SYMBOL  +  CONTENT  (on top of watermark)
    // =========================================================================
    let y = PI_Y + 46;

    B(32); tc(...BLUE_DARK);
    // T("Rx", M, y + 8);
    lw(0.5); dc(...BLUE_DARK);
    pdf.line(M, y + 10, M + 14, y + 10);
    y += 18;

    // ── Section heading ───────────────────────────────────────────────────────
    const sec = (label: string) => {
      if (y > 220) { pdf.addPage(); resetPage(); }
      B(8.5); tc(...BLUE_DARK);
      T(label.toUpperCase(), M, y);
      lw(0.25); dc(...BLUE);
      pdf.line(M, y + 1.5, PW - M, y + 1.5);
      y += 7;
    };

    const bullet = (text: string) => {
      if (y > 238) { pdf.addPage(); resetPage(); }
      const lines = pdf.splitTextToSize(text, CW - 8);
      N(9.5); tc(...DARK);
      fc(...BLUE_DARK);
      pdf.circle(M + 2, y - 1.3, 0.8, "F");
      lines.forEach((ln: string, i: number) => T(ln, M + 6, y + i * 5.5));
      y += lines.length * 5.5 + 2;
    };

    const renderList = (heading: string, items: any[]) => {
      if (!Array.isArray(items) || !items.length) return;
      sec(heading);
      items.forEach((item: any) => {
        const v = typeof item === "object"
          ? safe(item.value || item.name || item.label, "Unknown")
          : safe(item, "Unknown");
        bullet(v);
      });
      y += 3;
    };

    renderList("Chief Complaints",     visit?.chiefComplaints     ?? []);
    renderList("Examination Findings", visit?.examinationFindings ?? []);
    renderList("Dental History",       visit?.dentalHistory       ?? []);

    // Full diagnosis list (beyond the single header line above)
    if (Array.isArray(visit?.diagnosis) && visit.diagnosis.length > 1) {
      sec("All Diagnoses");
      visit.diagnosis.forEach((d: any) => {
        bullet(typeof d === "object"
          ? safe(d.value || d.name || d.label, "Unknown")
          : safe(d, "Unknown"));
      });
      y += 3;
    }

    // ── Prescriptions table ───────────────────────────────────────────────────
    if (Array.isArray(visit?.prescriptions) && visit.prescriptions.length) {
      if (y > 180) { pdf.addPage(); resetPage(); }

      sec("Prescriptions");

      const col = { med: M, dos: M+62, frq: M+92, dur: M+132, qty: M+157 };
      const RH  = 8.5;

      fc(...BLUE_DARK); dc(...BLUE_DARK); lw(0);
      pdf.rect(M, y, CW, RH, "F");
      B(8); tc(...WHITE);
      T("MEDICINE",  col.med+2, y+5.8);
      T("DOSAGE",    col.dos+2, y+5.8);
      T("FREQUENCY", col.frq+2, y+5.8);
      T("DURATION",  col.dur+2, y+5.8);
      T("QTY",       col.qty+2, y+5.8);
      y += RH;

      visit.prescriptions.forEach((p: any, i: number) => {
        if (y > 240) { pdf.addPage(); resetPage(); }
        fc(i%2===0?255:244, i%2===0?255:249, i%2===0?255:255);
        dc(...LINE); lw(0.2);
        pdf.rect(M, y, CW, RH, "FD");
        N(9); tc(...DARK);
        if (p && typeof p === "object") {
          T(safe(p.medicineName,"—"),                          col.med+2, y+5.8);
          T(safe(p.dosage,"—"),                               col.dos+2, y+5.8);
          T(safe(p.frequency,"—"),                            col.frq+2, y+5.8);
          T(p.duration?`${safe(p.duration)} days`:"—",        col.dur+2, y+5.8);
          T(safe(p.quantity||p.qty,"—"),                      col.qty+2, y+5.8);
        } else { T(safe(p,"—"), col.med+2, y+5.8); }
        y += RH;
      });
      y += 6;
    }

    // ── Notes ─────────────────────────────────────────────────────────────────
    if (visit?.notes && typeof visit.notes === "string" && visit.notes.trim()) {
      if (y > 215) { pdf.addPage(); resetPage(); }
      sec("Doctor's Notes & Instructions");
      N(9.5); tc(...DARK);
      pdf.splitTextToSize(visit.notes.trim(), CW - 4).forEach((ln: string) => {
        if (y > 240) { pdf.addPage(); resetPage(); }
        T(ln, M+2, y); y += 5.5;
      });
      y += 5;
    }

    // =========================================================================
    // 5.  SIGNATURE  (bottom-right, above footer — like reference)
    // =========================================================================
    const SIG_Y = Math.max(y + 10, PH - 60);
    lw(0.5); dc(...GREY);
    pdf.line(PW - M - 55, SIG_Y, PW - M, SIG_Y);
    N(8); tc(...GREY);
    T("SIGNATURE", PW - M - 28, SIG_Y + 5, { align: "center" });

    // Billing (left of signature)
    const BILL_W = CW * 0.52;
    const BILL_Y = SIG_Y - 18;
    fc(232, 244, 253); dc(...LINE); lw(0.4);
    pdf.roundedRect(M, BILL_Y, BILL_W, 32, 2, 2, "FD");

    B(9); tc(...BLUE_DARK);
    T("BILLING SUMMARY", M+5, BILL_Y+8);
    lw(0.2); dc(...LINE);
    pdf.line(M+5, BILL_Y+10, M+BILL_W-5, BILL_Y+10);

    const cFee  = typeof visit?.consultationFee === "number" ? visit.consultationFee : 0;
    const total = typeof visit?.totalAmount === "number" ? visit.totalAmount : 0;
    N(9); tc(...DARK);
    T("Consultation Fee :", M+5, BILL_Y+18); B(9); T(Rs(cFee), M+55, BILL_Y+18);
    N(9); tc(...DARK);
    T("Total Amount :",     M+5, BILL_Y+26); B(11); tc(...BLUE_DARK); T(Rs(total), M+55, BILL_Y+26);

    // const paid = !!visit?.isPaid;
    // fc(...(paid ? GREEN : RED)); dc(...(paid ? GREEN : RED)); lw(0);
    // pdf.roundedRect(M+5, BILL_Y+28, 26, 7, 1.5, 1.5, "F");
    // B(8); tc(...WHITE);
    // T(paid?"PAID":"UNPAID", M+18, BILL_Y+33, { align:"center" });

    // =========================================================================
    // 6.  FOOTER BAR  — matches reference exactly
    //     | HOSPITAL + slogan | phone lines | email | address | website |
    // =========================================================================
    const FH   = 22;
    const FY   = PH - FH - 6;

    fc(...BLUE_DARK);
    pdf.rect(6, FY, PW-12, FH, "F");

    // Clinic name + slogan
    B(11); tc(...WHITE);
    T(safe(clinicDetails?.name, "CLINIC"), M+2, FY+8);
    N(7);  tc(180, 215, 240);
    T(safe(clinicAny?.slogan, "Healthcare with Care"), M+2, FY+14);

    // Divider
    lw(0.3); dc(100, 150, 200);
    pdf.line(M + 44, FY+3, M+44, FY+FH-3);

    // Phone block
    const ph1 = safe(clinicDetails?.phone);
    const ph2 = safe(clinicAny?.phone2);
    N(7.5); tc(...WHITE);
    if (ph1) T(ph1, M+49, FY+8);
    if (ph2) T(ph2, M+49, FY+14);

    lw(0.3); dc(100, 150, 200);
    pdf.line(M+82, FY+3, M+82, FY+FH-3);

    // Email
    const email = safe(clinicAny?.email);
    N(7.5); tc(...WHITE);
    if (email) T(email, M+86, FY+8);

    lw(0.3); dc(100, 150, 200);
    pdf.line(M+120, FY+3, M+120, FY+FH-3);

    // Address
    const addr = typeof clinicDetails?.address === "string" ? clinicDetails.address : "";
    if (addr) { N(7); tc(...WHITE); T(addr, M+124, FY+8, { maxWidth: 46 }); }

    lw(0.3); dc(100, 150, 200);
    pdf.line(M+158, FY+3, M+158, FY+FH-3);

    // Website
    const web = safe(clinicAny?.website);
    if (web) { N(7.5); tc(...WHITE); T(web, M+162, FY+8); }

    // ── Save ──────────────────────────────────────────────────────────────────
    const fname = safe(patient?.name, "patient").replace(/\s+/g, "_");
    const fid   = safe(patient?.patientUniqueId, "unknown");
    pdf.save(`Rx_${fname}_${fid}.pdf`);

    // =========================================================================
    //  HELPERS
    // =========================================================================
    function resetPage() {
      // Repaint background on new page
      y = 18;
      fc(...BLUE_BG); pdf.rect(0,0,PW,PH,"F");
      fc(...WHITE);   pdf.rect(6,6,PW-12,PH-12,"F");
      fc(...BLUE_DARK); pdf.rect(6,6,PW-12,3,"F");
      drawCaduceus(WM_X + WM_SIZE*0.2, WM_Y*0.3, WM_SIZE*0.6, BLUE_WM);
    }

    /**
     * drawCaduceus — draws a simplified caduceus symbol (staff + wings + snakes)
     * using only jsPDF primitives. All sizes relative to the bounding box.
     * @param x    top-left x
     * @param y    top-left y
     * @param size bounding box size (square)
     * @param color fill/stroke colour
     */
    function drawCaduceus(
      x: number, y: number, size: number,
      color: [number,number,number]
    ) {
      fc(...color); dc(...color);
      const s  = size / 28;  // scale factor
      const cx = x + size / 2;

      // ── Staff (vertical rod) ────────────────────────────────────────────────
      lw(s * 1.6);
      pdf.line(cx, y + s*2, cx, y + size - s*2);

      // ── Top sphere ──────────────────────────────────────────────────────────
      lw(0);
      pdf.circle(cx, y + s*2, s*2, "F");

      // ── Wings (left + right arcs approximated as bezier-like polylines) ─────
      const wingY   = y + s * 7;
      const wingW   = s * 11;
      const wingH   = s * 5;
      const steps   = 12;

      // Left wing
      lw(s * 0.8);
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        const wx1 = cx - t1 * wingW;
        const wy1 = wingY - Math.sin(t1 * Math.PI) * wingH;
        const wx2 = cx - t2 * wingW;
        const wy2 = wingY - Math.sin(t2 * Math.PI) * wingH;
        pdf.line(wx1, wy1, wx2, wy2);
      }
      // Right wing
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        const wx1 = cx + t1 * wingW;
        const wy1 = wingY - Math.sin(t1 * Math.PI) * wingH;
        const wx2 = cx + t2 * wingW;
        const wy2 = wingY - Math.sin(t2 * Math.PI) * wingH;
        pdf.line(wx1, wy1, wx2, wy2);
      }

      // ── Two snakes (sinusoidal curves along the staff) ────────────────────
      const snakeTop    = y + s * 5;
      const snakeBottom = y + size - s * 5;
      const snakeH      = snakeBottom - snakeTop;
      const snakeSteps  = 30;
      const snakeAmp    = s * 3.5;

      lw(s * 1.1);

      // Snake 1 (starts left, wraps right)
      for (let i = 0; i < snakeSteps; i++) {
        const t1 = i / snakeSteps;
        const t2 = (i + 1) / snakeSteps;
        const sy1 = snakeTop  + t1 * snakeH;
        const sy2 = snakeTop  + t2 * snakeH;
        const sx1 = cx + Math.sin(t1 * Math.PI * 3.5) * snakeAmp;
        const sx2 = cx + Math.sin(t2 * Math.PI * 3.5) * snakeAmp;
        pdf.line(sx1, sy1, sx2, sy2);
      }

      // Snake 2 (offset by π — starts right, wraps left)
      for (let i = 0; i < snakeSteps; i++) {
        const t1 = i / snakeSteps;
        const t2 = (i + 1) / snakeSteps;
        const sy1 = snakeTop + t1 * snakeH;
        const sy2 = snakeTop + t2 * snakeH;
        const sx1 = cx + Math.sin(t1 * Math.PI * 3.5 + Math.PI) * snakeAmp;
        const sx2 = cx + Math.sin(t2 * Math.PI * 3.5 + Math.PI) * snakeAmp;
        pdf.line(sx1, sy1, sx2, sy2);
      }

      // Snake heads at bottom
      lw(0);
      pdf.circle(cx - snakeAmp * 0.3, snakeBottom, s * 1.4, "F");
      pdf.circle(cx + snakeAmp * 0.3, snakeBottom, s * 1.4, "F");
    }

  } catch (err) {
    console.error("Prescription PDF error:", err);
    alert("Failed to generate PDF. Check console for details.");
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
      console.log("Patient History Response:", res.data);

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

  // Helper function to get complaint values as strings
  const getComplaintValues = (complaints: ComplaintItem[] | undefined): string[] => {
    if (!complaints || !Array.isArray(complaints)) return [];
    return complaints.map(c => c.value);
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
                        onClick={() => {
                          console.log("🖱️ CLICKED VISIT:", visit);
                          console.log("🖱️ VISIT ID:", visit?._id);
                          console.log("🖱️ PRESCRIPTIONS:", visit?.prescriptions);
                          console.log("🖱️ DOCTOR:", visit?.doctor);
                          setSelectedVisit(visit);
                        }}
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
                              <strong>Chief Complaints:</strong>{" "}
                              {Array.isArray(visit?.chiefComplaints)
                                ? visit.chiefComplaints.length
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

                {/* Chief Complaints & Diagnosis */}
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
                        Chief Complaints
                      </h3>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {selectedVisit?.chiefComplaints?.map((complaint, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: 14,
                            color: "#475569",
                            padding: "8px 0",
                            borderBottom:
                              idx < selectedVisit.chiefComplaints.length - 1
                                ? "1px solid rgba(0,0,0,0.05)"
                                : "none",
                          }}
                        >
                          • {complaint.value}
                          {complaint.isCustom && (
                            <span style={{ color: "#F59E0B", marginLeft: 4 }}>
                              (Custom)
                            </span>
                          )}
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

                {/* Examination Findings & Dental History */}
                {selectedVisit.examinationFindings?.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 28,
                      marginBottom: 28,
                    }}
                  >
                    {selectedVisit.examinationFindings?.length > 0 && (
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
                                "linear-gradient(135deg, #06B6D4, #22D3EE)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 8px 20px rgba(6,182,212,0.35)",
                            }}
                          >
                            <Stethoscope size={22} color="#fff" />
                          </div>
                          <h3
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              margin: 0,
                              color: "#0F172A",
                            }}
                          >
                            Examination Findings
                          </h3>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {selectedVisit.examinationFindings.map((finding, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontSize: 14,
                                color: "#475569",
                                padding: "8px 0",
                                borderBottom:
                                  idx < selectedVisit.examinationFindings.length - 1
                                    ? "1px solid rgba(0,0,0,0.05)"
                                    : "none",
                              }}
                            >
                              • {finding.value}
                              {finding.isCustom && (
                                <span style={{ color: "#06B6D4", marginLeft: 4 }}>
                                  (Custom)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedVisit.dentalHistory?.length > 0 && (
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
                                "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 8px 20px rgba(139,92,246,0.35)",
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
                            Dental History
                          </h3>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {selectedVisit.dentalHistory.map((history, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontSize: 14,
                                color: "#475569",
                                padding: "8px 0",
                                borderBottom:
                                  idx < selectedVisit.dentalHistory.length - 1
                                    ? "1px solid rgba(0,0,0,0.05)"
                                    : "none",
                              }}
                            >
                              • {history.value}
                              {history.isCustom && (
                                <span style={{ color: "#8B5CF6", marginLeft: 4 }}>
                                  (Custom)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

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