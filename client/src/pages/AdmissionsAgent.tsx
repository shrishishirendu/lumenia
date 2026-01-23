import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Brain, 
  Settings, 
  RefreshCw, 
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Users,
  ThumbsUp,
  ThumbsDown,
  Info,
  Search,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

interface AdmissionsStats {
  totalAssessments: number;
  pendingReview: number;
  autoQualified: number;
  autoRejected: number;
  humanApproved: number;
  humanRejected: number;
  nurturing: number;
  todayAssessments: number;
  avgConfidence: number;
}

interface AdmissionsAssessment {
  id: number;
  leadId: number;
  qualificationScore: number;
  fitScore: number;
  expectationAlignment: "aligned" | "needs_discussion" | "misaligned";
  recommendedAction: "auto_enroll" | "human_review" | "nurture" | "reject";
  reasoning: string;
  aiConfidence: number;
  status: string;
  reviewerNotes: string | null;
  reviewedBy: string | null;
  assessedAt: string;
  reviewedAt: string | null;
}

interface AdmissionsSettings {
  id: number;
  autonomyLevel: number;
  autoQualifyThreshold: number;
  autoRejectThreshold: number;
  minYearLevel: number;
  maxYearLevel: number;
  acceptedSubjects: string;
  flagKeywords: string;
  isActive: boolean;
  updatedAt: string;
}

interface Lead {
  id: number;
  parentName: string | null;
  email: string;
  childYearLevel: number | null;
  subjectsInterested: string | null;
  status: string;
  message: string | null;
  leadScore: number | null;
  sourceType: string;
  createdAt: string;
}

async function fetchStats(): Promise<AdmissionsStats> {
  const res = await fetch("/api/admissions/stats", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function fetchQueue(): Promise<AdmissionsAssessment[]> {
  const res = await fetch("/api/admissions/queue", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch queue");
  return res.json();
}

async function fetchAllAssessments(): Promise<AdmissionsAssessment[]> {
  const res = await fetch("/api/admissions/assessments", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch assessments");
  return res.json();
}

async function fetchSettings(): Promise<AdmissionsSettings> {
  const res = await fetch("/api/admissions/settings", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function fetchLeads(): Promise<{ leads: Lead[] }> {
  const res = await fetch("/api/growth/leads?limit=50", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

const AGENT_VERSION = "v1.0";

function getConfidenceLevel(confidence: number): { label: string; color: string; bgColor: string } {
  if (confidence >= 80) return { label: "High", color: "text-emerald-700", bgColor: "bg-emerald-50" };
  if (confidence >= 60) return { label: "Medium", color: "text-amber-700", bgColor: "bg-amber-50" };
  return { label: "Low", color: "text-gray-600", bgColor: "bg-gray-100" };
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending_review: { bg: "bg-amber-50", text: "text-amber-700", label: "NEEDS REVIEW" },
    auto_qualified: { bg: "bg-emerald-50", text: "text-emerald-700", label: "APPROVED" },
    auto_rejected: { bg: "bg-gray-100", text: "text-gray-600", label: "NOT A FIT" },
    human_approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "APPROVED" },
    human_rejected: { bg: "bg-gray-100", text: "text-gray-600", label: "NOT A FIT" },
    nurturing: { bg: "bg-violet-50", text: "text-violet-700", label: "NEEDS INFO" }
  };
  const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status.toUpperCase() };
  return (
    <Badge className={`${config.bg} ${config.text} border-0 font-medium text-xs tracking-wide`}>
      {config.label}
    </Badge>
  );
}

function AlignmentIndicator({ alignment }: { alignment: string }) {
  const alignmentConfig: Record<string, { color: string; icon: any; label: string }> = {
    aligned: { color: "text-emerald-600", icon: CheckCircle, label: "Aligned" },
    needs_discussion: { color: "text-amber-600", icon: AlertTriangle, label: "Needs discussion" },
    misaligned: { color: "text-gray-500", icon: XCircle, label: "May not be a fit" }
  };
  const config = alignmentConfig[alignment] || { color: "text-gray-500", icon: AlertTriangle, label: alignment };
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1.5 text-sm ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}

function DecisionOutcomeCard({ assessment }: { assessment: AdmissionsAssessment }) {
  const confidenceLevel = getConfidenceLevel(assessment.aiConfidence);
  const actionLabels: Record<string, string> = {
    auto_enroll: "Recommend approval",
    human_review: "Recommend human review",
    nurture: "Recommend follow-up",
    reject: "May not be a good fit"
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-5 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={assessment.status} />
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${confidenceLevel.bgColor} ${confidenceLevel.color}`}>
            {confidenceLevel.label} Confidence
          </span>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI-assisted
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Qualification Score</p>
          <p className="text-2xl font-semibold">{assessment.qualificationScore}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Fit Score</p>
          <p className="text-2xl font-semibold">{assessment.fitScore}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Recommended Action</p>
          <p className="text-base font-medium text-gray-800">
            {actionLabels[assessment.recommendedAction] || assessment.recommendedAction}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="text-gray-400">Expectation alignment:</span>
        <AlignmentIndicator alignment={assessment.expectationAlignment} />
      </div>
    </div>
  );
}

function ReasoningCallout({ reasoning, assessedAt }: { reasoning: string; assessedAt: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button 
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 -ml-2"
            data-testid="toggle-reasoning"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Why did the agent recommend this?
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="border-l-4 border-primary/30 bg-primary/5 rounded-r-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary/70" />
              <span className="text-xs font-medium text-gray-600">Admissions Agent Assessment</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {reasoning || "Based on available information, this assessment was generated using qualification criteria matching."}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>Agent {AGENT_VERSION} (rules-based)</span>
              <span>{new Date(assessedAt).toLocaleString()}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p className="text-base font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

export default function AdmissionsAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAssessment, setSelectedAssessment] = useState<AdmissionsAssessment | null>(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admissions-stats"],
    queryFn: fetchStats,
    refetchInterval: 30000
  });

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ["admissions-queue"],
    queryFn: fetchQueue
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["admissions-assessments"],
    queryFn: fetchAllAssessments
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admissions-settings"],
    queryFn: fetchSettings
  });

  const { data: leadsData } = useQuery({
    queryKey: ["growth-leads"],
    queryFn: fetchLeads
  });

  const assessMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const res = await fetch(`/api/admissions/assess/${leadId}`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assess lead");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admissions-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admissions-assessments"] });
      toast({ title: "Assessment Complete", description: "Lead has been assessed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Assessment Failed", description: error.message, variant: "destructive" });
    }
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await fetch(`/api/admissions/decision/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reviewerNotes: notes })
      });
      if (!res.ok) throw new Error("Failed to record decision");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admissions-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admissions-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["growth-leads"] });
      setShowDecisionDialog(false);
      setSelectedAssessment(null);
      setReviewerNotes("");
      toast({ title: "Decision Recorded", description: "Lead status has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record decision", variant: "destructive" });
    }
  });

  const settingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<AdmissionsSettings>) => {
      const res = await fetch("/api/admissions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions-settings"] });
      toast({ title: "Settings Updated", description: "Changes have been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  });

  const unassessedLeads = leadsData?.leads.filter(lead => {
    const assessed = assessments?.some(a => a.leadId === lead.id);
    return !assessed && lead.status === "NEW";
  }) || [];

  const filteredQueue = queue?.filter(a => 
    searchQuery === "" || 
    a.leadId.toString().includes(searchQuery) ||
    a.reasoning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" data-testid="admissions-agent-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900" data-testid="text-page-title">
            Admissions Agent
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI-assisted lead qualification
            <span className="text-xs text-gray-400">({AGENT_VERSION})</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admissions-stats"] });
            queryClient.invalidateQueries({ queryKey: ["admissions-queue"] });
            queryClient.invalidateQueries({ queryKey: ["admissions-assessments"] });
          }}
          className="self-start sm:self-auto"
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="dashboard" className="text-sm" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="queue" className="text-sm" data-testid="tab-queue">Queue ({queue?.length || 0})</TabsTrigger>
          <TabsTrigger value="leads" className="text-sm" data-testid="tab-leads">Leads ({unassessedLeads.length})</TabsTrigger>
          <TabsTrigger value="settings" className="text-sm" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold" data-testid="stat-today-assessments">
                  {statsLoading ? "—" : stats?.todayAssessments || 0}
                </div>
                <p className="text-xs text-gray-400 mt-1">assessments</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-amber-600" data-testid="stat-pending-review">
                  {statsLoading ? "—" : stats?.pendingReview || 0}
                </div>
                <p className="text-xs text-gray-400 mt-1">need review</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-primary" data-testid="stat-avg-confidence">
                  {statsLoading ? "—" : `${stats?.avgConfidence || 0}%`}
                </div>
                <p className="text-xs text-gray-400 mt-1">average</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold" data-testid="stat-total-assessments">
                  {statsLoading ? "—" : stats?.totalAssessments || 0}
                </div>
                <p className="text-xs text-gray-400 mt-1">processed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gray-500" />
                  Assessment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Auto Approved
                  </span>
                  <span className="font-medium">{stats?.autoQualified || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-sm">
                    <ThumbsUp className="w-4 h-4 text-primary" />
                    Human Approved
                  </span>
                  <span className="font-medium">{stats?.humanApproved || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-violet-500" />
                    Nurturing
                  </span>
                  <span className="font-medium">{stats?.nurturing || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-gray-400" />
                    Not a Fit
                  </span>
                  <span className="font-medium">{(stats?.autoRejected || 0) + (stats?.humanRejected || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : assessments?.length === 0 ? (
                  <EmptyState 
                    icon={Clock} 
                    title="No activity yet" 
                    description="Assessments will appear here" 
                  />
                ) : (
                  <div className="space-y-2">
                    {assessments?.slice(0, 5).map((assessment, idx) => (
                      <div
                        key={assessment.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        <div>
                          <p className="text-sm font-medium">Lead #{assessment.leadId}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(assessment.assessedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={assessment.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4 mt-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    Pending Review Queue
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Leads assessed by AI that may require human discussion
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search queue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-sm"
                    data-testid="input-search-queue"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <p className="text-sm text-gray-400">Loading queue...</p>
              ) : filteredQueue?.length === 0 ? (
                <EmptyState 
                  icon={UserCheck} 
                  title="No leads pending review" 
                  description="New assessments requiring review will appear here" 
                />
              ) : (
                <div className="space-y-4">
                  {filteredQueue?.map((assessment, idx) => (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-xl p-4 hover:border-primary/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-medium">Lead #{assessment.leadId}</span>
                            <StatusBadge status={assessment.status} />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceLevel(assessment.aiConfidence).bgColor} ${getConfidenceLevel(assessment.aiConfidence).color}`}>
                              {getConfidenceLevel(assessment.aiConfidence).label} ({assessment.aiConfidence}%)
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span>Qualification: <strong>{assessment.qualificationScore}%</strong></span>
                            <span>Fit: <strong>{assessment.fitScore}%</strong></span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Expectations:</span>
                            <AlignmentIndicator alignment={assessment.expectationAlignment} />
                          </div>

                          <ReasoningCallout reasoning={assessment.reasoning} assessedAt={assessment.assessedAt} />
                        </div>
                        
                        <Button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setShowDecisionDialog(true);
                          }}
                          className="self-start"
                          data-testid={`button-review-${assessment.id}`}
                        >
                          Review
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4 mt-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Unassessed Leads
              </CardTitle>
              <CardDescription className="text-sm">
                New leads that haven't been assessed yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassessedLeads.length === 0 ? (
                <EmptyState 
                  icon={CheckCircle} 
                  title="All leads assessed" 
                  description="Create your first assessment when new leads arrive" 
                />
              ) : (
                <div className="space-y-3">
                  {unassessedLeads.map((lead, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-xl p-4 hover:border-primary/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-medium">{lead.parentName || "Unknown Parent"}</span>
                            <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{lead.email}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {lead.childYearLevel && <span>Year {lead.childYearLevel}</span>}
                            {lead.subjectsInterested && <span>{lead.subjectsInterested}</span>}
                            <span>Score: {lead.leadScore || 0}</span>
                          </div>
                          {lead.message && (
                            <p className="text-sm text-gray-500 italic max-w-xl">"{lead.message}"</p>
                          )}
                        </div>
                        <Button
                          onClick={() => assessMutation.mutate(lead.id)}
                          disabled={assessMutation.isPending}
                          className="self-start"
                          data-testid={`button-assess-${lead.id}`}
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          {assessMutation.isPending ? "Assessing..." : "Assess"}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                Admissions Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Configure AI autonomy and qualification criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {settingsLoading ? (
                <p className="text-sm text-gray-400">Loading settings...</p>
              ) : settings ? (
                <>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div>
                      <Label className="text-base font-medium">Agent Active</Label>
                      <p className="text-sm text-gray-500 mt-0.5">Enable or disable the Admissions Agent</p>
                    </div>
                    <Switch
                      checked={settings.isActive}
                      onCheckedChange={(checked) => settingsMutation.mutate({ isActive: checked })}
                      data-testid="switch-active"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Autonomy Level: {settings.autonomyLevel}</Label>
                      <p className="text-sm text-gray-500 mt-0.5 mb-4">
                        {settings.autonomyLevel === 1 && "Recommend only — human approves all decisions"}
                        {settings.autonomyLevel === 2 && "Auto-approve high confidence leads, flag others for review"}
                        {settings.autonomyLevel === 3 && "Full autonomy — auto-approve and auto-reject"}
                      </p>
                      <Slider
                        value={[settings.autonomyLevel]}
                        onValueChange={([value]) => settingsMutation.mutate({ autonomyLevel: value })}
                        min={1}
                        max={3}
                        step={1}
                        data-testid="slider-autonomy"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>Conservative</span>
                        <span>Balanced</span>
                        <span>Autonomous</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Auto-Approve Threshold: {settings.autoQualifyThreshold}%</Label>
                      <Slider
                        value={[settings.autoQualifyThreshold]}
                        onValueChange={([value]) => settingsMutation.mutate({ autoQualifyThreshold: value })}
                        min={50}
                        max={100}
                        step={5}
                        data-testid="slider-qualify-threshold"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Auto-Reject Threshold: {settings.autoRejectThreshold}%</Label>
                      <Slider
                        value={[settings.autoRejectThreshold]}
                        onValueChange={([value]) => settingsMutation.mutate({ autoRejectThreshold: value })}
                        min={0}
                        max={50}
                        step={5}
                        data-testid="slider-reject-threshold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Min Year Level</Label>
                      <Input
                        type="number"
                        value={settings.minYearLevel}
                        onChange={(e) => settingsMutation.mutate({ minYearLevel: parseInt(e.target.value) })}
                        min={1}
                        max={12}
                        data-testid="input-min-year"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Max Year Level</Label>
                      <Input
                        type="number"
                        value={settings.maxYearLevel}
                        onChange={(e) => settingsMutation.mutate({ maxYearLevel: parseInt(e.target.value) })}
                        min={1}
                        max={12}
                        data-testid="input-max-year"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Accepted Subjects</Label>
                    <Input
                      value={settings.acceptedSubjects}
                      onChange={(e) => settingsMutation.mutate({ acceptedSubjects: e.target.value })}
                      placeholder="Mathematics,English"
                      data-testid="input-subjects"
                    />
                    <p className="text-xs text-gray-400">Comma-separated list of subjects</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Flag Keywords</Label>
                    <Input
                      value={settings.flagKeywords}
                      onChange={(e) => settingsMutation.mutate({ flagKeywords: e.target.value })}
                      placeholder="urgent,immediate,quick fix"
                      data-testid="input-keywords"
                    />
                    <p className="text-xs text-gray-400">
                      Messages containing these keywords may indicate unrealistic expectations
                    </p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Review Assessment</DialogTitle>
            <DialogDescription className="text-sm">
              Based on available information, review the recommendation below
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="space-y-6 py-4">
              <DecisionOutcomeCard assessment={selectedAssessment} />

              <ReasoningCallout 
                reasoning={selectedAssessment.reasoning} 
                assessedAt={selectedAssessment.assessedAt} 
              />

              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-medium">Your Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  className="min-h-[80px]"
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDecisionDialog(false)}
              className="sm:mr-auto"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => decisionMutation.mutate({ 
                  id: selectedAssessment!.id, 
                  status: "nurturing", 
                  notes: reviewerNotes 
                })}
                disabled={decisionMutation.isPending}
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
                data-testid="button-nurture"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Info
              </Button>
              <Button
                variant="outline"
                onClick={() => decisionMutation.mutate({ 
                  id: selectedAssessment!.id, 
                  status: "human_rejected", 
                  notes: reviewerNotes 
                })}
                disabled={decisionMutation.isPending}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
                data-testid="button-reject"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Not a Fit
              </Button>
              <Button
                onClick={() => decisionMutation.mutate({ 
                  id: selectedAssessment!.id, 
                  status: "human_approved", 
                  notes: reviewerNotes 
                })}
                disabled={decisionMutation.isPending}
                data-testid="button-approve"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
