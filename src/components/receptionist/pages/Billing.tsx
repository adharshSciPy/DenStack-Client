import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Printer,
  Send,
  Search,
} from "lucide-react";
import { useAppSelector } from "../../../redux/hook";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";

type BillingItem = {
  id: string;
  name: string;
  quantity: number;
  fee: number;
};

interface ReceptionistUser {
  id: string;
  name: string;
  clinicId: string;
  clinicData?: ClinicData;
}

interface ClinicData {
  _id: string;
  name: string;
}

interface PatientData {
  _id: string;
  patientUniqueId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: number;
  email: string;
  pendingDues: number;
}

interface Doctor {
  _id: string;
  doctor: {
    _id: string;
    name: string;
  };
}

export default function Billing() {
  const reception = useAppSelector(
    (state) => state.auth.user
  ) as ReceptionistUser | null;

  const clinicId = reception?.clinicData?._id || "";

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSelectingPatient, setIsSelectingPatient] = useState(false);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  const [items, setItems] = useState<BillingItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /* ------------------ FETCH DOCTORS ------------------ */
  useEffect(() => {
    if (!clinicId) return;

    const fetchDoctors = async () => {
      try {
        const res = await axios.get(
          `${clinicServiceBaseUrl}/api/v1/clinic-service/active-doctors`,
          { params: { clinicId } }
        );

        const data = res.data?.doctors || [];
        setDoctors(data);

        if (data.length > 0) {
          setSelectedDoctor(data[0].doctor._id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDoctors();
  }, [clinicId]);

  /* ------------------ PATIENT SEARCH ------------------ */
  const getPatients = async (search: string) => {
    if (!search.trim()) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/clinic-patients/${clinicId}?search=${search}`
      );
      setPatients(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 FIXED DEBOUNCE EFFECT */
  useEffect(() => {
    if (isSelectingPatient) {
      setIsSelectingPatient(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        getPatients(searchQuery);
        setShowDropdown(true);
      } else {
        setPatients([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  /* ------------------ CLICK OUTSIDE ------------------ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------ SELECT PATIENT ------------------ */
  const handlePatientSelect = (patient: PatientData) => {
    setIsSelectingPatient(true);
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setPatients([]);
    setShowDropdown(false);
  };

  /* ------------------ ITEMS ------------------ */
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", quantity: 1, fee: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof BillingItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  /* ------------------ TOTALS ------------------ */
  const subtotal = items.reduce(
    (sum, i) => sum + i.quantity * i.fee,
    0
  );
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  /* ------------------ PAYMENT ------------------ */
  const handlePayment = async () => {
    if (!selectedPatient) return;

    try {
      setSubmitting(true);

      const res=await axios.patch(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/update_bills`,
        {
          userId: reception?.id,
          userRole: "500",
          procedureCharges: items,
        },
        {
          params: {
            clinicId,
            patientUniqueId: selectedPatient.patientUniqueId,
          },
        }
      );

      setSelectedPatient(null);
      setSearchQuery("");
      setItems([]);
      console.log("ressa",res);
      
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div style={{ padding: "24px", }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "600", margin: "0 0 4px 0" }}>
            💰 Billing & Payments
          </h1>
          <p style={{ color: "#6B7280", margin: 0 }}>
            Create invoice and collect payments
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            // onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <Printer size={18} />
            Print
          </button>
          <button
            // onClick={handleSendInvoice}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <Send size={18} />
            Send Invoice
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Patient Information */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              👤 Patient Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "6px",
                  }}
                >
                  Patient Name/ID
                </label>
                <div style={{ position: "relative" }}>
                  <Search
                    size={18}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => patients.length > 0 && setShowDropdown(true)}
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {showDropdown && patients.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      marginTop: "4px",
                      maxHeight: "300px",
                      overflowY: "auto",
                      zIndex: 1000,
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {loading ? (
                      <div style={{ padding: "16px", textAlign: "center" }}>
                        Loading...
                      </div>
                    ) : (
                      patients.map((patient) => (
                        <div
                          key={patient._id}
                          onClick={() => handlePatientSelect(patient)}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f0f0f0",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "white")
                          }
                        >
                          <div
                            style={{
                              fontWeight: "500",
                              fontSize: "14px",
                              marginBottom: "4px",
                            }}
                          >
                            {patient.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>
                            ID: {patient.patientUniqueId} • {patient.age}y •{" "}
                            {patient.gender}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>
                            📞 {patient.phone}
                          </div>
                          {patient.pendingDues > 0 && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#DC2626",
                                marginTop: "4px",
                              }}
                            >
                              ₹{patient.pendingDues} due
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedPatient && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: "#F0FDF4",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    Selected: {selectedPatient.name} (
                    {selectedPatient.patientUniqueId})
                    {selectedPatient.pendingDues > 0 && (
                      <div style={{ color: "#DC2626", marginTop: "4px" }}>
                        ⚠️ Pending dues: ₹{selectedPatient.pendingDues}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "6px",
                  }}
                >
                  Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.doctor._id} value={doctor.doctor._id}>
                      {doctor.doctor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Services & Items */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
                🛒 Services & Items
              </h2>
              <button
                onClick={addItem}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "#10B981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#9CA3AF",
                  fontSize: "14px",
                }}
              >
                No items added. Click "Add Item" to start.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                    gap: "12px",
                    marginBottom: "12px",
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "4px",
                      }}
                    >
                      Service/Item
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, "name", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "4px",
                      }}
                    >
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "4px",
                      }}
                    >
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.fee}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "fee",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "4px",
                      }}
                    >
                      Total
                    </label>
                    <div
                      style={{
                        padding: "8px",
                        background: "#F9FAFB",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      ₹{(item.quantity * item.fee).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      padding: "8px",
                      border: "none",
                      background: "#FEE2E2",
                      color: "#DC2626",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Discount */}
          {/* <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              🎫 Discount
            </h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="range"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                style={{
                  width: "80px",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                }}
              />
              <span>%</span>
            </div>
          </div> */}
        </div>

        {/* Right Column - Invoice Preview */}
        <div>
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              position: "sticky",
              top: "24px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              📄 Invoice Preview
            </h2>

            <div
              style={{
                padding: "20px",
                background: "#F9FAFB",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>
                  Invoice #
                </div>
                <div style={{ fontSize: "18px", fontWeight: "600" }}>
                  INV-{Date.now().toString().slice(-6)}
                </div>
              </div>

              <div style={{ fontSize: "13px", lineHeight: "1.8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#6B7280" }}>Patient:</span>
                  <span style={{ fontWeight: "500" }}>
                    {selectedPatient?.name || "Not selected"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#6B7280" }}>Patient ID:</span>
                  <span style={{ fontWeight: "500" }}>
                    {selectedPatient?.patientUniqueId || "-"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#6B7280" }}>Doctor:</span>
                  <span style={{ fontWeight: "500" }}>
                    {doctors.find((d) => d.doctor._id === selectedDoctor)
                      ?.doctor.name || "Not selected"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Date:</span>
                  <span style={{ fontWeight: "500" }}>
                    {new Date().toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  fontSize: "14px",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: "500" }}>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    fontSize: "14px",
                    color: "#10B981",
                  }}
                >
                  <span>Discount ({discount}%)</span>
                  <span style={{ fontWeight: "500" }}>
                    - ₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  borderTop: "2px solid #E5E7EB",
                  marginTop: "8px",
                }}
              >
                <span>Total</span>
                <span style={{ color: "#3B82F6" }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={submitting || !selectedPatient || items.length === 0}
              style={{
                width: "100%",
                padding: "14px",
                background: submitting || !selectedPatient || items.length === 0 ? "#D1D5DB" : "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting || !selectedPatient || items.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Processing..." : `Generate Bill ₹${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}