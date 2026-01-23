import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, Users, UserPlus, Target, Eye, MoreVertical, Search,
  Mail, Phone, Calendar, Clock, ChevronRight, Plus, Filter, Download,
  Settings, Link2, RefreshCw, Activity, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, Pause, AlertCircle, MessageSquare, Edit3, BarChart3
} from "lucide-react";

type LeadStatus = "NEW" | "CONTACTED" | "ENGAGED" | "CONVERTED" | "DORMANT" | "LOST";

interface Lead {
  id: number;
  parentName: string | null;
  email: string;
  phone: string | null;
  childYearLevel: number | null;
  subjectsInterested: string | null;
  status: LeadStatus;
  sourceType: string;
  sourceName: string | null;
  leadScore: number;
  notes: string | null;
  message: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadEvent {
  id: number;
  leadId: number;
  timestamp: string;
  type: string;
  actor: string;
  actorUserId: string | null;
  metadata: string | null;
  description: string | null;
}

interface GrowthMetrics {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  newLeads7d: number;
  newLeads30d: number;
  conversionRate: number;
  acquisitionByChannel: Record<string, number>;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  NEW: { label: "New", color: "text-blue-600", bgColor: "bg-blue-100" },
  CONTACTED: { label: "Contacted", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  ENGAGED: { label: "Engaged", color: "text-purple-600", bgColor: "bg-purple-100" },
  CONVERTED: { label: "Converted", color: "text-green-600", bgColor: "bg-green-100" },
  DORMANT: { label: "Dormant", color: "text-gray-600", bgColor: "bg-gray-100" },
  LOST: { label: "Lost", color: "text-red-600", bgColor: "bg-red-100" }
};

const PIPELINE_STAGES: LeadStatus[] = ["NEW", "CONTACTED", "ENGAGED", "CONVERTED"];

export default function Growth() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<GrowthMetrics>({
    queryKey: ["/api/growth/metrics"],
    refetchInterval: 30000
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ leads: Lead[]; total: number }>({
    queryKey: ["/api/growth/leads", statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "100");
      const res = await fetch(`/api/growth/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    }
  });

  const { data: leadDetail } = useQuery<{ lead: Lead; events: LeadEvent[] }>({
    queryKey: ["/api/growth/leads", selectedLead?.id],
    enabled: !!selectedLead,
    queryFn: async () => {
      const res = await fetch(`/api/growth/leads/${selectedLead?.id}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Lead> }) => {
      const res = await fetch(`/api/growth/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/growth/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/growth/metrics"] });
      toast({ title: "Lead updated", description: "Changes saved successfully" });
    }
  });

  const addEventMutation = useMutation({
    mutationFn: async ({ leadId, type, description }: { leadId: number; type: string; description: string }) => {
      const res = await fetch(`/api/growth/leads/${leadId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description })
      });
      if (!res.ok) throw new Error("Failed to add event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/growth/leads", selectedLead?.id] });
      setNoteInput("");
      toast({ title: "Note added", description: "Activity recorded" });
    }
  });

  const leads = leadsData?.leads || [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleStatusChange = (lead: Lead, newStatus: LeadStatus) => {
    updateLeadMutation.mutate({ id: lead.id, updates: { status: newStatus } });
  };

  const handleAddNote = () => {
    if (!selectedLead || !noteInput.trim()) return;
    addEventMutation.mutate({
      leadId: selectedLead.id,
      type: "NOTE_ADDED",
      description: noteInput.trim()
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Growth Engine</h1>
            <p className="text-gray-600">Single source of truth for leads & attribution</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default"
              size="sm"
              onClick={() => setLocation("/admin/bi")}
              data-testid="btn-bi-dashboard"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              BI Dashboard (Preview)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/growth"] })}
              data-testid="btn-refresh-growth"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              <Users className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="pipeline" data-testid="tab-pipeline">
              <Target className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="sources" data-testid="tab-sources">
              <Link2 className="w-4 h-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab metrics={metrics} metricsLoading={metricsLoading} leads={leads} />
          </TabsContent>

          <TabsContent value="leads">
            <LeadRegistryTab
              leads={leads}
              leadsLoading={leadsLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              formatDate={formatDate}
              formatTime={formatTime}
              openLeadDetail={openLeadDetail}
              handleStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineTab
              leads={leads}
              formatTime={formatTime}
              openLeadDetail={openLeadDetail}
              handleStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="sources">
            <SourcesTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>

        <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedLead && (
              <LeadDetailPanel
                lead={selectedLead}
                events={leadDetail?.events || []}
                formatDate={formatDate}
                formatTime={formatTime}
                noteInput={noteInput}
                setNoteInput={setNoteInput}
                handleAddNote={handleAddNote}
                handleStatusChange={handleStatusChange}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function DashboardTab({ metrics, metricsLoading, leads }: {
  metrics?: GrowthMetrics;
  metricsLoading: boolean;
  leads: Lead[];
}) {
  if (metricsLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalLeads = metrics?.totalLeads || 0;
  const newLeads7d = metrics?.newLeads7d || 0;
  const conversionRate = metrics?.conversionRate || 0;
  const leadsByStatus = metrics?.leadsByStatus || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card data-testid="card-total-leads">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{totalLeads}</span>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-new-leads">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{newLeads7d}</span>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="w-5 h-5" />
                <UserPlus className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{conversionRate}%</span>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-leads">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {(leadsByStatus["NEW"] || 0) + (leadsByStatus["CONTACTED"] || 0) + (leadsByStatus["ENGAGED"] || 0)}
              </span>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funnel Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = leadsByStatus[status] || 0;
                const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={status} className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color} w-24`}>
                      {config.label}
                    </span>
                    <div className="flex-1 mx-3 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full ${config.bgColor}`}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acquisition Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics?.acquisitionByChannel || {}).map(([channel, count]) => (
                <div key={channel} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="capitalize">{channel.replace(/_/g, " ")}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(metrics?.acquisitionByChannel || {}).length === 0 && (
                <p className="text-gray-500 text-center py-4">No channel data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leads.slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {(lead.parentName || lead.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{lead.parentName || lead.email}</p>
                    <p className="text-sm text-gray-500">Year {lead.childYearLevel || "N/A"}</p>
                  </div>
                </div>
                <Badge className={`${STATUS_CONFIG[lead.status]?.bgColor} ${STATUS_CONFIG[lead.status]?.color}`}>
                  {STATUS_CONFIG[lead.status]?.label}
                </Badge>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-gray-500 text-center py-4">No leads yet. Start capturing leads from your landing page!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LeadRegistryTab({
  leads, leadsLoading, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  formatDate, formatTime, openLeadDetail, handleStatusChange
}: {
  leads: Lead[];
  leadsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  formatDate: (d: string | null) => string;
  formatTime: (d: string | null) => string;
  openLeadDetail: (lead: Lead) => void;
  handleStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Lead Registry</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-lead-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Lead</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Year</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Source</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Score</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr 
                      key={lead.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => openLeadDetail(lead)}
                      data-testid={`row-lead-${lead.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                            {(lead.parentName || lead.email)[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{lead.parentName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm">{lead.email}</span>
                          {lead.phone && <span className="text-xs text-gray-500">{lead.phone}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">{lead.childYearLevel || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">{lead.sourceType?.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={lead.status}
                          onValueChange={(v) => {
                            handleStatusChange(lead, v as LeadStatus);
                          }}
                        >
                          <SelectTrigger 
                            className={`w-28 h-7 text-xs ${STATUS_CONFIG[lead.status]?.bgColor} ${STATUS_CONFIG[lead.status]?.color} border-0`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${Math.min(lead.leadScore || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{lead.leadScore || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatTime(lead.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No leads found. Leads will appear here when visitors submit the landing page form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineTab({
  leads, formatTime, openLeadDetail, handleStatusChange
}: {
  leads: Lead[];
  formatTime: (d: string | null) => string;
  openLeadDetail: (lead: Lead) => void;
  handleStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("leadId", lead.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData("leadId"));
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== status) {
      handleStatusChange(lead, status);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline View</CardTitle>
          <CardDescription>Drag leads between stages to update their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {PIPELINE_STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage);
              const config = STATUS_CONFIG[stage];
              return (
                <div 
                  key={stage}
                  className="bg-gray-50 rounded-lg p-4 min-h-[400px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                  data-testid={`pipeline-stage-${stage.toLowerCase()}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {stageLeads.map(lead => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e as any, lead)}
                          className="bg-white rounded-lg p-3 shadow-sm border cursor-move hover:shadow-md transition-shadow"
                          onClick={() => openLeadDetail(lead)}
                          data-testid={`pipeline-card-${lead.id}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-xs">
                              {(lead.parentName || lead.email)[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{lead.parentName || lead.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Year {lead.childYearLevel || "N/A"}</span>
                            <span>{formatTime(lead.createdAt)}</span>
                          </div>
                          {lead.message && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2 bg-gray-50 rounded p-1.5">
                              "{lead.message}"
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {stageLeads.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-8">No leads in this stage</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SourcesTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaigns & Sources</CardTitle>
              <CardDescription>Track attribution and campaign performance</CardDescription>
            </div>
            <Button size="sm" data-testid="btn-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 text-center bg-gray-50">
            <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Campaign Tracking</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Create campaigns to track where your leads come from. Use UTM parameters in your marketing links for automatic attribution.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline">
                Learn About UTM Tracking
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Configuration</CardTitle>
          <CardDescription>Customize your lead pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([status, config], idx) => (
              <div key={status} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-6">{idx + 1}.</span>
                  <Badge className={`${config.bgColor} ${config.color}`}>{config.label}</Badge>
                </div>
                <span className="text-sm text-gray-500">{status}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Pipeline stages are currently fixed. Custom stages coming in a future update.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect external tools and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "HubSpot CRM", status: "not_configured", icon: "🔶" },
              { name: "Salesforce", status: "not_configured", icon: "☁️" },
              { name: "Meta Ads", status: "not_configured", icon: "📱" },
              { name: "Google Ads", status: "not_configured", icon: "🎯" },
            ].map(integration => (
              <div 
                key={integration.name}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{integration.status.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Configure
                </Button>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            CRM and advertising integrations coming soon. These will enable two-way sync of leads and campaign data.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Scoring</CardTitle>
          <CardDescription>Configure how leads are scored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span>Landing form submission</span>
              <Badge>+10 points</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Email verified</span>
              <Badge>+15 points</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Demo booked</span>
              <Badge>+30 points</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Trial started</span>
              <Badge>+50 points</Badge>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Lead scoring rules are currently fixed. Custom scoring rules coming in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LeadDetailPanel({
  lead, events, formatDate, formatTime, noteInput, setNoteInput, handleAddNote, handleStatusChange
}: {
  lead: Lead;
  events: LeadEvent[];
  formatDate: (d: string | null) => string;
  formatTime: (d: string | null) => string;
  noteInput: string;
  setNoteInput: (s: string) => void;
  handleAddNote: () => void;
  handleStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
            {(lead.parentName || lead.email)[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{lead.parentName || "Unknown"}</h3>
            <p className="text-sm text-gray-500 font-normal">{lead.email}</p>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 uppercase">Status</label>
            <Select
              value={lead.status}
              onValueChange={(v) => handleStatusChange(lead, v as LeadStatus)}
            >
              <SelectTrigger className={`${STATUS_CONFIG[lead.status]?.bgColor} ${STATUS_CONFIG[lead.status]?.color}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Year Level</label>
            <p className="font-medium">Year {lead.childYearLevel || "Not specified"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Phone</label>
            <p className="font-medium">{lead.phone || "Not provided"}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 uppercase">Source</label>
            <p className="font-medium capitalize">{lead.sourceType?.replace(/_/g, " ")}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Lead Score</label>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${Math.min(lead.leadScore || 0, 100)}%` }} />
              </div>
              <span className="font-medium">{lead.leadScore || 0}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Created</label>
            <p className="font-medium">{formatDate(lead.createdAt)}</p>
          </div>
        </div>
      </div>

      {lead.message && (
        <div>
          <label className="text-xs text-gray-500 uppercase">Original Message</label>
          <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{lead.message}</p>
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 uppercase mb-2 block">Add Note</label>
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note or log an activity..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="flex-1"
            rows={2}
            data-testid="input-lead-note"
          />
          <Button onClick={handleAddNote} disabled={!noteInput.trim()} data-testid="btn-add-note">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase mb-2 block">Activity Timeline</label>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {events.map(event => (
            <div key={event.id} className="flex gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div className="flex-1">
                <p className="text-gray-900">{event.description || event.type}</p>
                <p className="text-xs text-gray-500">
                  {formatTime(event.timestamp)} • {event.actor}
                </p>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No activity recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
