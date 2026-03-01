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
import { useAppSelector } from "../../../redux/hook";

interface Procedure {
  name: string;
  cost: number;
}

interface ReceptionistBilling {
  consumableCharges: Array<{
    name: string;
    cost: number;
    quantity?: number;
  }>;
  procedureCharges: Array<{
    name: string;
    fee: number;
  }>;
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
  receptionistBilling?: ReceptionistBilling;
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

interface PaymentFormData {
  amount: number;
  method: "cash" | "card" | "upi" | "bank_transfer" | "other";
  transactionId: string;
  notes: string;
}

export default function PatientBilling({
  patient,
  onBack,
}: PatientBillingProps) {
  const user=useAppSelector((state)=>state?.auth?.user?.name);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: 0,
    method: "cash",
    transactionId: "",
    notes: "",
  });

  useEffect(() => {
    fetchBillingData();
  }, [patient]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${billingServiceBaseUrl}/api/v1/billing/patient/${patient._id}/complete-bills?clinicId=${patient.clinicId}`,
      );
      console.log("Response:", response);

      setBillingData(response.data.data);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaidClick = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentForm({
      ...paymentForm,
      amount: bill.totalAmount,
    });
    setShowPaymentModal(true);
  };


  const handlePaymentSubmit = async () => {
    if (!selectedBill) return;

    try {
      setProcessingPayment(true);
      const response = await axios.post(
        `${billingServiceBaseUrl}/api/v1/billing/mark-paid/${selectedBill.visitId}`,
        {
          amount: paymentForm.amount,
          method: paymentForm.method,
          transactionId: paymentForm.transactionId || undefined,
          receivedBy: user,
          notes: paymentForm.notes || undefined,
          clinicId: patient.clinicId,
          patientId: patient._id,
        }
      );
      
      console.log("Payment response:", response);
      
      // Close payment modal and refresh data
      setShowPaymentModal(false);
      setSelectedBill(null);
      await fetchBillingData(); // Refresh the billing data after updating
      
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
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

  // Helper function to check if reception billing exists and has charges
  const hasReceptionBilling = (bill: Bill) => {
    return (
      bill.receptionistBilling &&
      (bill.receptionistBilling.consumableCharges?.length > 0 ||
        bill.receptionistBilling.procedureCharges?.length > 0)
    );
  };

  // Calculate reception total
  const calculateReceptionTotal = (bill: Bill) => {
    if (!bill.receptionistBilling) return 0;

    const consumableTotal =
      bill.receptionistBilling.consumableCharges?.reduce(
        (sum, item) => sum + item.cost * (item.quantity || 1),
        0,
      ) || 0;

    const procedureTotal =
      bill.receptionistBilling.procedureCharges?.reduce(
        (sum, item) => sum + item.fee,
        0,
      ) || 0;

    return consumableTotal + procedureTotal;
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
          <div
            className={styles.summaryIcon}
            style={{ backgroundColor: "#DBEAFE" }}
          >
            <FileText style={{ color: "#2563EB" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Total Bills</p>
            <p className={styles.summaryValue}>
              {billingData?.summary.totalBills}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={styles.summaryIcon}
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <DollarSign style={{ color: "#059669" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Grand Total</p>
            <p className={styles.summaryValue}>
              {formatCurrency(billingData?.summary.grandTotal)}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={styles.summaryIcon}
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <XCircle style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Unpaid Bills</p>
            <p className={styles.summaryValue}>
              {billingData?.bills.filter((b) => !b.isPaid).length}
            </p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={styles.summaryIcon}
            style={{ backgroundColor: "#E9D5FF" }}
          >
            <CheckCircle style={{ color: "#9333EA" }} />
          </div>
          <div>
            <p className={styles.summaryLabel}>Paid Bills</p>
            <p className={styles.summaryValue}>
              {billingData?.bills.filter((b) => b.isPaid).length}
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
                      <div>
                        Consultation: {formatCurrency(bill.consultationFee)}
                      </div>
                      {bill.procedures.length > 0 && (
                        <div className={styles.proceduresList}>
                          {bill.procedures.map((p, i) => (
                            <div key={i}>
                              {p.name}: {formatCurrency(p.cost)}
                            </div>
                          ))}
                        </div>
                      )}
                      {hasReceptionBilling(bill) && (
                        <div
                          className={styles.proceduresList}
                          style={{ color: "#2563EB" }}
                        >
                          <div>+ Reception Services</div>
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
      {selectedBill && !showPaymentModal && (
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
                  {selectedBill?.symptoms?.map((symptom, i) => (
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
                  {/* Consultation Fee */}
                  <div className={styles.chargeItem}>
                    <span>Consultation Fee</span>
                    <span>{formatCurrency(selectedBill.consultationFee)}</span>
                  </div>

                  {/* Doctor Procedures */}
                  {selectedBill.procedures.map((proc, i) => (
                    <div key={`doc-proc-${i}`} className={styles.chargeItem}>
                      <span>{proc.name} (Doctor)</span>
                      <span>{formatCurrency(proc.cost)}</span>
                    </div>
                  ))}

                  {/* Receptionist Billing */}
                  {selectedBill.receptionistBilling && (
                    <>
                      {/* Reception Procedures */}
                      {selectedBill.receptionistBilling.procedureCharges?.map(
                        (proc, i) => (
                          <div
                            key={`rec-proc-${i}`}
                            className={styles.chargeItem}
                          >
                            <span>{proc.name}</span>
                            <span>{formatCurrency(proc.fee)}</span>
                          </div>
                        ),
                      )}

                      {/* Consumable Charges */}
                      {selectedBill.receptionistBilling.consumableCharges?.map(
                        (item, i) => (
                          <div
                            key={`consumable-${i}`}
                            className={styles.chargeItem}
                          >
                            <span>
                              {item.name}
                              {item.quantity &&
                                item.quantity > 1 &&
                                ` (x${item.quantity})`}
                            </span>
                            <span>
                              {formatCurrency(item.cost * (item.quantity || 1))}
                            </span>
                          </div>
                        ),
                      )}
                    </>
                  )}

                  {/* Total */}
                  <div className={styles.chargeTotal}>
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedBill.totalAmount)}</span>
                  </div>

                  {/* Reception Subtotal (if exists) */}
                  {hasReceptionBilling(selectedBill) && (
                    <div className={styles.receptionSubtotal}>
                      <span>Reception Services Total:</span>
                      <span>
                        {formatCurrency(calculateReceptionTotal(selectedBill))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.downloadButton}>
                  <Download className={styles.buttonIcon} />
                  Download Invoice
                </button>
                {!selectedBill.isPaid && (
                  <button
                    className={styles.markPaidButton}
                    onClick={() => handleMarkPaidClick(selectedBill)}
                  >
                    <CheckCircle className={styles.buttonIcon} />
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: "500px" }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Process Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                }}
                className={styles.modalCloseButton}
                disabled={processingPayment}
              >
                <XCircle className={styles.modalCloseIcon} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.paymentSummary}>
                <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "4px" }}>
                  Bill Amount
                </p>
                <p style={{ fontSize: "24px", fontWeight: "600", color: "#1F2937" }}>
                  {formatCurrency(selectedBill.totalAmount)}
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className={styles.paymentForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    className={styles.formInput}
                    required
                    disabled={processingPayment}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method *</label>
                  <select
                    name="method"
                    value={paymentForm.method}
                    onChange={handlePaymentFormChange}
                    className={styles.formSelect}
                    required
                    disabled={processingPayment}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Transaction ID</label>
                  <input
                    type="text"
                    name="transactionId"
                    value={paymentForm.transactionId}
                    onChange={handlePaymentFormChange}
                    className={styles.formInput}
                    placeholder="Optional"
                    disabled={processingPayment}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notes</label>
                  <textarea
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handlePaymentFormChange}
                    className={styles.formTextarea}
                    placeholder="Optional notes"
                    rows={3}
                    disabled={processingPayment}
                  />
                </div>

                <div className={styles.paymentActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedBill(null);
                    }}
                    className={styles.cancelButton}
                    disabled={processingPayment}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    className={styles.submitPaymentButton}
                    disabled={processingPayment}
                  >
                    {processingPayment ? "Processing..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}