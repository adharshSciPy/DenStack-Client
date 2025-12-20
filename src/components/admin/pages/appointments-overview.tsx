import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  ChevronRight,
  Plus,
  Upload,
  Building2,
  DollarSign,
  FileText,
  // AlertCircleIcon
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import { useParams } from "react-router-dom";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import labBaseUrl from "../../../labBaseUrl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";
import PatientCRMModal from "../../PatientCRM";

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  opNumber?: number;
  rescheduledFromOp?: number;
  patientId: {
    _id: string;
    name: string;
    phone: number;
    email: string;
    patientUniqueId: string;
    age: number;
  };
}

interface FullStatus {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  tomorrowRescheduleCount?: number;
}

interface Patient {
  _id: string;
  name: string;
  phone: number;
  email: string;
  patientUniqueId: string;
  age: number;
}

interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  availableSlots: string[];
  department: string;
}
type ResDoctor = {
  doctorId: string;
  doctor: {
    name: string;
  };
  roleInClinic: string;
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
};

export function AppointmentsOverview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fullStatus, setFullStatus] = useState<FullStatus>({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [labName, setLabName] = useState<any[]>([]);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Patient Search
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  // Patient Registration State
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    conditions: "",
    surgeries: "",
    allergies: "",
    familyHistory: "",
  });
  const [results, setResults] = useState([]);

  // Step 2: Department Selection
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState<
    DoctorAvailability[]
  >([]);

  // Step 3: Doctor & Time Selection
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [showingRange, setShowingRange] = useState("");
  const [totalAppointments, setTotalAppointments] = useState(0);
  // const [currentCursor, setCurrentCursor] = useState(null);
  const [pageCursors, setPageCursors] = useState([]); // store cursors for pages
  const [currentPageIndex, setCurrentPageIndex] = useState(-1);
  const [formData, setFormData] = useState({
    vendor: "",
    dentist: "",
    patientName: "",
    deliveryDate: "",
    note: "",
    price: "",
  });
  // -------------------- RESCHEDULE STATES --------------------
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState("");

  const [resDepartments, setResDepartments] = useState<string[]>([]);
  const [resSelectedDepartment, setResSelectedDepartment] = useState("");

  const [resDoctors, setResDoctors] = useState<ResDoctor[]>([]);

  const [resSelectedDoctorId, setResSelectedDoctorId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [resDoctorAvailability, setResDoctorAvailability] = useState<string[]>(
    []
  );

  const [resNewDate, setResNewDate] = useState("");
  const [resNewTime, setResNewTime] = useState("");
  const [search, setSearch] = useState("");

  const [resLoading, setResLoading] = useState(false);
  const [missingOps, setMissingOps] = useState([]);
  const [openMissingOps, setOpenMissingOps] = useState(false);
  const[viewOpen,setViewOpen]=useState(false);
  const[viewAppointment,setViewAppointment]=useState<any>(null)

const Info = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p style={{ fontSize: 12, color: "#6b7280" }}>{label}</p>
    <p style={{ fontWeight: 500 }}>{value || "-"}</p>
  </div>
);


  const { clinicId } = useParams();
  const today = new Date();
  const [doctors, setDoctors] = useState([]);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const todayFormatted = today.toLocaleDateString("en-US", options);

  // const departments = [
  //   "Cardiology",
  //   "Neurology",
  //   "Orthopedics",
  //   "Pediatrics",
  //   "Dermatology",
  //   "General Medicine",
  //   "Dental",
  //   "ENT",
  //   "Ophthalmology"
  // ];

  // Fetch appointments from backend
  const LIMIT = 15;
  const fetchAppointments = async (
    query = "",
    date = "",
    cursor = null,
    limit = LIMIT,
    addToCursors = true
  ) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/clinic-appointments/${clinicId}`,
        {
          params: {
            search: query || undefined,
            startDate: date || undefined,
            lastId: cursor || undefined,
            limit,
          },
        }
      );

      const data = response.data || {};
      const newAppointments = data.data || [];
      console.log("helloookojidjwjdx9e8", response.data);
      // Replace current appointments
      setAppointments(newAppointments);
      setNextCursor(data.nextCursor || null);
      setTotalAppointments(data.totalAppointments || 0);

      // Update stats
      const stats = data.stats || {};
      setFullStatus({
        totalAppointments:
          stats.totalAppointments || data.totalAppointments || 0,
        completedAppointments: stats.completedCount || 0,
        pendingAppointments: stats.scheduledCount || 0,
        cancelledAppointments: stats.cancelledCount || 0,
        tomorrowRescheduleCount: data.tomorrowRescheduleCount || 0,
      });

      // Update showing range
      const start = newAppointments.length
        ? cursor
          ? currentPageIndex * limit + 1
          : 1
        : 0;
      const end = start + newAppointments.length - 1;
      setShowingRange(`${start}-${end} of ${data.totalAppointments || 0}`);
      setMissingOps(data.missingOps || []);

      // Save cursor for this page
      if (addToCursors && cursor) {
        const newCursors = [...pageCursors];
        newCursors.push(cursor);
        setPageCursors(newCursors);
        setCurrentPageIndex(newCursors.length - 1);
      } else if (!cursor) {
        // first page
        setPageCursors([]);
        setCurrentPageIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial load
  useEffect(() => {
    if (!clinicId) return;
    fetchAppointments("", "", null, LIMIT);
  }, [clinicId]);

  // ✅ Search handler
  const handleSearch = () => {
    fetchAppointments(searchQuery, selectedDate);
  };

  // ✅ Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDate("");
    fetchAppointments();
  };

  // ✅ Load more handler
  const handleNextPage = () => {
    if (nextCursor && !loading) {
      fetchAppointments(searchQuery, selectedDate, nextCursor, LIMIT, true);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0 && !loading) {
      const prevCursor = pageCursors[currentPageIndex - 1];
      fetchAppointments(searchQuery, selectedDate, prevCursor, LIMIT, false);
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (currentPageIndex === 0 && !loading) {
      // Go back to first page
      fetchAppointments(searchQuery, selectedDate, null, LIMIT, false);
      setCurrentPageIndex(-1);
    }
  };

  // Step 1: Patient Search
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
            clinicId: clinicId, // ✅ pass current clinic ID
          },
        }
      );

      const patient = res.data.data;
      if (patient?._id) {
        setFoundPatient(patient);
        alert(`Patient found: ${patient.name}`);
      } else {
        alert("No patient found for this ID");
        setFoundPatient(null);
      }
    } catch (error: any) {
      console.error("Error fetching patient:", error);

      // ✅ Show the backend message if available
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Error fetching patient. Please try again.");
      }

      setFoundPatient(null);
    } finally {
      setPatientSearchLoading(false);
    }
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Patient Registration
  const handlePatientRegistration = async () => {
    try {
      if (
        !newPatient.name ||
        !newPatient.phone ||
        !newPatient.age ||
        !newPatient.gender
      ) {
        alert("Please fill all required fields");
        return;
      }

      setRegistrationLoading(true);

      // ✅ Convert comma-separated strings to arrays
      const medicalHistory = {
        conditions: newPatient.conditions
          ? newPatient.conditions
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : [],
        surgeries: newPatient.surgeries
          ? newPatient.surgeries
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        allergies: newPatient.allergies
          ? newPatient.allergies
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        familyHistory: newPatient.familyHistory
          ? newPatient.familyHistory
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
          : [],
      };

      const payload = {
        userRole: "admin", 
        userId: clinicId, 
        name: newPatient.name,
        phone: newPatient.phone,
        email: newPatient.email,
        age: Number(newPatient.age),
        gender: newPatient.gender,
        medicalHistory,
      };

      const response = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/register/${clinicId}`,
        payload
      );

      if (response.data.success) {
        // toast.success("Patient registered successfully!");
        setFoundPatient(response.data.patient); // ✅ Show patient details instead of search
        setRegistrationOpen(false); // close registration modal
        setPatientSearchQuery(response.data.patient.patientUniqueId || ""); // optional
      } else {
        // toast.error(response.data.message || "Failed to register patient");
      }
    } catch (error) {
      console.error("Error registering patient:", error);
      // toast.error((error as any).response?.data?.message || "Server error while registering patient");
    } finally {
      setRegistrationLoading(false);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };
  //fetch departments from backend
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
            availableSlots:
              doc.availability
                ?.filter((a: any) => a.isActive)
                ?.map(
                  (a: any) => `${a.dayOfWeek}: ${a.startTime} - ${a.endTime}`
                ) || [],
          }))
        );

        setCurrentStep(3);
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

  // Step 3: Select Doctor
  const handleDoctorSelect = (doctorId: string, doctorName: string) => {
    setSelectedDoctor(doctorId);
    setSelectedDoctorName(doctorName);
  };
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
      handleCloseModal();
      fetchAppointments();
    } catch (error) {
      alert("Force booking failed");
    } finally {
      setLoading(false);
    }
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Final Submit

  const handleCloseModal = () => {
    setOpen(false);
    setCurrentStep(1);
    setFoundPatient(null);
    setPatientSearchQuery("");
    setSelectedDepartment("");
    setSelectedDoctor("");
    setSelectedDoctorName("");
    setSelectedTime("");
    setAppointmentDate("");
    setDoctorAvailability([]);

    // ✅ ADD THESE MISSING RESETS:
    setAvailabilityLoading(false);
    setLoading(false);
    setRegistrationOpen(false);
    setNewPatient({
      name: "",
      phone: "",
      email: "",
      age: "",
      gender: "",
      conditions: "",
      surgeries: "",
      allergies: "",
      familyHistory: "",
    });
  };

  const canProceedToStep2 = foundPatient !== null;
  const canProceedToStep3 = canProceedToStep2 && selectedDepartment !== "";
  // reschedule
  const fetchRescheduleDepartments = async () => {
    try {
      const res = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/department/details/${clinicId}`
      );
      setResDepartments(res.data?.departments || []);
    } catch (err) {
      console.log("Err loading departments", err);
    }
  };
  const fetchRescheduleDoctors = async (dept: string) => {
    setResSelectedDepartment(dept);

    try {
      const res = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/department-based/availability`,
        { params: { clinicId, department: dept } }
      );

      const filtered = (res.data?.doctors || []).filter((d: any) =>
        d.specialization?.some(
          (s: string) => s.toLowerCase() === dept.toLowerCase()
        )
      );

      setResDoctors(filtered);
    } catch (err) {
      console.log("Error fetching doctors", err);
      setResDoctors([]);
    }
  };
  const selectRescheduleDoctor = (doctorId: string) => {
    setResSelectedDoctorId(doctorId);

    const doc = resDoctors.find((d) => d.doctorId === doctorId);
    const slots =
      doc?.availability
        ?.filter((a) => a.isActive)
        ?.map((a) => `${a.dayOfWeek}: ${a.startTime} - ${a.endTime}`) || [];

    setResDoctorAvailability(slots);
  };

  const submitReschedule = async () => {
    if (!resSelectedDoctorId || !resNewDate || !resNewTime) {
      alert("Please fill all fields");
      return;
    }

    try {
      setResLoading(true);

      const payload = {
        doctorId: resSelectedDoctorId,
        newDate: resNewDate,
        newTime: resNewTime,
        userId: clinicId,
        userRole: "admin",
        forceReschedule: true,
      };

      const res = await axios.patch(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/reschedule/${rescheduleAppointmentId}`,
        payload
      );

      alert(res.data.message);

      // ✅ PROPER CLEANUP
      resetRescheduleForm();
      setRescheduleAppointmentId(""); // ✅ ADD THIS
      setRescheduleOpen(false);

      fetchAppointments(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reschedule");
    } finally {
      setResLoading(false);
    }
  };
  useEffect(() => {
    document.body.style.overflow = rescheduleOpen ? "hidden" : "auto";
  }, [rescheduleOpen]);

  const resetRescheduleForm = () => {
    setResSelectedDepartment("");
    setResSelectedDoctorId("");
    setResDoctorAvailability([]);
    setResNewDate("");
    setResNewTime("");
  };
  useEffect(() => {
    getDoctors(), getAllLab();
  }, [clinicId]);
  const getDoctors = async () => {
    try {
      const res = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/active-doctors?clinicId=${clinicId}`
      );
      setDoctors(res.data.doctors);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllLab = async () => {
    try {
      const res = await axios.get(`${labBaseUrl}api/v1/lab/vendors`);
      console.log("labbbb", res.data);
      setLabName(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const setlabOrder = async (appointment: Appointment) => {
    setIsOpen(true);
    setAppointment(appointment);
    console.log("ss", appointment);
  };
  const logFormData = (formData: FormData) => {
    const entries: any = {};
    formData.forEach((value, key) => {
      entries[key] = value;
    });
    console.log("FormData =>", entries);
  };
  const handleSubmit = async () => {
    if (!foundPatient?._id) {
      alert("Please search and select a patient first");
      return;
    }
    if (!selectedDepartment) {
      alert("Please select a department");
      return;
    }
    if (!selectedDoctor) {
      alert("Please select a doctor");
      return;
    }
    if (!appointmentDate) {
      alert("Please select an appointment date");
      return;
    }
    if (!selectedTime) {
      alert("Please select an appointment time");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: clinicId,
        userRole: "admin",
        patientId: foundPatient._id,
        doctorId: selectedDoctor,
        department: selectedDepartment,
        appointmentDate,
        appointmentTime: selectedTime,
      };

      const res = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/book/${clinicId}`,
        payload
      );

      alert(res.data.message);
      handleCloseModal();
      fetchAppointments();
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const confirmForce = window.confirm(
          `${error.response.data.message}\n\nDo you want to force book with a different doctor?`
        );

        if (confirmForce) {
          return forceBookAppointment(); // ⬅️ we call a new function
        }

        return; // stop normal flow
      }

      alert(
        error.response?.data?.message ||
          "Failed to book appointment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key as keyof typeof formData]);
      });
      if (appointment?._id) {
        formDataToSend.append("appointmentId", appointment?._id);
      }
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });

      logFormData(formDataToSend);
      const response = await axios.post(
        `${labBaseUrl}api/v1/lab-orders/dental-orders`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        alert("Dental lab order created successfully!");
        setIsOpen(false);
        setFormData({
          vendor: "",
          dentist: "",
          patientName: "",
          deliveryDate: "",
          note: "",
          price: "",
          // appointmentId: "",
        });
        setFiles([]);

      }
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "Unknown error occurred";
      alert("Error creating order: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (appointment?.patientId?.name) {
      setFormData((prev) => ({
        ...prev,
        patientName: appointment.patientId._id
      }));
    }
  }, [appointment]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Today's Appointments</h2>
          <p className="text-muted-foreground">{todayFormatted}</p>
        </div>

        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => setOpen(true)}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule New
        </Button>
      </div>

      {/* Full Screen Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-semibold">Book New Appointment</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`flex items-center gap-2 ${
                      currentStep >= 1 ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= 1
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      1
                    </div>
                    <span className="text-sm font-medium">Patient</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div
                    className={`flex items-center gap-2 ${
                      currentStep >= 2 ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= 2
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      2
                    </div>
                    <span className="text-sm font-medium">Department</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div
                    className={`flex items-center gap-2 ${
                      currentStep >= 3 ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= 3
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      3
                    </div>
                    <span className="text-sm font-medium">Doctor & Time</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Patient Search */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* 🔹 Search / Register Patient Section */}
                  <div className="border-2 border-primary/20 p-6 rounded-lg bg-primary/5 relative">
                    {!foundPatient ? (
                      <>
                        <Label className="text-lg font-semibold mb-4 block">
                          Search Patient by ID or Register New Patient
                        </Label>
                        <div className="flex flex-wrap gap-3">
                          <Input
                            placeholder="Enter Patient Unique ID (e.g., SCI-000003)"
                            value={patientSearchQuery}
                            onChange={(e) =>
                              setPatientSearchQuery(e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handlePatientSearch();
                              }
                            }}
                            className="flex-1 h-12 text-lg"
                          />
                          <Button
                            onClick={handlePatientSearch}
                            disabled={patientSearchLoading}
                            className="min-w-[140px] h-12"
                            size="lg"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            {patientSearchLoading ? "Searching..." : "Search"}
                          </Button>
                          <Button
                            onClick={() => setRegistrationOpen(true)}
                            disabled={patientSearchLoading}
                            className="min-w-[140px] h-12 bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Register
                          </Button>
                        </div>
                      </>
                    ) : (
                      // ✅ Patient found or registered — show details
                      <div className="mt-6 p-6 bg-green-50 border-2 border-green-300 rounded-lg animate-fadeIn">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                              <p className="font-bold text-xl text-green-800">
                                Patient{" "}
                                {patientSearchQuery
                                  ? "Found"
                                  : "Registered Successfully"}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  Full Name
                                </p>
                                <p className="text-base font-semibold">
                                  {foundPatient.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  Patient ID
                                </p>
                                <p className="text-base font-semibold">
                                  {foundPatient.patientUniqueId}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  Age
                                </p>
                                <p className="text-base font-semibold">
                                  {foundPatient.age} years
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  Phone
                                </p>
                                <p className="text-base font-semibold">
                                  {foundPatient.phone}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-gray-600 mb-1">
                                  Email
                                </p>
                                <p className="text-base font-semibold">
                                  {foundPatient.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setFoundPatient(null);
                              setPatientSearchQuery("");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🔹 Step Navigation */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep2}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      Next: Select Department
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* 🔹 Patient Registration Modal */}
                  {registrationOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                          <h2 className="text-2xl font-semibold">
                            Register New Patient
                          </h2>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRegistrationOpen(false)}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="p-6 space-y-4">
                          <div>
                            <Label className="mb-2 block">Full Name *</Label>
                            <Input
                              placeholder="Enter full name"
                              value={newPatient.name}
                              onChange={(e) =>
                                setNewPatient({
                                  ...newPatient,
                                  name: e.target.value,
                                })
                              }
                              className="h-12"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="mb-2 block">
                                Phone Number *
                              </Label>
                              <Input
                                type="tel"
                                placeholder="10-digit phone number"
                                value={newPatient.phone}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    phone: e.target.value,
                                  })
                                }
                                className="h-12"
                                maxLength={10}
                              />
                            </div>

                            <div>
                              <Label className="mb-2 block">Age *</Label>
                              <Input
                                type="number"
                                placeholder="Age"
                                value={newPatient.age}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    age: e.target.value,
                                  })
                                }
                                className="h-12"
                                min="0"
                                max="150"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="mb-2 block">
                              Email (Optional)
                            </Label>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              value={newPatient.email}
                              onChange={(e) =>
                                setNewPatient({
                                  ...newPatient,
                                  email: e.target.value,
                                })
                              }
                              className="h-12"
                            />
                          </div>

                          <div className="relative z-[70] w-full">
                            <Label className="mb-2 block">Gender *</Label>
                            <Select
                              value={newPatient.gender}
                              onValueChange={(value: string) =>
                                setNewPatient({ ...newPatient, gender: value })
                              }
                            >
                              {/* Trigger */}
                              <SelectTrigger className="h-12 w-full bg-white">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>

                              {/* Dropdown (force full width same as trigger) */}
                              <SelectContent
                                className="z-[80] w-[var(--radix-select-trigger-width)] bg-white border rounded-lg shadow-lg"
                                style={{
                                  width: "var(--radix-select-trigger-width)",
                                }}
                              >
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="border-t pt-4 mt-4">
                            <Label className="mb-3 block text-base font-semibold">
                              Medical History (Optional)
                            </Label>
                            <div className="space-y-3">
                              <div>
                                <Label className="mb-2 block text-sm">
                                  Conditions
                                </Label>
                                <Input
                                  placeholder="e.g., Hypertension, Asthma (comma-separated)"
                                  value={newPatient.conditions}
                                  onChange={(e) =>
                                    setNewPatient({
                                      ...newPatient,
                                      conditions: e.target.value,
                                    })
                                  }
                                  className="h-11"
                                />
                              </div>

                              <div>
                                <Label className="mb-2 block text-sm">
                                  Surgeries
                                </Label>
                                <Input
                                  placeholder="e.g., Heart transplant, Appendectomy (comma-separated)"
                                  value={newPatient.surgeries}
                                  onChange={(e) =>
                                    setNewPatient({
                                      ...newPatient,
                                      surgeries: e.target.value,
                                    })
                                  }
                                  className="h-11"
                                />
                              </div>

                              <div>
                                <Label className="mb-2 block text-sm">
                                  Allergies
                                </Label>
                                <Input
                                  placeholder="e.g., Dust, Pollen, Penicillin (comma-separated)"
                                  value={newPatient.allergies}
                                  onChange={(e) =>
                                    setNewPatient({
                                      ...newPatient,
                                      allergies: e.target.value,
                                    })
                                  }
                                  className="h-11"
                                />
                              </div>

                              <div>
                                <Label className="mb-2 block text-sm">
                                  Family History
                                </Label>
                                <Input
                                  placeholder="e.g., Diabetes, Heart disease (comma-separated)"
                                  value={newPatient.familyHistory}
                                  onChange={(e) =>
                                    setNewPatient({
                                      ...newPatient,
                                      familyHistory: e.target.value,
                                    })
                                  }
                                  className="h-11"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setRegistrationOpen(false)}
                              disabled={registrationLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handlePatientRegistration}
                              disabled={registrationLoading}
                              className="min-w-[150px] bg-green-600 hover:bg-green-700"
                            >
                              {registrationLoading
                                ? "Registering..."
                                : "Register Patient"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Department Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-2 border-primary/20 p-6 rounded-lg">
                    <Label className="text-lg font-semibold mb-4 block">
                      Select Department
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {departments.map((dept) => (
                        <Button
                          key={dept}
                          variant={
                            selectedDepartment === dept ? "default" : "outline"
                          }
                          className={`h-16 text-base ${
                            selectedDepartment === dept
                              ? "bg-primary text-white"
                              : "hover:bg-primary/10"
                          }`}
                          onClick={() => handleDepartmentSelect(dept)}
                          disabled={availabilityLoading}
                        >
                          {dept}
                        </Button>
                      ))}
                    </div>
                    {availabilityLoading && (
                      <div className="mt-4 text-center text-primary">
                        <p>Loading doctor availability...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      size="lg"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Doctor & Time Selection */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-2 border-primary/20 p-6 rounded-lg">
                    <Label className="text-lg font-semibold mb-4 block">
                      Select Doctor
                    </Label>

                    {doctorAvailability.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No doctors available for {selectedDepartment}</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {doctorAvailability.map((doctor) => (
                          <div
                            key={doctor.doctorId}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedDoctor === doctor.doctorId
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-primary/50"
                            }`}
                            onClick={() =>
                              handleDoctorSelect(
                                doctor.doctorId,
                                doctor.doctorName
                              )
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-lg">
                                  {doctor.doctorName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {doctor.department}
                                </p>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  selectedDoctor === doctor.doctorId
                                    ? "border-primary bg-primary"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedDoctor === doctor.doctorId && (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>
                            {doctor.availableSlots &&
                              doctor.availableSlots.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-600 mb-2">
                                    Available Slots:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {doctor.availableSlots.map((slot, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {slot}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedDoctor && (
                    <div className="border-2 border-primary/20 p-6 rounded-lg">
                      <Label className="text-lg font-semibold mb-4 block">
                        Select Date & Time
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">
                            Appointment Date *
                          </Label>
                          <Input
                            type="date"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">
                            Appointment Time *
                          </Label>
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(2);
                        setSelectedDoctor("");
                        setSelectedDoctorName("");
                        setSelectedTime("");
                        setAppointmentDate("");
                      }}
                      size="lg"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        !selectedDoctor ||
                        !appointmentDate ||
                        !selectedTime ||
                        loading
                      }
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {loading ? "Booking..." : "Confirm Appointment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md bg-muted/60 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-primary">
                  {fullStatus.totalAppointments}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md bg-muted/60 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {fullStatus.completedAppointments}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md bg-muted/60 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {fullStatus.pendingAppointments}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md bg-muted/60 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Tomorrow’s Reschedules
                </p>
                <p className="text-3xl font-bold text-primary">
                  {fullStatus?.tomorrowRescheduleCount || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <div style={{ position: "relative" }}>
          <Card
            className="hover:shadow-md bg-muted/60 transition-shadow"
            onClick={() => setOpenMissingOps((prev) => !prev)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-semibold">
                    Missing OPs
                  </p>
                  <p className="text-3xl font-bold text-yellow-800">
                    {missingOps?.length || 0}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-700/60" />
              </div>
            </CardContent>
          </Card>

          {openMissingOps && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%", // dropdown appears below the card
                left: 0,
                width: "100%",
                maxWidth: "400px",
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                padding: "16px",
                zIndex: 99999, // very high z-index
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "#b45309", // yellow-800
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ⚠ Missing OP Numbers
              </h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                {missingOps
                  ?.sort((a, b) => a - b)
                  .map((op) => (
                    <span
                      key={op}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#fef3c7", // yellow-200
                        color: "#78350f", // yellow-900
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }}
                    >
                      OP #{op}
                    </span>
                  ))}
              </div>
              <p style={{ fontSize: "0.75rem", color: "#b45309" }}>
                These OP numbers are missing from today’s appointments.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* {openMissingOps && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setOpenMissingOps(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-yellow-800 flex items-center gap-2">
              ⚠ Missing OP Numbers
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {missingOps?.sort((a, b) => a - b).map((op) => (
                <span
                  key={op}
                  className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-full text-sm font-medium"
                >
                  OP #{op}
                </span>
              ))}
            </div>
            <p className="text-xs text-yellow-700">
              These OP numbers are missing from today’s appointments.
            </p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setOpenMissingOps(false)} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )} */}

      {/* Search Filters */}
      <div className="flex gap-3 items-center ">
        <Input
          placeholder="Enter Patient ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="w-[250px] bg-muted/60"
        />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[200px] bg-muted/60"
        />
        <Button
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 "
        >
          <Calendar className="w-4 h-4 mr-2" /> Search
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          className="bg-muted/60"
        >
          Clear
        </Button>
      </div>
      {/* ⚠ Missing OPs Section */}
      {/* {missingOps && missingOps.length > 0 && (
  <Card className="mb-4 bg-yellow-50 border-yellow-200 border">
    <CardHeader>
      <div className="flex items-center gap-2">
        <span className="text-yellow-700 text-lg font-semibold">⚠ Missing OP Numbers</span>
        <span className="text-sm text-yellow-800">
          ({missingOps.length} missing)
        </span>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {missingOps.sort((a, b) => a - b).map((op) => (
          <span
            key={op}
            className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-full text-sm font-medium shadow-sm hover:bg-yellow-300 cursor-default transition-colors"
            title={`OP #${op} is missing`}
          >
            OP #{op}
          </span>
        ))}
      </div>
      <p className="text-xs text-yellow-800 mt-2">
        These OP numbers belong to appointments rescheduled to future dates or not yet assigned.
      </p>
    </CardContent>
  </Card>
)} */}

      {/* Appointments List */}
      <Card className="bg-muted/60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {/* show number of loaded vs total */}
              {appointments.length > 0 ? (
                <span>
                  Appointments ({appointments.length}
                  {totalAppointments ? `/${totalAppointments}` : ""})
                </span>
              ) : (
                "No Appointments Found"
              )}
            </div>

            {/* showing range like "1-15 of 47" */}
            {showingRange && (
              <span className="text-sm text-muted-foreground">
                {showingRange}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No appointments scheduled for the selected criteria</p>
            </div>
          ) : (
            <>
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className={`flex justify-between items-start p-4 rounded-lg transition-colors w-full ${
                    appointment.status === "cancelled"
                      ? "bg-red-50 hover:bg-red-100 border border-red-200"
                      : "bg-green-50 hover:bg-green-100 border border-green-200"
                  }`}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-lg">
                        {appointment.patientId?.name}
                      </p>

                      {/* 🟡 Inline styled badge */}
                      <span
                        style={{
                          backgroundColor:
                            appointment.status === "confirmed"
                              ? "#22c55e" // green
                              : appointment.status === "cancelled"
                              ? "#ef4444" // red
                              : appointment.status === "rescheduled" ||
                                appointment.status === "needs_reschedule"
                              ? "#facc15" // yellow
                              : "#9ca3af", // gray
                          color:
                            appointment.status === "rescheduled" ||
                            appointment.status === "needs_reschedule"
                              ? "#000"
                              : "#fff",
                          fontWeight: "bold",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {appointment.status === "rescheduled" ||
                        appointment.status === "needs_reschedule"
                          ? "NEED RESCHEDULE"
                          : appointment.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-medium">
                          OP No:{" "}
                          <span
                            style={{
                              backgroundColor: "#facc15",
                              color: "#000",
                              fontWeight: "bold",
                              borderRadius: "8px",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {appointment.opNumber
                              ? `OP #${appointment.opNumber}`
                              : appointment.rescheduledFromOp
                              ? `Rescheduled OP #${appointment.rescheduledFromOp}`
                              : "Pending OP"}
                          </span>
                        </span>
                        <span className="text-sm font-medium">
                          Patient ID:{" "}
                          <span className="font-bold">
                            {appointment.patientId?.patientUniqueId}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {appointment.patientId?.phone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">
                          {appointment.appointmentTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.appointmentDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Dynamic button rendering */}
                {appointment.status !== "cancelled" && (
  <div className="flex items-start gap-2 ml-4">
    {/* Reschedule button */}
    {appointment.status === "needs_reschedule" && (
      <Button
        variant="outline"
        size="sm"
        onClick={(e:any) => {
          e.stopPropagation();
          setRescheduleAppointmentId(appointment._id);
          setRescheduleOpen(true);
          fetchRescheduleDepartments();
        }}
      >
        Reschedule
      </Button>
    )}

    {/* View button */}
    <Button
      variant="outline"
      size="sm"
      onClick={(e:any) => {
        e.stopPropagation();
        setViewAppointment(appointment); // store full appointment
        setViewOpen(true);
      }}
    >
      View
    </Button>
  </div>
)}

                </div>
              ))}
              {/* Load More */}
              {nextCursor && (
                <div className="flex justify-center mt-4 gap-2">
                  <Button
                    onClick={handlePrevPage}
                    disabled={currentPageIndex < 0 || loading}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextPage}
                    disabled={!nextCursor || loading}
                    variant="outline"
                  >
                    {loading ? "Loading..." : "Next"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        <PatientCRMModal
    viewOpen={viewOpen}
    setViewOpen={setViewOpen}
    viewAppointment={viewAppointment}
  />
      {rescheduleOpen && (
        <>
          {/* Prevent dropdown clipping */}
          <div style={{ position: "relative", zIndex: 9999999 }}>
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              {/* Modal Box */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  width: "100%",
                  maxWidth: "520px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: "0px 4px 24px rgba(0,0,0,0.15)",
                  animation: "fadeIn 0.2s ease-out",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "16px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e5e7eb",
                    position: "sticky",
                    top: 0,
                    background: "white",
                    zIndex: 20,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 600 }}>
                    Reschedule Appointment
                  </h2>

                  <button
                    onClick={() => {
                      resetRescheduleForm();
                      setRescheduleOpen(false);
                      setRescheduleAppointmentId("");
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "22px",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* Department */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 500,
                      }}
                    >
                      Department *
                    </label>

                    <Select
                      value={resSelectedDepartment}
                      onValueChange={fetchRescheduleDoctors}
                    >
                      <SelectTrigger
                        style={{
                          width: "100%",
                          height: "48px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "10px",
                          background: "#fff",
                        }}
                      >
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>

                      <SelectContent
                        className="w-full"
                        style={{
                          width: "var(--radix-select-trigger-width)",
                          zIndex: 999999999,
                          background: "white",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          marginTop: "1px",
                          boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
                        }}
                      >
                        {resDepartments.map((dept) => (
                          <SelectItem
                            key={dept}
                            value={dept}
                            style={{
                              height: "48px",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: "10px",
                              fontSize: "14px",
                            }}
                          >
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Doctor */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: 500,
                      }}
                    >
                      Doctor *
                    </label>

                    <Select
                      value={resSelectedDoctorId}
                      onValueChange={selectRescheduleDoctor}
                      disabled={!resSelectedDepartment}
                    >
                      <SelectTrigger
                        style={{
                          width: "100%",
                          height: "48px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "10px",
                          background: "#fff",
                        }}
                      >
                        <SelectValue placeholder="Select Doctor" />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          zIndex: 999999999,
                          background: "white",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db",
                          boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
                          width: "var(--radix-select-trigger-width)",
                          overflow: "hidden",
                          marginTop: "1px",
                        }}
                      >
                        {resDoctors.map((doc, index) => (
                          <SelectItem
                            key={doc.doctorId}
                            value={doc.doctorId}
                            style={{
                              height: "44px",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: "12px",
                              fontSize: "15px",
                              cursor: "pointer",
                              background: "white",
                              borderBottom:
                                index !== resDoctors.length - 1
                                  ? "1px solid #e5e7eb"
                                  : "none",
                              transition:
                                "background 0.15s ease, color 0.15s ease",
                            }}
                            onMouseEnter={(e: any) =>
                              (e.currentTarget.style.background = "#f3f4f6")
                            }
                            onMouseLeave={(e: any) =>
                              (e.currentTarget.style.background = "white")
                            }
                          >
                            {doc.doctor?.name} ({doc.roleInClinic})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability */}
                  {resDoctorAvailability.length > 0 && (
                    <div
                      style={{
                        padding: "14px",
                        background: "#eaffea",
                        border: "1px solid #c5e6c7",
                        borderRadius: "8px",
                      }}
                    >
                      <strong style={{ fontSize: "14px" }}>
                        Doctor Availability:
                      </strong>
                      {resDoctorAvailability.map((slot, i) => (
                        <p
                          key={i}
                          style={{ margin: "3px 0", fontSize: "14px" }}
                        >
                          • {slot}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Date Picker */}
                  <div>
                    <label
                      style={{
                        fontWeight: 500,
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      New Date *
                    </label>
                    <input
                      type="date"
                      value={resNewDate}
                      onChange={(e) => setResNewDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      style={{
                        width: "100%",
                        height: "48px",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                      }}
                    />
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label
                      style={{
                        fontWeight: 500,
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      New Time *
                    </label>
                    <input
                      type="time"
                      value={resNewTime}
                      onChange={(e) => setResNewTime(e.target.value)}
                      style={{
                        width: "100%",
                        height: "48px",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    padding: "16px 24px",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    background: "white",
                    position: "sticky",
                    bottom: 0,
                  }}
                >
                  <button
                    onClick={() => {
                      resetRescheduleForm();
                      setRescheduleOpen(false);
                    }}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      submitReschedule();
                      resetRescheduleForm();
                    }}
                    disabled={
                      !resSelectedDoctorId || !resNewDate || !resNewTime
                    }
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: "#2563eb",
                      color: "white",
                      cursor: "pointer",
                      minWidth: "150px",
                    }}
                  >
                    {resLoading ? "Rescheduling..." : "Confirm Reschedule"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            overflow: "hidden",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                zIndex: 10,
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#111827",
                  margin: 0,
                }}
              >
                Create Dental Lab Order
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleSubmitLab} style={{ padding: "24px" }}>
              <div style={{ display: "grid", gap: "20px" }}>
                {/* Vendor */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Building2 size={18} color="#6b7280" />
                    Lab
                  </label>
                  <select
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleSelectChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select Lab</option>
                    {labName.map((lab: any) => (
                      <option key={lab._id} value={lab._id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dentist */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <User size={18} color="#6b7280" />
                    Dentist
                  </label>
                  <select
                    name="dentist"
                    value={formData.dentist}
                    onChange={handleSelectChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor: any) => (
                      <option key={doctor._id} value={doctor.doctor._id}>
                        {doctor?.doctor?.name || ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ position: "relative" }}>
                  

                  {results.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "85px",
                        left: 0,
                        width: "100%",
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: 0,
                        margin: 0,
                        listStyle: "none",
                        maxHeight: "200px",
                        overflowY: "auto",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 2000,
                      }}
                    >
                      {results.map((p: any) => (
                        <li
                          key={p._id}
                          style={{
                            padding: "10px",
                            borderBottom: "1px solid #eee",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSearch(p.name);
                            setFormData((prev) => ({
                              ...prev,
                              patientName: p._id,
                            }));
                            setResults([]);
                          }}
                        >
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {loading && search.length >= 3 && (
                    <div style={{ marginTop: "5px", fontSize: "12px" }}>
                      Loading...
                    </div>
                  )}
                </div>

                {/* Appointment ID */}
                {/* <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <FileText size={18} color="#6b7280" />
                    Appointment ID *
                  </label>
                  <input
                    type="text"
                    name="appointmentId"
                    value={formData.appointmentId}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                    placeholder="Enter appointment ID"
                  />
                </div> */}

                {/* Delivery Date */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Calendar size={18} color="#6b7280" />
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <DollarSign size={18} color="#6b7280" />
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Note */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <FileText size={18} color="#6b7280" />
                    Note *
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      resize: "vertical",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                    placeholder="Enter order notes or special instructions"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    <Upload size={18} color="#6b7280" />
                    Attachments
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      backgroundColor: "white",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  />
                  {files.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      {files.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "32px",
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    !loading &&
                    (e.currentTarget.style.backgroundColor = "#2563eb")
                  }
                  onMouseLeave={(e) =>
                    !loading &&
                    (e.currentTarget.style.backgroundColor = "#3b82f6")
                  }
                >
                  {loading ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
