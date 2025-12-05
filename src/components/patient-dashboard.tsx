import { useState,useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Search,
  User,
  Calendar,
  FileText,
  Pill,
  DollarSign,
  Activity,
  Download,
  Eye,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import jsPDF from "jspdf";
import baseUrl from "../baseUrl";

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

interface Patient {
  _id: string;
  name: string;
  phone: number;
  email: string;
  patientUniqueId: string;
  age: number;
}
interface ClinicDetails {
  name: string;
  address?: string;
  phone?: string;
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
  pdf.text(clinicDetails.name || "Clinic Name", pageWidth / 2, 20, { align: "center" });

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  if (clinicDetails.address) {
    pdf.text(clinicDetails.address, pageWidth / 2, 28, { align: "center" });
  }
  if (clinicDetails.phone) {
    pdf.text(`Phone: ${clinicDetails.phone}`, pageWidth / 2, 34, { align: "center" });
  }

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "italic");
  pdf.text("Official Prescription / Visit Summary", pageWidth / 2, 42, { align: "center" });
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
  pdf.text(`Visit Date: ${new Date(visit.visitDate).toLocaleDateString()}`, 20, 110);
  pdf.text(
    `Doctor: ${visit.doctor?.name || "N/A"} (${visit.doctor?.specialization || "N/A"})`,
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
      142 +
      visit.symptoms.length * 8 +
      visit.prescriptions.length * 8 +
      16;

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

  const fileName = `${patient.name.replace(/\s+/g, "_")}_${patient.patientUniqueId}.pdf`;
  pdf.save(fileName);
};


  // Search for patient
  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim()) {
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
            id: patientSearchQuery,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Patient Reports & History</h2>
        <p className="text-muted-foreground">
          Search and view detailed patient medical history
        </p>
      </div>

      {/* Search Section */}
      
  <Card className="bg-muted/60">
  <CardContent className="p-6">
    <div className="flex gap-3 items-center">
      
      <div className="flex-1">
        <Label className="mb-2 block font-medium">Patient ID</Label>
        <Input
          placeholder="Enter Patient Random ID (e.g., PI-995465)"
          value={patientSearchQuery}
          onChange={(e) => setPatientSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handlePatientSearch();
          }}
          className="h-12"
        />
      </div>

      <Button
        onClick={handlePatientSearch}
        disabled={searchLoading}
        className="h-12 min-w-[140px]"
        style={{marginTop:"22px"}}
      >
        <Search className="w-4 h-4 mr-2" />
        {searchLoading ? "Searching..." : "Search"}
      </Button>

      {patient && (
        <Button
          variant="outline"
          onClick={handleClearSearch}
          className="h-12"
          style={{marginTop:"22px"}}
        >
          Clear
        </Button>
      )}
    </div>
  </CardContent>
</Card>



      {/* Patient Info Card */}
      {patient && (
       <Card
  style={{
    background: "rgba(255, 255, 255, 0.2)", // semi-transparent
    backdropFilter: "blur(15px)", // glass blur effect
    WebkitBackdropFilter: "blur(15px)", // Safari support
    border: "1px solid rgba(255, 255, 255, 0.3)", // soft border
    borderRadius: "16px", // rounded corners
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)", // subtle shadow
  }}
>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(0, 123, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User style={{ width: "32px", height: "32px", color: "#007bff" }} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#065f46" }}>
            {patient.name}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "4px 24px",
              marginTop: "8px",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <span style={{ fontWeight: "600" }}>ID:</span> {patient.patientUniqueId}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <span style={{ fontWeight: "600" }}>Age:</span> {patient.age} years
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <span style={{ fontWeight: "600" }}>Phone:</span> {patient.phone}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <span style={{ fontWeight: "600" }}>Email:</span> {patient.email || "N/A"}
            </p>
          </div>
        </div>
      </div>
      <Badge style={{ backgroundColor: "#16a34a", color: "#fff" }}>
        {history.length} Visit{history.length !== 1 ? "s" : ""}
      </Badge>
    </div>
  </CardContent>
</Card>

      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading patient history...</p>
        </div>
      )}

      {/* History List */}
     {!selectedVisit && !loading && history.length > 0 && (
  <div className="grid gap-4">
    {history.map((visit) => (
      <Card
        key={visit._id}
        className="hover:shadow-md transition-shadow cursor-pointer bg-white"
        onClick={() => setSelectedVisit(visit)}
      >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-lg">
                        {formatDate(visit.visitDate)}
                      </span>
                      <Badge
                        variant={
                          visit.status === "completed" ? "default" : "secondary"
                        }
                        className={
                          visit.status === "completed"
                            ? "bg-green-600"
                            : "bg-gray-400"
                        }
                      >
                        {visit.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">Doctor:</span>{" "}
                          {visit.doctor?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">Specialization:</span>{" "}
                          {visit.doctor?.specialization || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">Symptoms:</span>{" "}
                          {visit.symptoms.length} recorded
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">Prescriptions:</span>{" "}
                          {visit.prescriptions.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">Total Amount:</span> ₹
                          {visit.totalAmount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {visit.isPaid ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="text-sm">
                          <span className="font-medium">Payment:</span>{" "}
                          {visit.isPaid ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>

                    {visit.treatmentPlan && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-800">
                          Treatment Plan: {visit.treatmentPlan.planName}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {visit.treatmentPlan.stages.length} stage(s) •{" "}
                          {visit.treatmentPlan.status}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <div className="bg-primary text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Visit Details</h2>
                <p className="text-sm text-white/80 mt-1">
                  {formatDate(selectedVisit.visitDate)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={() => setSelectedVisit(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Doctor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">
                      {selectedVisit.doctor?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-semibold">
                      {selectedVisit.doctor?.specialization || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">
                      {selectedVisit.doctor?.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge
                      className={
                        selectedVisit.status === "completed"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }
                    >
                      {selectedVisit.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Symptoms & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="w-4 h-4" />
                      Symptoms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedVisit.symptoms.map((symptom, idx) => (
                        <li key={idx} className="text-sm">
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-4 h-4" />
                      Diagnosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedVisit.diagnosis.map((diag, idx) => (
                        <li key={idx} className="text-sm">
                          {diag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Prescriptions */}
              {selectedVisit.prescriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedVisit.prescriptions.map((prescription) => (
                        <div
                          key={prescription._id}
                          className="p-4 bg-gray-50 rounded-lg border"
                        >
                          <p className="font-semibold text-lg">
                            {prescription.medicineName}
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-gray-600">Dosage</p>
                              <p className="font-medium">{prescription.dosage}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Frequency</p>
                              <p className="font-medium">
                                {prescription.frequency}/day
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Duration</p>
                              <p className="font-medium">
                                {prescription.duration} days
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedVisit.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Clinical Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedVisit.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Treatment Plan */}
              {selectedVisit.treatmentPlan && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Treatment Plan: {selectedVisit.treatmentPlan.planName}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {selectedVisit.treatmentPlan.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedVisit.treatmentPlan.stages.map((stage, idx) => (
                      <div
                        key={stage._id}
                        className={`p-4 rounded-lg border-2 ${
                          stage.status === "completed"
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            Stage {idx + 1}: {stage.stageName}
                          </h4>
                          <Badge
                            className={
                              stage.status === "completed"
                                ? "bg-green-600"
                                : "bg-gray-400"
                            }
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {stage.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Scheduled: {formatDate(stage.scheduledDate)}
                        </p>
                        {stage.procedures.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-700">
                              Procedures:
                            </p>
                            {stage.procedures.map((proc) => (
                              <div
                                key={proc._id}
                                className="pl-4 text-sm flex items-center gap-2"
                              >
                                {proc.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span>{proc.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Billing */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Billing Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Consultation Fee</p>
                      <p className="text-xl font-bold">
                        ₹{selectedVisit.consultationFee}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-primary">
                        ₹{selectedVisit.totalAmount}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <Badge
                        className={
                          selectedVisit.isPaid
                            ? "bg-green-600"
                            : "bg-orange-600"
                        }
                      >
                        {selectedVisit.isPaid ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3"style={{padding:"10px"}}>
              <Button
                variant="outline"
                onClick={() => setSelectedVisit(null)}
              >
                Close
              </Button>
<Button
  className="bg-primary"
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
  );
}