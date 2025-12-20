import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import {
  Calendar,
  Clock,
  User,
  FileText,
  X,
  Phone,
  Check,
  ChevronDown,
  UserCog,
  Mail,
  UserCheck,
  UserPlus,
  Loader2,
  Search,
} from "lucide-react";
import CalendarView, { CalendarAppointment } from "../component/CalenderView";
import { useAppSelector } from "../../../redux/hook";

import styles from "../styles/receptionist.module.css";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import axios from "axios";
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";

type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  doctor: string;
  time: string;
  duration: number;
  type: "new" | "follow-up" | "emergency" | "procedure";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reason: string;
  date: string;
};

interface AppointmentData {
  userId: string;
  userRole: string;
  patientId: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  forceBooking: boolean;
}

interface AppointmentFormState {
  _id?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  department: string;
  date: string;
  time: string;
  type: "new" | "follow-up" | "emergency" | "procedure";
  duration: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reason: string;
}

interface PatientRegistrationForm {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  phone: string;
  email?: string;
  address?: string;
  conditions?: string;
  surgeries?: string;
  allergies?: string;
  familyHistory?: string;
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
  clinicData: ClinicData;
}

interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  email?: string;
  phoneNumber?: string;
  specialization: string;
  roleInClinic: string;
  status: string;
  availableSlots: string[];
  department: string;
}

export default function AppointmentScheduler() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentFormState>({
    patientId: "",
    patientName: "",
    doctorId: "",
    department: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    type: "new",
    duration: 30,
    status: "scheduled",
    reason: "",
  });

  const [newPatientForm, setNewPatientForm] = useState<PatientRegistrationForm>({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    conditions: "",
    surgeries: "",
    allergies: "",
    familyHistory: "",
  });

  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  const reception = useAppSelector(
    (state) => state.auth.user
  ) as ReceptionistUser | null;

  const clinicId = reception?.clinicData?._id || "";

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "APT001",
      patientName: "Rahul Verma",
      patientId: "PT001",
      doctor: "Dr. Amit Sharma",
      time: "09:00 AM",
      duration: 30,
      type: "follow-up",
      status: "confirmed",
      reason: "Follow-up checkup",
      date: "2024-09-05",
    },
  ]);

  const handleCreateAppointment = (date: string) => {
    setEditingAppointment({
      patientId: "",
      patientName: "",
      doctorId: "",
      department: "",
      date: date,
      time: "09:00",
      duration: 30,
      type: "new",
      status: "scheduled",
      reason: "",
    });
    setFoundPatient(null);
    setPatientSearchQuery("");
    setIsNewPatient(false);
    setNewPatientForm({
      name: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      conditions: "",
      surgeries: "",
      allergies: "",
      familyHistory: "",
    });
    setShowBookingForm(true);
  };

  const handleEditAppointment = (appointment: CalendarAppointment) => {
    const fullAppointment = appointments.find(
      (apt) => apt.id === appointment.id
    );
    if (fullAppointment) {
      setEditingAppointment({
        _id: fullAppointment.id,
        patientId: fullAppointment.patientId,
        patientName: fullAppointment.patientName,
        doctorId: fullAppointment.doctor,
        department: "",
        date: fullAppointment.date,
        time: fullAppointment.time.replace(" AM", "").replace(" PM", ""),
        duration: fullAppointment.duration,
        type: fullAppointment.type,
        status: fullAppointment.status,
        reason: fullAppointment.reason,
      });
      setShowBookingForm(true);
    }
  };

  const handleSaveAppointment = () => {
    if (!editingAppointment) return;

    // Validate required fields
    if (!editingAppointment.patientId || !editingAppointment.patientName) {
      alert("Please fill in patient details");
      return;
    }

    if (!editingAppointment.doctorId) {
      alert("Please select a doctor");
      return;
    }

    if (!editingAppointment.date || !editingAppointment.time) {
      alert("Please select date and time");
      return;
    }

    const appointmentToSave: Appointment = {
      id:
        editingAppointment._id ||
        `APT${String(appointments.length + 1).padStart(3, "0")}`,
      patientName: editingAppointment.patientName,
      patientId: editingAppointment.patientId,
      doctor: editingAppointment.doctorId,
      time: editingAppointment.time,
      duration: editingAppointment.duration,
      type: editingAppointment.type,
      status: editingAppointment.status,
      reason: editingAppointment.reason,
      date: editingAppointment.date,
    };

    if (editingAppointment._id) {
      // Update existing appointment
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === editingAppointment._id ? appointmentToSave : apt
        )
      );
    } else {
      // Create new appointment
      setAppointments((prev) => [...prev, appointmentToSave]);
    }

    // Reset form and close modal
    setShowBookingForm(false);
    setEditingAppointment({
      patientId: "",
      patientName: "",
      doctorId: "",
      department: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      duration: 30,
      type: "new",
      status: "scheduled",
      reason: "",
    });
    setIsNewPatient(false);
    setFoundPatient(null);
    setPatientSearchQuery("");
  };

  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim()) {
      alert("Please enter a Patient ID");
      return;
    }

    try {
      setPatientSearchLoading(true);
      
      // Search patient by unique ID in the current clinic
      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/single-patient`,
        {
          params: {
            id: patientSearchQuery,
            clinicId: clinicId,
          },
        }
      );
      console.log(res);

      const patient = res.data.data;
      
      if (patient) {
        setFoundPatient(patient);
        
        // Auto-fill the appointment form with patient details
        setEditingAppointment(prev => ({
          ...prev,
          patientId: patient.patientUniqueId || patient._id,
          patientName: patient.name,
        }));
        
        alert(`Patient found: ${patient.name}`);
      } else {
        alert("No patient found with this ID");
        setFoundPatient(null);
        setEditingAppointment(prev => ({
          ...prev,
          patientId: "",
          patientName: "",
        }));
      }
    } catch (error: any) {
      console.error("Error fetching patient:", error);
      
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error.message?.includes("404")) {
        alert("Patient not found. Please check the Patient ID.");
      } else {
        alert("Error searching for patient. Please try again.");
      }
      
      setFoundPatient(null);
      setEditingAppointment(prev => ({
        ...prev,
        patientId: "",
        patientName: "",
      }));
    } finally {
      setPatientSearchLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return styles.statusConfirmed;
      case "scheduled":
        return styles.statusScheduled || styles.statusPending;
      case "completed":
        return styles.statusCompleted;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusConfirmed;
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          `${clinicServiceBaseUrl}/api/v1/clinic-service/department/details/${clinicId}`
        );

        const departments = response.data?.departments || [];
        console.log("Departments Response:", departments);
        setDepartments(departments); // ✅ update state
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, [clinicId]);

  const handleDepartmentSelect = async (department: string) => {
    setSelectedDepartment(department);

    try {
      setAvailabilityLoading(true);
      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/department-based/availability`,
        {
          params: { clinicId, department },
        }
      );

      console.log("Doctor Availability Response:", response.data);

      const doctors = response.data?.doctors || [];

      if (doctors.length > 0) {
        const filteredDoctors = doctors.filter((doc: any) => {
          const specializations = doc.specialization || [];
          return specializations.some(
            (spec: string) => spec.toLowerCase() === department.toLowerCase()
          );
        });

        if (filteredDoctors.length === 0) {
          alert("No doctors found for the selected department");
          setDoctorAvailability([]);
          return;
        }

        // ✅ Map clean doctor data
        setDoctorAvailability(
          filteredDoctors.map((doc: any) => ({
            doctorId: doc.doctorId,
            doctorName: doc.doctor?.name || "Unnamed Doctor",
            email: doc.doctor?.email || "N/A",
            phoneNumber: doc.doctor?.phoneNumber || "N/A",
            specialization: Array.isArray(doc.specialization)
              ? doc.specialization.join(", ")
              : doc.specialization || "",
            roleInClinic: doc.roleInClinic,
            status: doc.status,
            department: department,
            availableSlots:
              doc.availability
                ?.filter((a: any) => a.isActive)
                ?.map(
                  (a: any) => `${a.dayOfWeek}: ${a.startTime} - ${a.endTime}`
                ) || [],
          }))
        );

      } else {
        alert("No doctors available for this department");
        setDoctorAvailability([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      alert("Error fetching doctor availability. Please try again.");
      setDoctorAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };  

  const handlePatientRegistration = async () => {
    try {
      if (
        !newPatientForm.name ||
        !newPatientForm.phone ||
        !newPatientForm.age ||
        !newPatientForm.gender
      ) {
        alert("Please fill all required fields");
        return;
      }
      setRegistrationLoading(true);

      const medicalHistory = {
        conditions:
          newPatientForm.conditions
            ?.split(",")
            .map((c) => c.trim())
            .filter(Boolean) || [],
        surgeries:
          newPatientForm.surgeries
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        allergies:
          newPatientForm.allergies
            ?.split(",")
            .map((a) => a.trim())
            .filter(Boolean) || [],
        familyHistory:
          newPatientForm.familyHistory
            ?.split(",")
            .map((f) => f.trim())
            .filter(Boolean) || [],
      };

      const payload = {
        userRole: "receptionist",
        userId: reception?.id || "",
        name: newPatientForm.name,
        phone: newPatientForm.phone,
        email: newPatientForm.email || "",
        age: Number(newPatientForm.age),
        gender: newPatientForm.gender,
        medicalHistory,
      };
      console.log("ds", payload);

      const response = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/register/${clinicId}`,
        payload
      );

      console.log("jhvg", response);

      const data = response.data;

      if (data.success) {
        alert("Patient registered successfully!");
        setFoundPatient(data.patient);

        setEditingAppointment((prev) => ({
          ...prev,
          patientId: data.patient.patientUniqueId,
          patientName: data.patient.name,
        }));

        // Reset new patient form
        setNewPatientForm({
          name: "",
          age: "",
          gender: "",
          phone: "",
          email: "",
          address: "",
          conditions: "",
          surgeries: "",
          allergies: "",
          familyHistory: "",
        });

        // Switch to existing patient mode
        setIsNewPatient(false);
      } else {
        alert(data.message || "Failed to register patient");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Server error while registering patient");
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Custom sidebar card renderer with full appointment details
  const renderSidebarCard = (apt: CalendarAppointment) => {
    const fullAppointment = appointments.find((a) => a.id === apt.id);
    if (!fullAppointment) return null;

    return (
      <div
        className={styles.appointmentDetailCard}
        onClick={() => handleEditAppointment(apt)}
      >
        <div className={styles.appointmentDetailHeader}>
          <div className={styles.appointmentTimeDetail}>
            <Clock className={styles.iconSmall} />
            {apt.time}
          </div>
          <span className={getStatusClass(fullAppointment.status)}>
            {fullAppointment.status}
          </span>
        </div>
        <div className={styles.appointmentDetailInfo}>
          <div className={styles.infoRow}>
            <User className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Patient:</span>{" "}
            {fullAppointment.patientName}
          </div>
          <div className={styles.infoRow}>
            <User className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Doctor:</span>{" "}
            {fullAppointment.doctor}
          </div>
          <div className={styles.infoRow}>
            <Calendar className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Type:</span>{" "}
            {fullAppointment.type}
          </div>
          <div className={styles.infoRow}>
            <FileText className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Reason:</span>{" "}
            {fullAppointment.reason}
          </div>
        </div>
      </div>
    );
  };

  console.log(reception?.id);

  return (
    <>
      <CalendarView
        appointments={appointments}
        onCreateAppointment={handleCreateAppointment}
        onAppointmentClick={handleEditAppointment}
        renderSidebarCard={renderSidebarCard}
        initialDate={new Date(2024, 8, 1)}
        headerTitle="Appointment Calendar"
        headerSubtitle="Click any day to schedule a new appointment"
      />

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <h3 className={styles.modalTitle}>
                  {editingAppointment._id
                    ? "Edit Appointment"
                    : "New Appointment"}
                </h3>
                <span className={styles.modalSubtitle}>
                  {editingAppointment._id
                    ? "Update existing appointment"
                    : "Create a new appointment"}
                </span>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowBookingForm(false);
                  setIsNewPatient(false);
                  setFoundPatient(null);
                  setPatientSearchQuery("");
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.modalBody}>
              {/* Patient Type Toggle */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Patient Type</label>
                <div className={styles.patientToggle}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${
                      !isNewPatient ? styles.activeToggle : ""
                    }`}
                    onClick={() => {
                      setIsNewPatient(false);
                      if (foundPatient && editingAppointment) {
                        setEditingAppointment({
                          ...editingAppointment,
                          patientId:
                            foundPatient.patientUniqueId || foundPatient._id,
                          patientName: foundPatient.name,
                        });
                      }
                    }}
                  >
                    <UserCheck size={16} />
                    <span>Existing Patient</span>
                    {!isNewPatient && (
                      <div className={styles.activeIndicator} />
                    )}
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${
                      isNewPatient ? styles.activeToggle : ""
                    }`}
                    onClick={() => {
                      setIsNewPatient(true);
                      setEditingAppointment((prev) => ({
                        ...prev,
                        patientId: "",
                        patientName: "",
                      }));
                      setFoundPatient(null);
                      setPatientSearchQuery("");
                    }}
                  >
                    <UserPlus size={16} />
                    <span>New Patient</span>
                    {isNewPatient && <div className={styles.activeIndicator} />}
                  </button>
                </div>
              </div>

              <div className={styles.divider} />

              {/* Date & Time */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Date & Time</label>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                      <Calendar size={14} />
                      <span>Date</span>
                    </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={editingAppointment.date}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                      <Clock size={14} />
                      <span>Time</span>
                    </label>
                    <input
                      type="time"
                      className={styles.input}
                      value={editingAppointment.time}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              {/* ================= EXISTING PATIENT ================= */}
              {!isNewPatient && (
                <div className={styles.section}>
                  <label className={styles.sectionLabel}>Patient Details</label>
                  
                  {/* Patient Search */}
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                      <User size={14} />
                      <span>Search Patient by ID *</span>
                    </label>
                    <div className={styles.searchContainer}>
                      <div className={styles.searchInputWrapper}>
                        <input
                          className={styles.searchInput}
                          placeholder="Enter Patient Unique ID (e.g., PT001)"
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
                        />
                        <button
                          type="button"
                          className={styles.searchButton}
                          onClick={handlePatientSearch}
                          disabled={patientSearchLoading || !patientSearchQuery.trim()}
                        >
                          {patientSearchLoading ? (
                            <Loader2 size={16} className={styles.spinner} />
                          ) : (
                            "Search"
                          )}
                        </button>
                      </div>
                      <p className={styles.hintText}>
                        Enter the patient's unique ID to autofill their details
                      </p>
                    </div>
                  </div>

                  {/* Display found patient or manual input */}
                  {foundPatient ? (
                    <div className={styles.patientFoundCard}>
                      <div className={styles.patientFoundHeader}>
                        <Check className={styles.successIcon} size={18} />
                        <span>Patient Found</span>
                      </div>
                      <div className={styles.patientInfoGrid}>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>Name:</span>
                          <span className={styles.patientInfoValue}>{foundPatient.name}</span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>Patient ID:</span>
                          <span className={styles.patientInfoValue}>
                            {foundPatient.patientUniqueId || foundPatient._id}
                          </span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>Age:</span>
                          <span className={styles.patientInfoValue}>{foundPatient.age}</span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>Gender:</span>
                          <span className={styles.patientInfoValue}>{foundPatient.gender}</span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>Phone:</span>
                          <span className={styles.patientInfoValue}>{foundPatient.phone}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.clearPatientButton}
                        onClick={() => {
                          setFoundPatient(null);
                          setPatientSearchQuery("");
                          setEditingAppointment(prev => ({
                            ...prev,
                            patientId: "",
                            patientName: "",
                          }));
                        }}
                      >
                        Clear & Search Another
                      </button>
                    </div>
                  ) : (
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Patient ID</label>
                        <input
                          className={styles.input}
                          placeholder="PT001"
                          value={editingAppointment.patientId}
                          onChange={(e) =>
                            setEditingAppointment({
                              ...editingAppointment,
                              patientId: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Patient Name</label>
                        <input
                          className={styles.input}
                          placeholder="John Doe"
                          value={editingAppointment.patientName}
                          onChange={(e) =>
                            setEditingAppointment({
                              ...editingAppointment,
                              patientName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= NEW PATIENT ================= */}
              {isNewPatient && (
                <>
                  <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                      New Patient Details
                    </label>
                    <div className={styles.formGroup}>
                      <label className={styles.inputLabel}>
                        <User size={14} />
                        <span>Full Name *</span>
                      </label>
                      <input
                        placeholder="Enter patient's full name"
                        value={newPatientForm.name}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            name: e.target.value,
                          })
                        }
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Age *</label>
                        <div className={styles.inputWithSuffix}>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="120"
                            value={newPatientForm.age}
                            onChange={(e) =>
                              setNewPatientForm({
                                ...newPatientForm,
                                age: e.target.value,
                              })
                            }
                            className={styles.input}
                          />
                          <span className={styles.suffix}>years</span>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Gender *</label>
                        <select
                          value={newPatientForm.gender}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              gender: e.target.value as any,
                            })
                          }
                          className={styles.input}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          <Phone size={14} />
                          <span>Phone *</span>
                        </label>
                        <input
                          placeholder="+1 (555) 123-4567"
                          value={newPatientForm.phone}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              phone: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          <Mail size={14} />
                          <span>Email (optional)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="patient@example.com"
                          value={newPatientForm.email}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              email: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.inputLabel}>
                        <Mail size={14} />
                        <span>Address (optional)</span>
                      </label>
                      <input
                        placeholder="Enter address"
                        value={newPatientForm.address}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            address: e.target.value,
                          })
                        }
                        className={styles.input}
                      />
                    </div>
                  </div>

                  {/* Medical History Section */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionSubtitle}>
                      Medical History (Optional)
                    </h4>
                    <p className={styles.hintText}>Comma-separated values</p>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Conditions</label>
                        <input
                          placeholder="Diabetes, Hypertension"
                          value={newPatientForm.conditions}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              conditions: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Surgeries</label>
                        <input
                          placeholder="Appendectomy"
                          value={newPatientForm.surgeries}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              surgeries: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Allergies</label>
                        <input
                          placeholder="Penicillin, Peanuts"
                          value={newPatientForm.allergies}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              allergies: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          Family History
                        </label>
                        <input
                          placeholder="Heart disease"
                          value={newPatientForm.familyHistory}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              familyHistory: e.target.value,
                            })
                          }
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePatientRegistration}
                    disabled={
                      registrationLoading ||
                      !newPatientForm.name ||
                      !newPatientForm.phone ||
                      !newPatientForm.age ||
                      !newPatientForm.gender
                    }
                    className={styles.registerButton}
                  >
                    {registrationLoading ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Register Patient</span>
                      </>
                    )}
                  </button>

                  {foundPatient && (
                    <div className={styles.successMessage}>
                      ✓ Patient registered successfully! ID:{" "}
                      {foundPatient.patientUniqueId || foundPatient._id}
                    </div>
                  )}
                </>
              )}

              <div className={styles.divider} />
              
              {/* Department Selection */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Select Department</label>
                <div className={styles.departmentsGrid}>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      className={`${styles.departmentButton} ${
                        selectedDepartment === dept ? styles.departmentButtonActive : ""
                      }`}
                      onClick={() => handleDepartmentSelect(dept)}
                      disabled={availabilityLoading}
                    >
                      {dept}
                      {selectedDepartment === dept && (
                        <div className={styles.activeIndicator} />
                      )}
                    </button>
                  ))}
                </div>
                {availabilityLoading && (
                  <div className={styles.loadingIndicator}>
                    <Loader2 size={16} className={styles.spinner} />
                    <span>Loading doctors...</span>
                  </div>
                )}
              </div>

              {/* Doctor Selection */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>
                  Doctor Information
                </label>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    <UserCog size={14} />
                    <span>Select Doctor *</span>
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.select}
                      value={editingAppointment.doctorId}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          doctorId: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose a doctor</option>
                      {doctorAvailability.map((doc) => (
                        <option key={doc.doctorId} value={doc.doctorName}>
                          {doc.doctorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Appointment Type */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>
                  Appointment Details
                </label>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Type</label>
                    <select
                      className={styles.input}
                      value={editingAppointment.type}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          type: e.target.value as any,
                        })
                      }
                    >
                      <option value="new">New</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                      <option value="procedure">Procedure</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Duration (min)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editingAppointment.duration}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          duration: parseInt(e.target.value) || 30,
                        })
                      }
                      min="15"
                      max="120"
                      step="15"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Reason</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Brief reason for appointment"
                    value={editingAppointment.reason}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        reason: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowBookingForm(false);
                    setIsNewPatient(false);
                    setFoundPatient(null);
                    setPatientSearchQuery("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleSaveAppointment}
                  disabled={
                    !editingAppointment.patientId ||
                    !editingAppointment.patientName ||
                    !editingAppointment.doctorId ||
                    !editingAppointment.date ||
                    !editingAppointment.time
                  }
                >
                  {editingAppointment._id
                    ? "Update Appointment"
                    : "Create Appointment"}
                  <Check size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}