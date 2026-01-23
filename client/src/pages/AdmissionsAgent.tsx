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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Brain, 
  Settings, 
  RefreshCw, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
  Target,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function AdmissionsAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAssessment, setSelectedAssessment] = useState<AdmissionsAssessment | null>(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
      toast({ title: "Lead Assessed", description: "AI assessment completed successfully" });
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
      toast({ title: "Decision Recorded", description: "Lead status updated successfully" });
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
      toast({ title: "Settings Updated", description: "Admissions settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending_review: { color: "bg-yellow-100 text-yellow-800", label: "Pending Review" },
      auto_qualified: { color: "bg-green-100 text-green-800", label: "Auto Qualified" },
      auto_rejected: { color: "bg-red-100 text-red-800", label: "Auto Rejected" },
      human_approved: { color: "bg-blue-100 text-blue-800", label: "Approved" },
      human_rejected: { color: "bg-gray-100 text-gray-800", label: "Rejected" },
      nurturing: { color: "bg-purple-100 text-purple-800", label: "Nurturing" }
    };
    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getAlignmentBadge = (alignment: string) => {
    const alignmentConfig: Record<string, { color: string; icon: any }> = {
      aligned: { color: "text-green-600", icon: CheckCircle },
      needs_discussion: { color: "text-yellow-600", icon: AlertTriangle },
      misaligned: { color: "text-red-600", icon: XCircle }
    };
    const config = alignmentConfig[alignment] || { color: "text-gray-600", icon: AlertTriangle };
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="w-4 h-4" />
        {alignment.replace("_", " ")}
      </span>
    );
  };

  const unassessedLeads = leadsData?.leads.filter(lead => {
    const assessed = assessments?.some(a => a.leadId === lead.id);
    return !assessed && lead.status === "NEW";
  }) || [];

  return (
    <div className="p-6 space-y-6" data-testid="admissions-agent-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">Admissions Agent</h1>
          <p className="text-gray-500">AI-powered lead qualification and assessment</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admissions-stats"] });
              queryClient.invalidateQueries({ queryKey: ["admissions-queue"] });
              queryClient.invalidateQueries({ queryKey: ["admissions-assessments"] });
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="queue" data-testid="tab-queue">Queue ({queue?.length || 0})</TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads">Leads ({unassessedLeads.length})</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Today's Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-today-assessments">
                  {statsLoading ? "..." : stats?.todayAssessments || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600" data-testid="stat-pending-review">
                  {statsLoading ? "..." : stats?.pendingReview || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Avg. AI Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600" data-testid="stat-avg-confidence">
                  {statsLoading ? "..." : `${stats?.avgConfidence || 0}%`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-total-assessments">
                  {statsLoading ? "..." : stats?.totalAssessments || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Assessment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Auto Qualified
                  </span>
                  <span className="font-semibold">{stats?.autoQualified || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-blue-600" />
                    Human Approved
                  </span>
                  <span className="font-semibold">{stats?.humanApproved || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Nurturing
                  </span>
                  <span className="font-semibold">{stats?.nurturing || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Rejected
                  </span>
                  <span className="font-semibold">{(stats?.autoRejected || 0) + (stats?.humanRejected || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : assessments?.length === 0 ? (
                  <p className="text-gray-500">No assessments yet</p>
                ) : (
                  <div className="space-y-3">
                    {assessments?.slice(0, 5).map(assessment => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Lead #{assessment.leadId}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(assessment.assessedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(assessment.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Pending Review Queue
              </CardTitle>
              <CardDescription>
                Leads assessed by AI that require human review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <p className="text-gray-500">Loading queue...</p>
              ) : queue?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leads pending review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue?.map(assessment => (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Lead #{assessment.leadId}</span>
                            {getStatusBadge(assessment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Qualification: {assessment.qualificationScore}%</span>
                            <span>Fit: {assessment.fitScore}%</span>
                            <span>Confidence: {assessment.aiConfidence}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Expectation:</span>
                            {getAlignmentBadge(assessment.expectationAlignment)}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{assessment.reasoning}</p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setShowDecisionDialog(true);
                          }}
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

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Unassessed Leads
              </CardTitle>
              <CardDescription>
                New leads that haven't been assessed by the AI yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassessedLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>All leads have been assessed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unassessedLeads.map(lead => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{lead.parentName || "Unknown Parent"}</span>
                            <Badge variant="outline">{lead.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{lead.email}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {lead.childYearLevel && <span>Year {lead.childYearLevel}</span>}
                            {lead.subjectsInterested && <span>{lead.subjectsInterested}</span>}
                            <span>Score: {lead.leadScore || 0}</span>
                          </div>
                          {lead.message && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{lead.message}"</p>
                          )}
                        </div>
                        <Button
                          onClick={() => assessMutation.mutate(lead.id)}
                          disabled={assessMutation.isPending}
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admissions Settings
              </CardTitle>
              <CardDescription>
                Configure AI autonomy and qualification criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsLoading ? (
                <p className="text-gray-500">Loading settings...</p>
              ) : settings ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Active</Label>
                        <p className="text-sm text-gray-500">Enable or disable the Admissions Agent</p>
                      </div>
                      <Switch
                        checked={settings.isActive}
                        onCheckedChange={(checked) => settingsMutation.mutate({ isActive: checked })}
                        data-testid="switch-active"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">Autonomy Level: {settings.autonomyLevel}</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        {settings.autonomyLevel === 1 && "Recommend only - human approves all decisions"}
                        {settings.autonomyLevel === 2 && "Auto-qualify high confidence leads, flag the rest"}
                        {settings.autonomyLevel === 3 && "Full autonomy - auto-qualify and auto-reject"}
                      </p>
                      <Slider
                        value={[settings.autonomyLevel]}
                        onValueChange={([value]) => settingsMutation.mutate({ autonomyLevel: value })}
                        min={1}
                        max={3}
                        step={1}
                        data-testid="slider-autonomy"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Conservative</span>
                        <span>Balanced</span>
                        <span>Autonomous</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Auto-Qualify Threshold: {settings.autoQualifyThreshold}%</Label>
                        <Slider
                          value={[settings.autoQualifyThreshold]}
                          onValueChange={([value]) => settingsMutation.mutate({ autoQualifyThreshold: value })}
                          min={50}
                          max={100}
                          step={5}
                          data-testid="slider-qualify-threshold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-Reject Threshold: {settings.autoRejectThreshold}%</Label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Year Level</Label>
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
                        <Label>Max Year Level</Label>
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

                    <div className="space-y-2">
                      <Label>Accepted Subjects (comma-separated)</Label>
                      <Input
                        value={settings.acceptedSubjects}
                        onChange={(e) => settingsMutation.mutate({ acceptedSubjects: e.target.value })}
                        placeholder="Mathematics,English"
                        data-testid="input-subjects"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Flag Keywords (comma-separated)</Label>
                      <Input
                        value={settings.flagKeywords}
                        onChange={(e) => settingsMutation.mutate({ flagKeywords: e.target.value })}
                        placeholder="urgent,immediate,quick fix"
                        data-testid="input-keywords"
                      />
                      <p className="text-xs text-gray-500">
                        Messages containing these keywords will be flagged as potentially unrealistic expectations
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Assessment</DialogTitle>
            <DialogDescription>
              Make a decision on this lead assessment
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Qualification</p>
                  <p className="text-2xl font-bold">{selectedAssessment.qualificationScore}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Fit Score</p>
                  <p className="text-2xl font-bold">{selectedAssessment.fitScore}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">AI Confidence</p>
                  <p className="text-2xl font-bold">{selectedAssessment.aiConfidence}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>AI Recommendation</Label>
                <Badge className="text-base px-3 py-1">
                  {selectedAssessment.recommendedAction.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Expectation Alignment</Label>
                {getAlignmentBadge(selectedAssessment.expectationAlignment)}
              </div>

              <div className="space-y-2">
                <Label>AI Reasoning</Label>
                <p className="p-3 bg-gray-50 rounded-lg text-sm">{selectedAssessment.reasoning}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Your Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDecisionDialog(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-purple-600 border-purple-300"
              onClick={() => decisionMutation.mutate({ 
                id: selectedAssessment!.id, 
                status: "nurturing", 
                notes: reviewerNotes 
              })}
              disabled={decisionMutation.isPending}
              data-testid="button-nurture"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Nurture
            </Button>
            <Button
              variant="destructive"
              onClick={() => decisionMutation.mutate({ 
                id: selectedAssessment!.id, 
                status: "human_rejected", 
                notes: reviewerNotes 
              })}
              disabled={decisionMutation.isPending}
              data-testid="button-reject"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Reject
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
