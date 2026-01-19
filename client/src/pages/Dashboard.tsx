import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, DollarSign, Activity, Clock, Bot, Zap, Globe, MessageSquare } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const data = [
  { name: 'Mon', students: 400, revenue: 2400 },
  { name: 'Tue', students: 300, revenue: 1398 },
  { name: 'Wed', students: 200, revenue: 9800 },
  { name: 'Thu', students: 278, revenue: 3908 },
  { name: 'Fri', students: 189, revenue: 4800 },
  { name: 'Sat', students: 239, revenue: 3800 },
  { name: 'Sun', students: 349, revenue: 4300 },
];

const AGENT_LOGS = {
  sales: [
    "Identified new lead: School District #402",
    "Sending outreach email template V2...",
    "Lead #402 responded: Interested in demo.",
    "Scheduling demo for Tuesday at 2pm.",
    "Following up with cold lead #105...",
    "Analyzing sentiment: Positive.",
  ],
  marketing: [
    "A/B Testing Ad Set C...",
    "Optimizing bid for keyword 'AI Tutor'...",
    "Generating social post for LinkedIn...",
    "Content published: 'The Future of Learning'.",
    "Analyzing click-through rate: 4.5%.",
    "Adjusting budget allocation +15%.",
  ],
  ops: [
    "Processing payment for Student #882...",
    "Conflict detected: Tutor slot 4pm.",
    "Auto-resolving: Moved to 4:15pm.",
    "Generating weekly progress reports...",
    "Report delivered to 1,284 parents.",
    "System health check: All green.",
  ]
};

function AgentTerminal({ name, type, logs, icon: Icon, color }: { name: string, type: string, logs: string[], icon: any, color: string }) {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setVisibleLogs(prev => [logs[index], ...prev].slice(0, 4));
      index = (index + 1) % logs.length;
    }, 2500 + Math.random() * 1000); // Randomize timing slightly
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="glass-card border-none shadow-sm bg-black/5 dark:bg-white/5 overflow-hidden flex flex-col h-full">
      <div className={`h-1 w-full ${color}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
            {name}
          </div>
          <span className="text-xs uppercase tracking-wider opacity-50">{type}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 font-mono text-xs space-y-3 p-4 pt-0 opacity-80">
        <AnimatePresence mode='popLayout'>
          {visibleLogs.map((log, i) => (
            <motion.div 
              key={`${log}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1 - (i * 0.2), x: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <span className="text-muted-foreground">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</span>
              <span>{log}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      
      <main className="flex-1 md:ml-20 p-8 bg-muted/20">
        <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
                      Mission Control 
                      <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full border border-green-500/20 font-sans tracking-wide">AUTONOMOUS MODE: ON</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Monitoring active agents and organizational health.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2"><Bot className="w-4 h-4" /> Agent Settings</Button>
                    <Button className="bg-foreground text-background hover:bg-foreground/90">Override System</Button>
                </div>
            </div>

            {/* Agent Command Center Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
              <AgentTerminal 
                name="OutreachBot-Alpha" 
                type="Sales Agent" 
                logs={AGENT_LOGS.sales} 
                icon={MessageSquare} 
                color="bg-blue-500" 
              />
              <AgentTerminal 
                name="ContentMind" 
                type="Marketing Agent" 
                logs={AGENT_LOGS.marketing} 
                icon={Zap} 
                color="bg-purple-500" 
              />
              <AgentTerminal 
                name="OpsManager" 
                type="Operations Agent" 
                logs={AGENT_LOGS.ops} 
                icon={Globe} 
                color="bg-emerald-500" 
              />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,284</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-green-600 flex items-center mr-1"><ArrowUpRight className="w-3 h-3" /> +12%</span>
                            via Auto-Admissions
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$42,300</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-green-600 flex items-center mr-1"><ArrowUpRight className="w-3 h-3" /> +8%</span>
                            automated collection
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">342</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            100% Avatar uptime
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Human Intervention</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0h 12m</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            Target: &lt; 1h / week
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="col-span-2 bg-white border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Autonomous Revenue Growth</CardTitle>
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
                <Card className="col-span-1 bg-white border-border/50 shadow-sm">
                     <CardHeader>
                        <CardTitle>Global Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Customer Sentiment</span>
                                <span className="text-green-600 font-bold">98.4%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[98%] bg-green-500 rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Ad Conversion Rate</span>
                                <span className="text-blue-600 font-bold">4.2%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[65%] bg-blue-500 rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Ops Efficiency</span>
                                <span className="text-green-600 font-bold">99.9%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-[100%] bg-emerald-500 rounded-full" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <h4 className="text-sm font-bold mb-3">Active Campaigns</h4>
                            <div className="space-y-3">
                                <div className="flex gap-3 items-center p-3 border border-border rounded-lg text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                    <p className="flex-1 font-medium">Q3 Student Intake</p>
                                    <span className="text-xs text-muted-foreground">Auto-Scaling</span>
                                </div>
                                <div className="flex gap-3 items-center p-3 border border-border rounded-lg text-sm">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                    <p className="flex-1 font-medium">Math Olympiad Promo</p>
                                    <span className="text-xs text-muted-foreground">Optimizing</span>
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
