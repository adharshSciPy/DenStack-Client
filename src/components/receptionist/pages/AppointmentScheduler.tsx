import { useEffect, useState, useRef } from "react";
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
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CalendarView, { CalendarAppointment } from "../component/CalenderView";
import { useAppSelector } from "../../../redux/hook";

import styles from "../styles/receptionist.module.css";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import axios from "axios";
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";

type Appointment = {
  _id: string;
  id: string;
  patientName: string;
  patientId: string;
  doctor: string;
  doctorName: string;
  time: string;
  duration: number;
  type: "new" | "follow-up" | "emergency" | "procedure";
  status:
    | "scheduled"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "needs_reschedule";
  reason: string;
  date: string;
};

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
  status:
    | "scheduled"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "needs_reschedule";
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

interface FullStatus {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  tomorrowRescheduleCount?: number;
}

interface MonthlyAppointmentResponse {
  success: boolean;
  message: string;
  clinicId: string;
  month: number;
  year: number;
  count: number;
  data: {
    date: string;
    appointments: {
      _id: string;
      appointmentDate: string;
      appointmentTime: string;
      status: string;
      opNumber: number;
      doctorId: string;
      patient: {
        _id: string;
        name: string;
        phone: number;
        age: number;
        gender: string;
        patientUniqueId: string;
      };
    }[];
  }[];
}

export default function AppointmentScheduler() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState<
    DoctorAvailability[]
  >([]);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentFormState>({
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

  const [newPatientForm, setNewPatientForm] = useState<PatientRegistrationForm>(
    {
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
    }
  );

  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");

  // State for current month/year
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(
    today.getMonth() + 1
  );
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // State for year selection
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const [fullStatus, setFullStatus] = useState<FullStatus>({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
  });

  const reception = useAppSelector(
    (state) => state.auth.user
  ) as ReceptionistUser | null;

  const clinicId = reception?.clinicData?._id || "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Month names for display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Year dropdown ref for closing on outside click
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Generate years for dropdown (10 years back and 5 years forward)
  const generateYearOptions = () => {
    const currentYear = today.getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  // Close year dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch appointments using the new API
  const fetchAppointments = async (month?: number, year?: number) => {
    if (!clinicId) return;

    try {
      setLoading(true);

      const targetMonth = month || currentMonth;
      const targetYear = year || currentYear;

      const response = await axios.get<MonthlyAppointmentResponse>(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/monthly_appointmnets/${clinicId}`,
        {
          params: {
            month: targetMonth,
            year: targetYear,
          },
        }
      );

      const data = response.data;

      if (data.success) {
        // Flatten the appointments from the new API response
        const mappedAppointments: Appointment[] = [];

        data.data.forEach((dayData) => {
          dayData.appointments.forEach((apt) => {
            mappedAppointments.push({
              _id: apt._id,
              id: `OP${apt.opNumber}`,
              patientName: apt.patient.name || "Unknown Patient",
              patientId: apt.patient._id,
              doctor: apt.doctorId,
              doctorName: "Unknown Doctor",
              time: apt.appointmentTime,
              duration: 30,
              type: "new",
              status: apt.status as any,
              reason: "",
              date: apt.appointmentDate,
            });
          });
        });

        setAppointments(mappedAppointments);
        setFullStatus({
          totalAppointments: data.count,
          completedAppointments: 0,
          pendingAppointments: data.count,
          cancelledAppointments: 0,
        });

        console.log(
          `Fetched ${mappedAppointments.length} appointments for ${
            monthNames[targetMonth - 1]
          } ${targetYear}`
        );
      } else {
        alert("Failed to fetch appointments");
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      alert("Failed to fetch appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle month change
  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    fetchAppointments(month, year);
  };

  // Navigate to previous month
  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    }

    handleMonthChange(newMonth, newYear);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }

    handleMonthChange(newMonth, newYear);
  };

  // Handle year selection
  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearDropdown(false);
    fetchAppointments(currentMonth, year);
  };

  // Create appointment handler with date validation
  const handleCreateAppointment = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent creating appointments in past dates
    if (selectedDate < today) {
      alert("Cannot create appointments for past dates.");
      return;
    }

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

  // Edit appointment handler with date validation
  const handleEditAppointment = (appointment: CalendarAppointment) => {
    const fullAppointment = appointments.find(
      (apt) => apt.id === appointment.id
    );

    if (!fullAppointment) return;

    const appointmentDate = new Date(fullAppointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if appointment is in the past
    if (appointmentDate < today) {
      alert("Cannot edit past appointments.");
      return;
    }

    setEditingAppointment({
      _id: fullAppointment._id,
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
  };

  // Save appointment handler with date validation
  const handleSaveAppointment = async () => {
    if (!editingAppointment) return;

    // Validate date is not in past
    const appointmentDate = new Date(editingAppointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      alert("Cannot create or update appointments for past dates.");
      return;
    }

    // Other validations
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

    try {
      setLoading(true);

      const payload = {
        userId: reception?.id || "",
        userRole: "receptionist",
        patientId: editingAppointment.patientId,
        doctorId: editingAppointment.doctorId,
        department: selectedDepartment,
        appointmentDate: editingAppointment.date,
        appointmentTime: editingAppointment.time,
        duration: editingAppointment.duration,
        type: editingAppointment.type,
        reason: editingAppointment.reason,
      };

      // UPDATE APPOINTMENT
      if (editingAppointment._id) {
        await axios.put(
          `${patientServiceBaseUrl}/api/v1/patient-service/appointment/update/${editingAppointment._id}`,
          payload
        );
        alert("Appointment updated successfully");
      }
      // CREATE / BOOK APPOINTMENT
      else {
        await axios.post(
          `${patientServiceBaseUrl}/api/v1/patient-service/appointment/book/${clinicId}`,
          payload
        );
        alert("Appointment booked successfully");
      }

      // Refresh appointments list
      await fetchAppointments(currentMonth, currentYear);

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
    } catch (error: any) {
      // Conflict handling
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const confirmForce = window.confirm(
          `${error.response.data.message}\n\nDo you want to force book with a different doctor?`
        );

        if (confirmForce) {
          return forceBookAppointment();
        }
        return;
      }

      alert(
        error.response?.data?.message ||
          "Failed to save appointment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Force book appointment
  const forceBookAppointment = async () => {
    try {
      setLoading(true);

      const payload = {
        userId: clinicId,
        userRole: "admin",
        patientId: foundPatient?._id,
        doctorId: selectedDoctor,
        department: selectedDepartment,
        appointmentDate,
        appointmentTime: selectedTime,
        forceBooking: true,
      };

      const res = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/book/${clinicId}`,
        payload
      );

      alert("Forced Appointment Booked Successfully");
      await fetchAppointments(currentMonth, currentYear);
    } catch (error) {
      alert("Force booking failed");
    } finally {
      setLoading(false);
    }
  };

  // Patient search handler
  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim()) {
      alert("Please enter a Patient ID");
      return;
    }

    try {
      setPatientSearchLoading(true);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/single-patient`,
        {
          params: {
            id: patientSearchQuery,
            clinicId: clinicId,
          },
        }
      );

      const patient = res.data.data;

      if (patient) {
        setFoundPatient(patient);

        setEditingAppointment((prev) => ({
          ...prev,
          patientId: patient._id,
          patientName: patient.name,
        }));

        alert(`Patient found: ${patient.name}`);
      } else {
        alert("No patient found with this ID");
        setFoundPatient(null);
        setEditingAppointment((prev) => ({
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
      setEditingAppointment((prev) => ({
        ...prev,
        patientId: "",
        patientName: "",
      }));
    } finally {
      setPatientSearchLoading(false);
    }
  };

  // Patient registration handler
  const handlePatientRegistration = async () => {
    try {
      // Basic validation
      if (
        !newPatientForm.name ||
        !newPatientForm.phone ||
        !newPatientForm.age ||
        !newPatientForm.gender
      ) {
        alert("Please fill all required fields");
        return;
      }

      // Validate doctor and department selection
      if (!selectedDepartment || !editingAppointment.doctorId) {
        alert("Please select department and doctor for the appointment");
        return;
      }

      setRegistrationLoading(true);

      // Build medical history
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

      // Prepare registration payload
      const registrationPayload = {
        userRole: "receptionist",
        userId: reception?.id || "",
        name: newPatientForm.name,
        phone: newPatientForm.phone,
        email: newPatientForm.email || "",
        age: Number(newPatientForm.age),
        gender: newPatientForm.gender,
        address: newPatientForm.address || "",
        medicalHistory,
      };

      console.log("Registration payload:", registrationPayload);

      const response = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/register/${clinicId}`,
        registrationPayload
      );

      console.log("Registration response:", response);

      const data = response.data;

      if (data.success || data.patient || data.data) {
        const patient = data.data?.patient || data.patient || data.data;

        alert("Patient registered successfully!");

        // Update found patient state
        setFoundPatient(patient);

        // Update appointment form with new patient details
        setEditingAppointment((prev) => ({
          ...prev,
          patientId: patient._id || patient.patientId,
          patientName: patient.name,
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

        console.log("Registered patient:", patient);
      } else {
        alert(data.message || "Failed to register patient");
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert("Server error while registering patient");
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Get status class for styling
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
      case "needs_reschedule":
        return styles.statusNeedsReschedule || styles.statusPending;
      default:
        return styles.statusConfirmed;
    }
  };

  // Fetch appointments on component mount and when month/year changes
  useEffect(() => {
    if (clinicId) {
      fetchAppointments();
    }
  }, [clinicId]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!clinicId) return;

      try {
        const response = await axios.get(
          `${clinicServiceBaseUrl}/api/v1/clinic-service/department/details/${clinicId}`
        );

        const departments = response.data?.departments || [];
        setDepartments(departments);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, [clinicId]);

  // Handle department selection
  const handleDepartmentSelect = async (department: string) => {
    setSelectedDepartment(department);
    setEditingAppointment((prev) => ({ ...prev, doctorId: "" }));

    try {
      setAvailabilityLoading(true);
      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/department-based/availability`,
        {
          params: { clinicId, department },
        }
      );

      const doctors = response.data?.doctors || [];

      if (doctors.length > 0) {
        setDoctorAvailability(
          doctors.map((doc: any) => ({
            doctorId: doc.doctorId || doc._id,
            doctorName: doc.doctor?.name || doc.name || "Unnamed Doctor",
            email: doc.doctor?.email || doc.email || "N/A",
            phoneNumber: doc.doctor?.phoneNumber || doc.phoneNumber || "N/A",
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
  console.log("apoo",appointments);
  
  // Custom sidebar card renderer
  const renderSidebarCard = (apt: CalendarAppointment) => {
    const fullAppointment = appointments.find((a) => a.id === apt.id);
    if (!fullAppointment) return null;

    const appointmentDate = new Date(fullAppointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPastAppointment = appointmentDate < today;
    const isToday = appointmentDate.toDateString() === today.toDateString();

    return (
      <div
        className={`${styles.appointmentDetailCard} ${
          isPastAppointment ? styles.pastAppointment : ""
        }`}
        onClick={() => !isPastAppointment && handleEditAppointment(apt)}
        style={{
          cursor: isPastAppointment ? "not-allowed" : "pointer",
          opacity: isPastAppointment ? 0.7 : 1,
        }}
      >
        <div className={styles.appointmentDetailHeader}>
          <div className={styles.appointmentTimeDetail}>
            <Clock className={styles.iconSmall} />
            {apt.time}
            {isToday && <span className={styles.todayBadge}>Today</span>}
            {isPastAppointment && (
              <span className={styles.pastBadge}>Past</span>
            )}
          </div>
          <span
            className={getStatusClass(fullAppointment.status)}
            style={{ padding: "5px", borderRadius: "10px" }}
          >
            {fullAppointment.status.replace("_", " ").toUpperCase()}
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
            {fullAppointment.doctorName}
          </div>
          <div className={styles.infoRow}>
            <Calendar className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Date:</span>{" "}
            {new Date(fullAppointment.date).toLocaleDateString()}
          </div>
          {fullAppointment.reason && (
            <div className={styles.infoRow}>
              <FileText className={styles.iconSmallGray} />
              <span className={styles.infoLabel}>Reason:</span>{" "}
              {fullAppointment.reason}
            </div>
          )}
        </div>
        {isPastAppointment && (
          <div className={styles.pastAppointmentOverlay}>
            <span>Past appointments cannot be edited</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={styles.appointmentSchedulerContainer}>
        <CalendarView
          appointments={appointments.map((apt) => ({
            id: apt.id,
            patientName: apt.patientName,
            doctor: apt.doctorName,
            time: apt.time,
            date: apt.date,
            status: apt.status,
            type: apt.type,
          }))}
          onCreateAppointment={handleCreateAppointment}
          onAppointmentClick={handleEditAppointment}
          renderSidebarCard={renderSidebarCard}
          initialDate={new Date(currentYear, currentMonth - 1, 1)}
          headerTitle={`${
            monthNames[currentMonth - 1]
          } ${currentYear} Appointments`}
          headerSubtitle="Click any future date to schedule a new appointment"
          // Add these new props to sync month/year
          currentMonth={currentMonth}
          currentYear={currentYear}
          onMonthChange={handleMonthChange}
        />

        {loading && (
          <div className={styles.loadingOverlay}>
            <Loader2 className={styles.spinner} size={32} />
            <span>Loading appointments...</span>
          </div>
        )}
      </div>

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
                  {editingAppointment.date && (
                    <span>
                      {new Date(editingAppointment.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  )}
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
                      <span>Date *</span>
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
                      min={new Date().toISOString().split("T")[0]} // Prevent past dates
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                      <Clock size={14} />
                      <span>Time *</span>
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
                <p className={styles.hintText}>
                  Note: Past dates cannot be selected for appointments
                </p>
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
                          placeholder="Enter Patient Unique ID (e.g., RKC-00001)"
                          value={patientSearchQuery}
                          onChange={(e) =>
                            setPatientSearchQuery(e.target.value)
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handlePatientSearch()
                          }
                        />
                        <button
                          type="button"
                          className={styles.searchButton}
                          onClick={handlePatientSearch}
                          disabled={
                            patientSearchLoading || !patientSearchQuery.trim()
                          }
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
                          <span className={styles.patientInfoValue}>
                            {foundPatient.name}
                          </span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>
                            Patient ID:
                          </span>
                          <span className={styles.patientInfoValue}>
                            {foundPatient.patientUniqueId || foundPatient._id}
                          </span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>Age:</span>
                          <span className={styles.patientInfoValue}>
                            {foundPatient.age}
                          </span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>
                            Gender:
                          </span>
                          <span className={styles.patientInfoValue}>
                            {foundPatient.gender}
                          </span>
                        </div>
                        <div className={styles.patientInfoItem}>
                          <span className={styles.patientInfoLabel}>
                            Phone:
                          </span>
                          <span className={styles.patientInfoValue}>
                            {foundPatient.phone}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.clearPatientButton}
                        onClick={() => {
                          setFoundPatient(null);
                          setPatientSearchQuery("");
                          setEditingAppointment((prev) => ({
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
                        <label className={styles.inputLabel}>
                          Patient ID *
                        </label>
                        <input
                          className={styles.input}
                          placeholder="RKC-00001"
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
                        <label className={styles.inputLabel}>
                          Patient Name *
                        </label>
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
                  {/* Basic Information Section */}
                  <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                      Basic Information *
                    </label>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          <User size={14} />
                          <span>Full Name *</span>
                        </label>
                        <input
                          className={styles.input}
                          placeholder="John Doe"
                          value={newPatientForm.name}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          <Phone size={14} />
                          <span>Phone Number *</span>
                        </label>
                        <input
                          className={styles.input}
                          placeholder="+1234567890"
                          value={newPatientForm.phone}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Age *</label>
                        <input
                          className={styles.input}
                          type="number"
                          placeholder="30"
                          value={newPatientForm.age}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              age: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Gender *</label>
                        <div className={styles.selectWrapper}>
                          <select
                            className={styles.select}
                            value={newPatientForm.gender}
                            onChange={(e) =>
                              setNewPatientForm({
                                ...newPatientForm,
                                gender: e.target.value as
                                  | "Male"
                                  | "Female"
                                  | "Other"
                                  | "",
                              })
                            }
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          <Mail size={14} />
                          <span>Email</span>
                        </label>
                        <input
                          className={styles.input}
                          type="email"
                          placeholder="john@example.com"
                          value={newPatientForm.email}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>
                          <MapPin size={14} />
                          <span>Address</span>
                        </label>
                        <input
                          className={styles.input}
                          placeholder="123 Main St, City"
                          value={newPatientForm.address}
                          onChange={(e) =>
                            setNewPatientForm({
                              ...newPatientForm,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
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
                </>
              )}

              {/* Department Selection - For both new and existing patients */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Select Department</label>
                <div className={styles.departmentsGrid}>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      className={`${styles.departmentButton} ${
                        selectedDepartment === dept
                          ? styles.departmentButtonActive
                          : ""
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

              {/* Doctor Selection - For both new and existing patients */}
              {selectedDepartment && (
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
                        onChange={(e) => {
                          const doctorId = e.target.value;
                          setEditingAppointment({
                            ...editingAppointment,
                            doctorId: doctorId,
                          });
                        }}
                        disabled={doctorAvailability.length === 0}
                        required
                      >
                        <option value="">Choose a doctor</option>
                        {doctorAvailability.map((doc) => (
                          <option key={doc.doctorId} value={doc.doctorId}>
                            {doc.doctorName} ({doc.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedDepartment &&
                      doctorAvailability.length === 0 &&
                      !availabilityLoading && (
                        <p className={styles.hintText}>
                          No doctors available in this department
                        </p>
                      )}
                  </div>

                  {/* Display selected doctor's availability */}
                  {editingAppointment.doctorId &&
                    doctorAvailability.length > 0 && (
                      <div className={styles.doctorAvailabilityCard}>
                        <div className={styles.doctorAvailabilityHeader}>
                          <Check className={styles.successIcon} size={18} />
                          <span>Doctor Availability</span>
                        </div>
                        <div className={styles.doctorInfoGrid}>
                          {(() => {
                            const selectedDoctor = doctorAvailability.find(
                              (doc) =>
                                doc.doctorId === editingAppointment.doctorId
                            );
                            if (!selectedDoctor) return null;

                            return (
                              <>
                                <div className={styles.doctorInfoItem}>
                                  <span className={styles.doctorInfoLabel}>
                                    Name:
                                  </span>
                                  <span className={styles.doctorInfoValue}>
                                    {selectedDoctor.doctorName}
                                  </span>
                                </div>
                                <div className={styles.doctorInfoItem}>
                                  <span className={styles.doctorInfoLabel}>
                                    Specialization:
                                  </span>
                                  <span className={styles.doctorInfoValue}>
                                    {selectedDoctor.specialization}
                                  </span>
                                </div>
                                <div className={styles.doctorInfoItem}>
                                  <span className={styles.doctorInfoLabel}>
                                    Status:
                                  </span>
                                  <span className={styles.doctorInfoValue}>
                                    {selectedDoctor.status}
                                  </span>
                                </div>
                                <div className={styles.doctorInfoItem}>
                                  <span className={styles.doctorInfoLabel}>
                                    Available Slots:
                                  </span>
                                  <div className={styles.availabilitySlots}>
                                    {selectedDoctor.availableSlots.length >
                                    0 ? (
                                      selectedDoctor.availableSlots.map(
                                        (slot, index) => (
                                          <div
                                            key={index}
                                            className={styles.slotBadge}
                                          >
                                            {slot}
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <span className={styles.doctorInfoValue}>
                                        No specific slots available
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Appointment Type - For both */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Appointment Type</label>
                <div className={styles.formGroup}>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.select}
                      value={editingAppointment.type}
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          type: e.target.value as
                            | "new"
                            | "follow-up"
                            | "emergency"
                            | "procedure",
                        })
                      }
                    >
                      <option value="new">New Patient</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                      <option value="procedure">Procedure</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reason for Appointment - For both */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>
                  Reason for Appointment
                </label>
                <div className={styles.formGroup}>
                  <textarea
                    className={styles.textarea}
                    placeholder="Describe the reason for the appointment..."
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

              {/* Register Patient Button - Only for new patients */}
              {isNewPatient && (
                <div className={styles.section}>
                  <button
                    onClick={handlePatientRegistration}
                    disabled={
                      registrationLoading ||
                      !newPatientForm.name ||
                      !newPatientForm.phone ||
                      !newPatientForm.age ||
                      !newPatientForm.gender ||
                      !selectedDepartment ||
                      !editingAppointment.doctorId
                    }
                    className={styles.registerButton}
                  >
                    {registrationLoading ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Registering Patient...</span>
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
                </div>
              )}
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
                    !editingAppointment.time ||
                    (isNewPatient && !foundPatient)
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
