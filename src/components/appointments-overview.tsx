import { Calendar, Clock, User, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const todayStats = {
  total: 24,
  completed: 18,
  pending: 4,
  cancelled: 2
};

const upcomingAppointments = [
  {
    id: 1,
    time: "09:00 AM",
    patient: "John Smith",
    type: "Consultation",
    phone: "+1 (555) 123-4567",
    status: "confirmed"
  },
  {
    id: 2,
    time: "09:30 AM",
    patient: "Maria Garcia",
    type: "Follow-up",
    phone: "+1 (555) 234-5678",
    status: "pending"
  },
  {
    id: 3,
    time: "10:00 AM",
    patient: "Robert Johnson",
    type: "Surgery",
    phone: "+1 (555) 345-6789",
    status: "confirmed"
  },
  {
    id: 4,
    time: "10:30 AM",
    patient: "Emily Chen",
    type: "Consultation",
    phone: "+1 (555) 456-7890",
    status: "pending"
  }
];

export function AppointmentsOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Today's Appointments</h2>
          <p className="text-muted-foreground">Tuesday, September 16, 2025</p>
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
                <p className="text-3xl text-primary">{todayStats.total}</p>
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
                <p className="text-3xl text-green-600">{todayStats.completed}</p>
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
                <p className="text-3xl text-secondary">{todayStats.pending}</p>
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
                <p className="text-3xl text-destructive">{todayStats.cancelled}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Next Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-[#D1FAE5]/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-primary">{appointment.time}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{appointment.patient}</p>
                    <Badge 
                      variant={appointment.status === "confirmed" ? "default" : "secondary"}
                      className={appointment.status === "confirmed" ? "bg-primary" : "bg-secondary"}
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-muted-foreground">{appointment.type}</span>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{appointment.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Call
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}