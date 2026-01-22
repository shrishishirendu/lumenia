import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, GraduationCap, Clock, TrendingUp, Search, 
  MessageSquare, AlertTriangle, Activity, ArrowRight
} from "lucide-react";

const mockStats = {
  totalStudents: 142,
  activeStudents: 45,
  totalTutors: 8,
  activeSessions: 12,
  todaySignups: 3,
  weeklyGrowth: 8.5,
  avgSessionDuration: 32,
  parentMessages: 7,
};

const mockRecentStudents = [
  { id: "1", name: "Emma Wilson", grade: 10, lastActive: "2 min ago", status: "active" },
  { id: "2", name: "James Chen", grade: 11, lastActive: "15 min ago", status: "active" },
  { id: "3", name: "Sophie Brown", grade: 9, lastActive: "1 hour ago", status: "idle" },
  { id: "4", name: "Oliver Smith", grade: 12, lastActive: "Yesterday", status: "offline" },
];

const mockAlerts = [
  { id: "1", type: "warning", message: "3 students stuck on Linear Equations", time: "10 min ago" },
  { id: "2", type: "info", message: "Parent message pending review", time: "30 min ago" },
  { id: "3", type: "success", message: "Marketing campaign reached 500 views", time: "1 hour ago" },
];

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof mockRecentStudents>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = mockRecentStudents.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  return (
    <AdminLayout>
      <div className="p-8" data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">360° view of your tutoring platform</p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
              data-testid="student-search-input"
            />
          </div>
          <Button onClick={handleSearch} data-testid="search-btn">
            Search
          </Button>
        </div>

        {searchResults.length > 0 && (
          <Card className="mb-8" data-testid="search-results">
            <CardHeader>
              <CardTitle className="text-lg">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchResults.map(student => (
                  <Link key={student.id} href={`/admin/students/${student.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">Grade {student.grade}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card data-testid="stat-students">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold">{mockStats.totalStudents}</p>
                  <p className="text-xs text-green-600">+{mockStats.todaySignups} today</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-3xl font-bold">{mockStats.activeStudents}</p>
                  <p className="text-xs text-muted-foreground">{mockStats.activeSessions} sessions</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-tutors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tutors</p>
                  <p className="text-3xl font-bold">{mockStats.totalTutors}</p>
                  <p className="text-xs text-muted-foreground">{mockStats.avgSessionDuration}m avg session</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-growth">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Growth</p>
                  <p className="text-3xl font-bold">+{mockStats.weeklyGrowth}%</p>
                  <p className="text-xs text-muted-foreground">{mockStats.parentMessages} parent msgs</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card data-testid="recent-students-card">
            <CardHeader>
              <CardTitle className="text-lg">Recent Student Activity</CardTitle>
              <CardDescription>Students with recent learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentStudents.map(student => (
                  <Link key={student.id} href={`/admin/students/${student.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer" data-testid={`student-row-${student.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">Grade {student.grade}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={student.status === "active" ? "default" : student.status === "idle" ? "secondary" : "outline"}>
                          {student.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{student.lastActive}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/admin/students">
                <Button variant="outline" className="w-full mt-4" data-testid="view-all-students">
                  View All Students
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card data-testid="alerts-card">
            <CardHeader>
              <CardTitle className="text-lg">System Alerts</CardTitle>
              <CardDescription>Recent notifications requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50" data-testid={`alert-${alert.id}`}>
                    <div className={`mt-0.5 ${alert.type === "warning" ? "text-amber-500" : alert.type === "info" ? "text-blue-500" : "text-green-500"}`}>
                      {alert.type === "warning" ? <AlertTriangle className="h-5 w-5" /> : 
                       alert.type === "info" ? <MessageSquare className="h-5 w-5" /> : 
                       <Activity className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-8">
          <Link href="/admin/marketing">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-link-marketing">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-pink-600" />
                </div>
                <p className="font-medium">Marketing Agent</p>
                <p className="text-xs text-muted-foreground">AI-powered campaigns</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/ops">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-link-ops">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-6 w-6 text-cyan-600" />
                </div>
                <p className="font-medium">Operations Agent</p>
                <p className="text-xs text-muted-foreground">System monitoring</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orchestration">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-link-orchestration">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="font-medium">Orchestration</p>
                <p className="text-xs text-muted-foreground">Learning plans</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/growth">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-link-growth">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-medium">Growth Engine</p>
                <p className="text-xs text-muted-foreground">Analytics & insights</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
