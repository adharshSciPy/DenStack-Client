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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import { useParams } from "react-router-dom";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import clinicServiceBaseUrl from "../clinicServiceBaseUrl";

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  opNumber: string;
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

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Patient Search
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

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
  const [currentCursor, setCurrentCursor] = useState(null);
  const [pageCursors, setPageCursors] = useState([]); // store cursors for pages
  const [currentPageIndex, setCurrentPageIndex] = useState(-1);

  const { clinicId } = useParams();
  const today = new Date();

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
      });

      // Update showing range
      const start = newAppointments.length
        ? cursor
          ? currentPageIndex * limit + 1
          : 1
        : 0;
      const end = start + newAppointments.length - 1;
      setShowingRange(`${start}-${end} of ${data.totalAppointments || 0}`);

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
        { params: { id: patientSearchQuery } }
      );

      const patient = res.data.data;
      if (patient?._id) {
        setFoundPatient(patient);
        alert(`Patient found: ${patient.name}`);
      } else {
        alert("No patient found for this ID");
        setFoundPatient(null);
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      alert("Error fetching patient. Please try again.");
      setFoundPatient(null);
    } finally {
      setPatientSearchLoading(false);
    }
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
        userRole: "admin", // or receptionist if logged in as one
        userId: clinicId, // replace with actual logged-in user's ID
        name: newPatient.name,
        phone: newPatient.phone,
        email: newPatient.email,
        age: Number(newPatient.age),
        gender: newPatient.gender,
        medicalHistory,
      };

      const response = await axios.post(
        `http://localhost:8002/api/v1/patient-service/patient/register/${clinicId}`,
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

    fetchDepartments(); // ✅ call the async function
  }, [clinicId]); // ✅ re-run if clinicId changes

  // Step 2: Fetch Doctor Availability
  const handleDepartmentSelect = async (department: string) => {
    setSelectedDepartment(department);

    try {
      setAvailabilityLoading(true);

      const response = await axios.get(
        `http://localhost:8003/api/v1/clinic-service/department-based/availability`,
        {
          params: { clinicId, department },
        }
      );

      console.log("Doctor Availability Response:", response.data);

      const doctors = response.data?.doctors || [];

      if (doctors.length > 0) {
        setDoctorAvailability(
          doctors.map((doc: any) => ({
            doctorId: doc.doctorId,
            doctorName: doc.doctor?.name,
            email: doc.doctor?.email,
            phoneNumber: doc.doctor?.phoneNumber,
            specialization: response.data?.specialization || "",
            roleInClinic: doc.roleInClinic,
            status: doc.status,
            clinicEmail: doc.clinicLogin?.email,
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

  // Final Submit
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
        appointmentDate: appointmentDate,
        appointmentTime: selectedTime,
      };

      await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/book/${clinicId}`,
        payload
      );

      alert("Appointment booked successfully!");
      handleCloseModal();
      fetchAppointments();
    } catch (err) {
      console.error("Error booking appointment:", err);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
  };

  const canProceedToStep2 = foundPatient !== null;
  const canProceedToStep3 = canProceedToStep2 && selectedDepartment !== "";

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
        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-3xl font-bold text-red-600">
                  {fullStatus.cancelledAppointments}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Filters */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Enter Patient ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="w-[250px]"
        />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[200px]"
        />
        <Button
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90"
        >
          <Calendar className="w-4 h-4 mr-2" /> Search
        </Button>
        <Button onClick={handleClearFilters} variant="outline">
          Clear
        </Button>
      </div>

      {/* Appointments List */}
      <Card>
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
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {appointment.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-medium">
                          OP No:{" "}
                          <span className="font-bold">
                            {appointment.opNumber}
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

                  {appointment.status !== "cancelled" && (
                    <div className="flex items-start gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        Call
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
    </div>
  );
}
