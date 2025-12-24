import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Pill,
  Activity,
  ClipboardList,
  Image,
  Download,
  Filter,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import styles from "../styles/PatientMedicalHistory.module.css";
import axios from "axios";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  _id: string;
}

interface Procedure {
  name: string;
  description?: string;
  fee: number;
  _id: string;
}

interface FileAttachment {
  url: string;
  type: string;
  uploadedAt: string;
  _id: string;
}

interface Doctor {
  name: string;
  phoneNumber: number;
  specialization: string;
}

interface MedicalRecord {
  _id: string;
  doctorId: string;
  appointmentId: string;
  symptoms: string[];
  diagnosis: string[];
  prescriptions: Prescription[];
  notes: string;
  files: FileAttachment[];
  consultationFee: number;
  procedures: Procedure[];
  totalAmount: number;
  isPaid: boolean;
  status: string;
  visitDate: string;
  createdAt: string;
  doctor: Doctor | null;
  treatmentPlan: any;
}

interface PatientMedicalHistoryProps {
  patient: any;
  onBack: () => void;
}

export default function PatientMedicalHistory({
  patient,
  onBack,
}: PatientMedicalHistoryProps) {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMedicalHistory();
  }, [patient]);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/patient-history/${patient._id}?clinicId=${patient.clinicId}`
      );
      setMedicalRecords(response.data.data || []);
    } catch (error) {
      console.error("Error fetching medical history:", error);
      setMedicalRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const filteredRecords = medicalRecords.filter((record) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "completed") return record.status === "completed";
    if (filterStatus === "pending") return record.status === "pending";
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading medical history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          <span>Back to Patient List</span>
        </button>

        <div className={styles.patientCard}>
          <div className={styles.patientInfo}>
            <div className={styles.avatar}>
              <User className={styles.avatarIcon} />
            </div>
            <div>
              <h1 className={styles.patientName}>{patient.name}</h1>
              <p className={styles.patientId}>ID: {patient.patientUniqueId}</p>
              <p className={styles.patientDetails}>
                {patient.age} years • {patient.gender}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#DBEAFE" }}>
            <FileText style={{ color: "#2563EB" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Visits</p>
            <p className={styles.summaryValue}>{medicalRecords.length}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#FEF3C7" }}>
            <Pill style={{ color: "#D97706" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Prescriptions</p>
            <p className={styles.summaryValue}>
              {medicalRecords.reduce(
                (sum, record) => sum + record.prescriptions.length,
                0
              )}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#E9D5FF" }}>
            <Activity style={{ color: "#9333EA" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Procedures Done</p>
            <p className={styles.summaryValue}>
              {medicalRecords.reduce(
                (sum, record) => sum + record.procedures.length,
                0
              )}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#D1FAE5" }}>
            <Calendar style={{ color: "#059669" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Last Visit</p>
            <p className={styles.summaryValue}>
              {medicalRecords.length > 0
                ? new Date(medicalRecords[0].visitDate).toLocaleDateString(
                    "en-IN",
                    { month: "short", day: "numeric" }
                  )
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <Filter className={styles.filterIcon} />
        <div className={styles.filterButtons}>
          {["all", "completed", "pending"].map((filter) => (
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

      {/* Medical Records Timeline */}
      <div className={styles.timelineContainer}>
        {filteredRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText className={styles.emptyIcon} />
            <p>No medical records found</p>
          </div>
        ) : (
          filteredRecords.map((record, index) => (
            <div key={record._id} className={styles.timelineItem}>
              <div className={styles.timelineDot}></div>
              {index < filteredRecords.length - 1 && (
                <div className={styles.timelineLine}></div>
              )}

              <div className={styles.recordCard}>
                {/* Record Header */}
                <div className={styles.recordHeader}>
                  <div className={styles.recordHeaderLeft}>
                    <div className={styles.recordDate}>
                      <Calendar className={styles.recordIcon} />
                      {formatDate(record.visitDate)}
                    </div>
                    <div className={styles.recordDoctor}>
                      <Stethoscope className={styles.recordIcon} />
                      {record.doctor
                        ? `${record.doctor.name} - ${record.doctor.specialization}`
                        : "Doctor Not Assigned"}
                    </div>
                  </div>
                  <div className={styles.recordHeaderRight}>
                    <span
                      className={`${styles.statusBadge} ${
                        record.status === "completed"
                          ? styles.statusCompleted
                          : styles.statusPending
                      }`}
                    >
                      {record.status}
                    </span>
                    <button
                      onClick={() => toggleRecordExpansion(record._id)}
                      className={styles.expandButton}
                    >
                      {expandedRecords.has(record._id) ? "Show Less" : "Show More"}
                    </button>
                  </div>
                </div>

                {/* Quick Info - Always Visible */}
                <div className={styles.quickInfo}>
                  <div className={styles.infoItem}>
                    <AlertCircle className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Symptoms</p>
                      <p className={styles.infoValue}>
                        {record.symptoms.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <ClipboardList className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Diagnosis</p>
                      <p className={styles.infoValue}>
                        {record.diagnosis.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRecords.has(record._id) && (
                  <div className={styles.expandedContent}>
                    {/* Prescriptions */}
                    {record.prescriptions.length > 0 && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          <Pill className={styles.sectionIcon} />
                          Prescriptions
                        </h4>
                        <div className={styles.prescriptionGrid}>
                          {record.prescriptions.map((prescription) => (
                            <div
                              key={prescription._id}
                              className={styles.prescriptionCard}
                            >
                              <p className={styles.medicineName}>
                                {prescription.medicineName}
                              </p>
                              <div className={styles.prescriptionDetails}>
                                <span>Dosage: {prescription.dosage}</span>
                                <span>Frequency: {prescription.frequency}</span>
                                <span>Duration: {prescription.duration} days</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Procedures */}
                    {record.procedures.length > 0 && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          <Activity className={styles.sectionIcon} />
                          Procedures
                        </h4>
                        <div className={styles.procedureList}>
                          {record.procedures.map((procedure) => (
                            <div key={procedure._id} className={styles.procedureItem}>
                              <div>
                                <p className={styles.procedureName}>
                                  {procedure.name}
                                </p>
                                {procedure.description && (
                                  <p className={styles.procedureDescription}>
                                    {procedure.description}
                                  </p>
                                )}
                              </div>
                              <span className={styles.procedureFee}>
                                {formatCurrency(procedure.fee)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {record.notes && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          <FileText className={styles.sectionIcon} />
                          Doctor's Notes
                        </h4>
                        <p className={styles.notesText}>{record.notes}</p>
                      </div>
                    )}

                    {/* Files/Images */}
                    {record.files.length > 0 && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.sectionTitle}>
                          <Image className={styles.sectionIcon} />
                          Attachments
                        </h4>
                        <div className={styles.filesGrid}>
                          {record.files.map((file) => (
                            <div key={file._id} className={styles.fileCard}>
                              {file.type === "image" ? (
                                <div className={styles.imagePreview}>
                                  <img
                                    src={file.url}
                                    alt="Medical attachment"
                                    className={styles.image}
                                  />
                                </div>
                              ) : (
                                <div className={styles.fileIcon}>
                                  <FileText />
                                </div>
                              )}
                              <button className={styles.downloadButton}>
                                <Download className={styles.downloadIcon} />
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Billing Info */}
                    <div className={styles.billingSection}>
                      <div className={styles.billingItem}>
                        <span>Consultation Fee:</span>
                        <span>{formatCurrency(record.consultationFee)}</span>
                      </div>
                      {record.procedures.length > 0 && (
                        <div className={styles.billingItem}>
                          <span>Procedures:</span>
                          <span>
                            {formatCurrency(
                              record.procedures.reduce(
                                (sum, p) => sum + p.fee,
                                0
                              )
                            )}
                          </span>
                        </div>
                      )}
                      <div className={styles.billingTotal}>
                        <span>Total Amount:</span>
                        <span>{formatCurrency(record.totalAmount)}</span>
                      </div>
                      <div className={styles.paymentStatus}>
                        <span>Payment Status:</span>
                        <span
                          className={
                            record.isPaid
                              ? styles.paymentPaid
                              : styles.paymentUnpaid
                          }
                        >
                          {record.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedRecord && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Medical Record Details</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            {/* Modal content can be expanded similar to the card view */}
          </div>
        </div>
      )}
    </div>
  );
}