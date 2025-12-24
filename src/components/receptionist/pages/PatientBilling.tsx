import { useState, useEffect } from "react";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Filter,
} from "lucide-react";
import styles from "../styles/PatientBilling.module.css";
import axios from "axios";
import billingServiceBaseUrl from "../../../billingServiceBaseUrl";
import { log } from "node:console";
interface Procedure {
  name: string;
  cost: number;
}

interface Bill {
  billType: string;
  visitId: string;
  date: string;
  consultationFee: number;
  procedures: Procedure[];
  procedureTotal: number;
  totalAmount: number;
  doctor?: string;
  symptoms: string[];
  diagnosis: string[];
  isPaid: boolean;
}

interface BillingSummary {
  patientId: string;
  totalBills: number;
  totalConsultations: number;
  totalPharmacyOrders: number;
  consultationTotal: number;
  pharmacyTotal: number;
  grandTotal: number;
}

interface BillingData {
  summary: BillingSummary;
  bills: Bill[];
}

interface PatientBillingProps {
  patient: any;
  onBack: () => void;
}

export default function PatientBilling({ patient, onBack }: PatientBillingProps) {
    console.log("Rendering PatientBilling for patient:", patient);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, [patient]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await axios.get(
        `${billingServiceBaseUrl}/api/v1/billing/patient/${patient._id}/complete-bills?clinicId=${patient.clinicId}`
      );
      console.log(response);
      
      setBillingData(response.data.data);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = billingData?.bills.filter((bill) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "paid") return bill.isPaid;
    if (filterStatus === "unpaid") return !bill.isPaid;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Failed to load billing data</p>
          <button onClick={onBack} className={styles.backButton}>
            Go Back
          </button>
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

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#DBEAFE" }}>
            <FileText style={{ color: "#2563EB" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Bills</p>
            <p className={styles.summaryValue}>{billingData.summary.totalBills}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#D1FAE5" }}>
            <DollarSign style={{ color: "#059669" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Grand Total</p>
            <p className={styles.summaryValue}>
              {formatCurrency(billingData.summary.grandTotal)}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#FEE2E2" }}>
            <XCircle style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Unpaid Bills</p>
            <p className={styles.summaryValue}>
              {billingData.bills.filter((b) => !b.isPaid).length}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ backgroundColor: "#E9D5FF" }}>
            <CheckCircle style={{ color: "#9333EA" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Paid Bills</p>
            <p className={styles.summaryValue}>
              {billingData.bills.filter((b) => b.isPaid).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <Filter className={styles.filterIcon} />
        <div className={styles.filterButtons}>
          {["all", "paid", "unpaid"].map((filter) => (
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

      {/* Bills Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Date</th>
                <th className={styles.tableHeader}>Visit ID</th>
                <th className={styles.tableHeader}>Doctor</th>
                <th className={styles.tableHeader}>Services</th>
                <th className={styles.tableHeader}>Amount</th>
                <th className={styles.tableHeader}>Status</th>
                <th className={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills?.map((bill) => (
                <tr key={bill.visitId} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.dateCell}>
                      <Calendar className={styles.dateIcon} />
                      {formatDate(bill.date)}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={styles.visitId}>
                      {bill.visitId.slice(-8)}
                    </span>
                  </td>
                  <td className={styles.tableCell}>{bill.doctor || "N/A"}</td>
                  <td className={styles.tableCell}>
                    <div>
                      <div>Consultation: {formatCurrency(bill.consultationFee)}</div>
                      {bill.procedures.length > 0 && (
                        <div className={styles.proceduresList}>
                          {bill.procedures.map((p, i) => (
                            <div key={i}>
                              {p.name}: {formatCurrency(p.cost)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={styles.amount}>
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    {bill.isPaid ? (
                      <span className={styles.statusBadgePaid}>
                        <CheckCircle className={styles.statusIcon} />
                        Paid
                      </span>
                    ) : (
                      <span className={styles.statusBadgeUnpaid}>
                        <XCircle className={styles.statusIcon} />
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className={styles.tableCell}>
                    <button
                      onClick={() => setSelectedBill(bill)}
                      className={styles.viewDetailsButton}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBills?.length === 0 && (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyIcon} />
              <p>No bills found</p>
            </div>
          )}
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Bill Details</h2>
              <button
                onClick={() => setSelectedBill(null)}
                className={styles.modalCloseButton}
              >
                <XCircle className={styles.modalCloseIcon} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailsGrid}>
                <div>
                  <p className={styles.detailLabel}>Visit ID</p>
                  <p className={styles.detailValue}>{selectedBill.visitId}</p>
                </div>
                <div>
                  <p className={styles.detailLabel}>Date</p>
                  <p className={styles.detailValue}>
                    {formatDate(selectedBill.date)}
                  </p>
                </div>
                <div>
                  <p className={styles.detailLabel}>Doctor</p>
                  <p className={styles.detailValue}>
                    {selectedBill.doctor || "N/A"}
                  </p>
                </div>
                <div>
                  <p className={styles.detailLabel}>Status</p>
                  <p className={styles.detailValue}>
                    {selectedBill.isPaid ? (
                      <span style={{ color: "#059669" }}>Paid</span>
                    ) : (
                      <span style={{ color: "#DC2626" }}>Unpaid</span>
                    )}
                  </p>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Symptoms</h3>
                <ul className={styles.detailList}>
                  {selectedBill.symptoms.map((symptom, i) => (
                    <li key={i}>{symptom}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Diagnosis</h3>
                <ul className={styles.detailList}>
                  {selectedBill.diagnosis.map((diag, i) => (
                    <li key={i}>{diag}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Charges</h3>
                <div className={styles.chargesList}>
                  <div className={styles.chargeItem}>
                    <span>Consultation Fee</span>
                    <span>{formatCurrency(selectedBill.consultationFee)}</span>
                  </div>
                  {selectedBill.procedures.map((proc, i) => (
                    <div key={i} className={styles.chargeItem}>
                      <span>{proc.name}</span>
                      <span>{formatCurrency(proc.cost)}</span>
                    </div>
                  ))}
                  <div className={styles.chargeTotal}>
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedBill.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.downloadButton}>
                  <Download className={styles.buttonIcon} />
                  Download Invoice
                </button>
                {!selectedBill.isPaid && (
                  <button className={styles.markPaidButton}>
                    <CheckCircle className={styles.buttonIcon} />
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}