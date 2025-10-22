import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import { useParams } from "react-router-dom";
import { Input } from "./ui/input";

const todayStats = {
  total: 24,
  completed: 18,
  pending: 4,
  cancelled: 2,
};

const upcomingAppointments = [
  {
    id: 1,
    time: "09:00 AM",
    patient: "John Smith",
    type: "Consultation",
    phone: "+1 (555) 123-4567",
    status: "confirmed",
  },
  {
    id: 2,
    time: "09:30 AM",
    patient: "Maria Garcia",
    type: "Follow-up",
    phone: "+1 (555) 234-5678",
    status: "pending",
  },
  {
    id: 3,
    time: "10:00 AM",
    patient: "Robert Johnson",
    type: "Surgery",
    phone: "+1 (555) 345-6789",
    status: "confirmed",
  },
  {
    id: 4,
    time: "10:30 AM",
    patient: "Emily Chen",
    type: "Consultation",
    phone: "+1 (555) 456-7890",
    status: "pending",
  },
];
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

  const { clinicId } = useParams();
  console.log("Clinic ID:", clinicId);
  const today = new Date();

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const todayFormatted = today.toLocaleDateString("en-US", options);

  //to fetch appointments from backend
  const fetchAppointments = async (query = "", date = "") => {
    try {
      const response = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/clinic-appointments/${clinicId}`,
       { params: { patientId: query || undefined, startDate: date || undefined } }
      );
      console.log("Appointments data:", response.data);
      setAppointments(response.data.data);
      const stats = response.data.stats;
      setFullStatus({
        totalAppointments: stats.totalAppointments,
        completedAppointments: stats.completedCount,
        pendingAppointments: stats.scheduledCount,
        cancelledAppointments: stats.cancelledCount,
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };
  useEffect(() => {
    fetchAppointments();
  }, []);
    const handleSearch = () => {
    fetchAppointments(searchQuery, selectedDate);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Today's Appointments</h2>
          <p className="text-muted-foreground">{todayFormatted}</p>
        </div>

        <Button className="bg-primary hover:bg-primary/90">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule New
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl text-primary">
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
                <p className="text-3xl text-green-600">
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
                <p className="text-3xl text-secondary">
                  {fullStatus.pendingAppointments}
                </p>
              </div>
              <Clock className="w-8 h-8 text-secondary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-3xl text-destructive">
                  {fullStatus.cancelledAppointments}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive/60" />
            </div>
          </CardContent>
        </Card>
      </div>
      
     <div className="flex gap-2">
    
          <Input
            placeholder="Enter Patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px]"
          />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
          />
           <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
            <Calendar className="w-4 h-4 mr-2" /> Search
          </Button>
          </div>

      {/* Upcoming Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            No Appointments found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className={`flex justify-between items-start p-4 rounded-lg transition-colors w-full ${
                appointment.status === "cancelled"
                  ? "bg-red-100 hover:bg-red-200"
                  : "bg-muted/30 hover:bg-[#D1FAE5]/50"
              }`}
            >
              {/* Left Section */}
              <div className="flex flex-col w-full">
                {/* Patient Name & Status */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{appointment.patientId?.name}</p>

                  {/* ✅ Always show status badge */}
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

                {/* OP No, Phone, Time, Date */}
                <div className="flex flex-wrap items-center justify-between mt-2 w-full">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-muted-foreground">
                      OP No: {appointment.opNumber}
                    </span>
                     <span className="text-sm font-bold text-muted-foreground">
                      Patient ID: {appointment.patientId.patientUniqueId}
                    </span>

                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {appointment.patientId?.phone}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-primary">
                      {appointment.appointmentTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.appointmentDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section - Buttons (hidden if cancelled) */}
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
        </CardContent>
      </Card>
    </div>
  );
}
