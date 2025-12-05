import { Calendar, DollarSign, Users, Package, Activity, TrendingUp, Clock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";
import baseUrl from "../baseUrl";
import { useParams } from "react-router-dom";

const quickStats = {
  todayAppointments: 24,
  monthlyRevenue: 67000,
  activeStaff: 12,
  lowStockItems: 3, 
  pendingLabOrders: 7
};

const weeklyData = [
  { day: "Mon", appointments: 18, revenue: 2400 },
  { day: "Tue", appointments: 24, revenue: 3200 },
  { day: "Wed", appointments: 19, revenue: 2800 },
  { day: "Thu", appointments: 22, revenue: 3100 },
  { day: "Fri", appointments: 26, revenue: 3600 },
  { day: "Sat", appointments: 15, revenue: 2200 },
  { day: "Sun", appointments: 8, revenue: 1100 }
];

const recentActivities = [
  {
    id: 1,
    type: "appointment",
    message: "New appointment scheduled with John Smith",
    time: "2 minutes ago",
    icon: Calendar,
    color: "text-primary"
  },
  {
    id: 2,
    type: "payment",
    message: "Payment received - $450 from Maria Garcia",
    time: "15 minutes ago",
    icon: DollarSign,
    color: "text-green-600"
  },
  {
    id: 3,
    type: "inventory",
    message: "Low stock alert: Surgical Gloves",
    time: "1 hour ago",
    icon: Package,
    color: "text-orange-600"
  },
  {
    id: 4,
    type: "staff",
    message: "Dr. Wilson checked in for morning shift",
    time: "2 hours ago",
    icon: Users,
    color: "text-secondary"
  }
];


interface StaffCategory {
  accountants: any[];
  nurses: any[];
  pharmacists: any[];
  receptionists: any[];
  technicians: any[];
}

interface Subscription {
  package: string;
  type: string;
  price: number;
  startDate: string;
  endDate: string;
  status?: string;
}

interface Clinic {
  id: string;
  name: string;
  staffs: StaffCategory;
  totalStaffCount: number;
}

interface DashboardData {
  success: boolean;
  clinic: Clinic;
  subscription: Subscription;
  activeDoctors: any[];
  patients: any[];
  todaysAppointments: any[];
  pendingLabOrdersCount: number;
}

export function OverviewDashboard() {

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);


  const { clinicId } = useParams();
  useEffect(() => {
    const getData = async () => {
      try {
        const res= await axios.get(`${baseUrl}api/v1/auth/clinic/dashboard/${clinicId}`);
        setDashboardData(res.data);
      } catch (error) {
        console.log(error);
        
      }
    }
    getData();
  }, [clinicId]);
  console.log(dashboardData);
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Welcome back,{dashboardData?.clinic.name}</h2>
          <p className="text-muted-foreground">Here's what's happening at your clinic today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="hover:shadow-md transition-shadow bg-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                <p className="text-3xl text-primary">{dashboardData?.todaysAppointments.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+8 from yesterday</span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl text-green-600">${quickStats.monthlyRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+12% this month</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-3xl text-secondary">{dashboardData?.clinic.totalStaffCount}</p>
                <p className="text-xs text-muted-foreground mt-1">On duty today</p>
              </div>
              <Users className="w-8 h-8 text-secondary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-3xl text-orange-600">{quickStats.lowStockItems}</p>
                <p className="text-xs text-orange-600 mt-1">Need attention</p>
              </div>
              <Package className="w-8 h-8 text-orange-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Lab Orders</p>
                <p className="text-3xl text-primary">{dashboardData?.pendingLabOrdersCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </div>
              <Activity className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Appointments Chart */}
        <Card className="bg-muted/60">
          <CardHeader>
            <CardTitle>Weekly Appointment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#1E4D2B" 
                    strokeWidth={3}
                    dot={{ fill: "#1E4D2B", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Revenue Chart */}
        <Card className="bg-muted/60">
          <CardHeader>
            <CardTitle>Weekly Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3FA796" 
                    fill="#3FA796" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-muted/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Icon className={`w-5 h-5 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Status */}
        <Card className="bg-muted/60">
          <CardHeader>
            <CardTitle>Clinic Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Capacity</span>
                <span className="text-sm text-muted-foreground">24/30 appointments</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Staff Utilization</span>
                <span className="text-sm text-muted-foreground">12/15 staff</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Equipment Availability</span>
                <span className="text-sm text-muted-foreground">18/20 operational</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Staff Schedule
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Order Supplies
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Lab Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}