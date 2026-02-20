import { Calendar, DollarSign, Users, Package, Activity, TrendingUp, Clock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";
import baseUrl from "../../../baseUrl";
import { useParams } from "react-router-dom";

// Skeleton Loader Component
const StatCardSkeleton = () => (
  <Card className="bg-muted/60">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <Card className="bg-muted/60">
    <CardHeader>
      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-80 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <Activity className="w-8 h-8 text-gray-300 animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

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
  totalRevenue: number;
}

const weeklyData = [
  { day: "Mon", appointments: 18, revenue: 2400 },
  { day: "Tue", appointments: 24, revenue: 3200 },
  { day: "Wed", appointments: 19, revenue: 2800 },
  { day: "Thu", appointments: 22, revenue: 3100 },
  { day: "Fri", appointments: 26, revenue: 3600 },
  { day: "Sat", appointments: 15, revenue: 2200 },
  { day: "Sun", appointments: 8, revenue: 1100 }
];

export function OverviewDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clinicId } = useParams();

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${baseUrl}api/v1/auth/clinic/dashboard/${clinicId}`);
        setDashboardData(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [clinicId]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Key Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  // Show actual data when loaded
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back, {dashboardData?.clinic?.name || 'Clinic'}</h2>
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
                <p className="text-3xl text-primary font-bold">{dashboardData?.todaysAppointments?.length || 0}</p>
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
                <p className="text-3xl text-green-600 font-bold">₹{dashboardData?.totalRevenue?.toLocaleString() || 0}</p>
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
                <p className="text-3xl text-secondary font-bold">{dashboardData?.clinic?.totalStaffCount || 0}</p>
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
                <p className="text-3xl text-orange-600 font-bold">3</p>
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
                <p className="text-3xl text-primary font-bold">{dashboardData?.pendingLabOrdersCount || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
    </div>
  );
}