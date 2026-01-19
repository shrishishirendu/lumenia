import { Nav } from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, DollarSign, Activity, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { name: 'Mon', students: 400, revenue: 2400 },
  { name: 'Tue', students: 300, revenue: 1398 },
  { name: 'Wed', students: 200, revenue: 9800 },
  { name: 'Thu', students: 278, revenue: 3908 },
  { name: 'Fri', students: 189, revenue: 4800 },
  { name: 'Sat', students: 239, revenue: 3800 },
  { name: 'Sun', students: 349, revenue: 4300 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      
      <main className="flex-1 md:ml-20 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Architect Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your automated tutoring organization.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">Download Report</Button>
                    <Button>Manage Admissions</Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card border-none shadow-sm bg-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,284</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-green-600 flex items-center mr-1"><ArrowUpRight className="w-3 h-3" /> +12%</span>
                            from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-none shadow-sm bg-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$42,300</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-green-600 flex items-center mr-1"><ArrowUpRight className="w-3 h-3" /> +8%</span>
                            from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-none shadow-sm bg-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">342</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            Current live avatars
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-none shadow-sm bg-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">48m</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            +2m from average
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="col-span-2 glass-card border-none shadow-sm bg-white/80">
                    <CardHeader>
                        <CardTitle>Revenue & Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(220 80% 50%)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(220 80% 50%)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="hsl(220 80% 50%)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Activity / System Status */}
                <Card className="col-span-1 glass-card border-none shadow-sm bg-white/80">
                     <CardHeader>
                        <CardTitle>System Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Avatar Latency</span>
                                <span className="text-green-600 font-bold">12ms</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[15%] bg-green-500 rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Server Load</span>
                                <span className="text-yellow-600 font-bold">45%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[45%] bg-yellow-500 rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">WolframAlpha API</span>
                                <span className="text-green-600 font-bold">100% Up</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[100%] bg-green-500 rounded-full" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <h4 className="text-sm font-bold mb-3">Live Alerts</h4>
                            <div className="space-y-3">
                                <div className="flex gap-3 items-start p-3 bg-red-50 rounded-lg text-sm text-red-900">
                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                                    <p>Admissions spike detected in California region.</p>
                                </div>
                                <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                                    <p>Curriculum update v2.4 deployed successfully.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
