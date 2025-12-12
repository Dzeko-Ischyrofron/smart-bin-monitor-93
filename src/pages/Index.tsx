import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { BinStatusCard } from "@/components/dashboard/BinStatusCard";
import { FillLevelChart } from "@/components/dashboard/FillLevelChart";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { BatteryTrendsChart } from "@/components/dashboard/BatteryTrendsChart";
import { OdorAnalysisChart } from "@/components/dashboard/OdorAnalysisChart";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { LiveSensorPanel } from "@/components/dashboard/LiveSensorPanel";
import { CollectionSchedule } from "@/components/dashboard/CollectionSchedule";
import { FleetOverview } from "@/components/dashboard/FleetOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Wind, Battery, Wifi, DoorClosed, Activity, BarChart3, Settings, Calendar } from "lucide-react";

// Mock data - this would come from your ESP32 via API
const mockBin: {
  id: string;
  name: string;
  location: string;
  fillLevel: number;
  lidStatus: "open" | "closed";
  odorLevel: "normal" | "moderate" | "high";
  battery: number;
  isOnline: boolean;
  lastUpdate: string;
  handDetected: boolean;
  sprayActive: boolean;
} = {
  id: "BIN-001",
  name: "Smart Waste Bin",
  location: "Main Location",
  fillLevel: 68,
  lidStatus: "closed",
  odorLevel: "normal",
  battery: 74,
  isOnline: true,
  lastUpdate: "12:40 PM",
  handDetected: false,
  sprayActive: false,
};

const mockChartData = [
  { time: "00:00", fillLevel: 20 },
  { time: "04:00", fillLevel: 25 },
  { time: "08:00", fillLevel: 45 },
  { time: "12:00", fillLevel: 60 },
  { time: "16:00", fillLevel: 72 },
  { time: "20:00", fillLevel: 85 },
  { time: "Now", fillLevel: 75 },
];

const mockActivities = [
  { id: "1", type: "alert" as const, message: "Bin reached 90% capacity", time: "5 minutes ago" },
  { id: "2", type: "fill" as const, message: "Fill level increased to 75%", time: "10 minutes ago" },
  { id: "3", type: "collection" as const, message: "Bin was collected and emptied", time: "1 hour ago" },
  { id: "4", type: "alert" as const, message: "High odor level detected", time: "2 hours ago" },
];

// Battery trends data
const mockBatteryData = [
  { time: "Mon", battery: 100 },
  { time: "Tue", battery: 95 },
  { time: "Wed", battery: 88 },
  { time: "Thu", battery: 82 },
  { time: "Fri", battery: 78 },
  { time: "Sat", battery: 74 },
];

// Odor analysis data
const mockOdorData = [
  { hour: "6AM", level: 50, sprays: 0 },
  { hour: "9AM", level: 120, sprays: 1 },
  { hour: "12PM", level: 200, sprays: 2 },
  { hour: "3PM", level: 180, sprays: 2 },
  { hour: "6PM", level: 280, sprays: 3 },
  { hour: "9PM", level: 150, sprays: 1 },
];

// Alerts data
const mockAlerts = [
  { id: "a1", type: "critical" as const, category: "fill" as const, message: "Bin is 90% full - collection needed urgently", binId: "BIN-001", time: "5 min ago" },
  { id: "a2", type: "warning" as const, category: "battery" as const, message: "Battery at 25% - consider recharging soon", binId: "BIN-001", time: "15 min ago" },
  { id: "a3", type: "warning" as const, category: "odor" as const, message: "Moderate odor levels detected", binId: "BIN-001", time: "20 min ago" },
  { id: "a4", type: "info" as const, category: "lid" as const, message: "Lid opened for extended period", binId: "BIN-001", time: "1 hour ago" },
];

// Live sensor readings
const mockSensorReadings = [{
  binId: mockBin.id,
  binName: mockBin.name,
  ultrasonic: Math.round((100 - mockBin.fillLevel) * 0.5),
  fillPercent: mockBin.fillLevel,
  irSensor: mockBin.handDetected,
  mq135: mockBin.odorLevel === "high" ? 350 : mockBin.odorLevel === "moderate" ? 180 : 80,
  servoAngle: mockBin.lidStatus === "open" ? 90 : 0,
  battery: mockBin.battery,
  isOnline: mockBin.isOnline,
  signalStrength: mockBin.isOnline ? Math.floor(Math.random() * 30) + 70 : 0,
}];

// Collection schedule data
const mockSchedule = [
  { id: "s1", binId: "BIN-001", binName: "Smart Waste Bin", location: "Main Location", scheduledTime: "Today 2:00 PM", estimatedFill: 95, status: "pending" as const, priority: "high" as const },
  { id: "s2", binId: "BIN-001", binName: "Smart Waste Bin", location: "Main Location", scheduledTime: "Tomorrow 9:00 AM", estimatedFill: 75, status: "pending" as const, priority: "medium" as const },
  { id: "s3", binId: "BIN-001", binName: "Smart Waste Bin", location: "Main Location", scheduledTime: "Yesterday 3:00 PM", estimatedFill: 50, status: "completed" as const, priority: "low" as const },
];

// Fleet overview bin
const mockFleetBin = {
  id: mockBin.id,
  name: mockBin.name,
  location: mockBin.location,
  fillLevel: mockBin.fillLevel,
  battery: mockBin.battery,
  isOnline: mockBin.isOnline,
  status: (mockBin.fillLevel >= 80 ? "critical" : mockBin.fillLevel >= 60 ? "warning" : "normal") as "normal" | "warning" | "critical",
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Page Title */}
        <div className="animate-slide-up">
          <h2 className="text-2xl font-bold tracking-tight">Smart Waste Management Dashboard</h2>
          <p className="text-muted-foreground">Monitor and control your ESP32-powered smart bin in real-time</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Fill Level"
            value={mockBin.fillLevel}
            unit="%"
            icon={Trash2}
            trend={{ value: 5, isPositive: false }}
            status={mockBin.fillLevel >= 70 ? "warning" : "success"}
          />
          <StatCard
            title="Lid Status"
            value={mockBin.lidStatus === "open" ? "Open" : "Closed"}
            icon={DoorClosed}
            status={mockBin.lidStatus === "open" ? "warning" : "success"}
          />
          <StatCard
            title="Odor Level"
            value={mockBin.odorLevel === "high" ? "High" : mockBin.odorLevel === "moderate" ? "Moderate" : "Normal"}
            icon={Wind}
            status={mockBin.odorLevel !== "normal" ? "warning" : "success"}
          />
          <StatCard
            title="Battery"
            value={mockBin.battery}
            unit="%"
            icon={Battery}
            status={mockBin.battery < 30 ? "danger" : "success"}
          />
          <StatCard
            title="Connection"
            value={mockBin.isOnline ? "Online" : "Offline"}
            icon={Wifi}
            status={mockBin.isOnline ? "success" : "warning"}
          />
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2">
                <FillLevelChart data={mockChartData} title="Fill Level Trend (24h)" />
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-1">
                <RecentActivityCard activities={mockActivities} />
              </div>
            </div>

            {/* Alerts and Live Sensors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsPanel alerts={mockAlerts} />
              <LiveSensorPanel readings={mockSensorReadings} />
            </div>

            {/* Bin Status */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Bin Status</h3>
              <div className="max-w-md">
                <BinStatusCard {...mockBin} />
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BatteryTrendsChart data={mockBatteryData} />
              <OdorAnalysisChart data={mockOdorData} />
            </div>
            <FleetOverview bin={mockFleetBin} />
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ControlPanel bins={[{ id: mockBin.id, name: mockBin.name }]} />
              <LiveSensorPanel readings={mockSensorReadings} />
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CollectionSchedule schedule={mockSchedule} />
              <FleetOverview bin={mockFleetBin} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;