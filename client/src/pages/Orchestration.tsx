import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { 
  useLearningPlans,
  useSessionRules,
  useParentProposals,
  useWorkflowAlerts,
  useAgentStatuses,
  useAdminDecisions,
  generateAIPlan,
  generateParentNegotiationResponse,
  type LearningPlan,
  type AgentStatus
} from "@/lib/orchestration";
import { 
  Settings,
  Users,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  MessageSquare,
  BarChart3,
  Shield,
  Play,
  Pause,
  Hand,
  ChevronRight,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
  Activity,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Orchestration() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("plans");
  const { plans, addPlan, updatePlan, deletePlan } = useLearningPlans();
  const { rules, updateRules } = useSessionRules();
  const { proposals, addProposal, updateProposal } = useParentProposals();
  const { alerts, resolveAlert, escalateAlert } = useWorkflowAlerts();
  const { agents, updateAgentStatus, addAgentAction } = useAgentStatuses();
  const { decisions, addDecision, updateDecision } = useAdminDecisions();
  
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showAgentDetailDialog, setShowAgentDetailDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);
  const [showAIAssistDialog, setShowAIAssistDialog] = useState(false);
  
  const [globalSessionRules, setGlobalSessionRules] = useState({
    maxFocusSessionsPerWeek: 10,
    maxFlowMinutesPerDay: 120,
    cooldownMinutes: 15,
    breakReminderInterval: 25,
    burnoutProtectionEnabled: true
  });
  
  const [newPlan, setNewPlan] = useState<Partial<LearningPlan>>({
    studentName: "",
    studentId: "",
    subjects: ["Mathematics"],
    weeklyHours: 5,
    monthlyHours: 20,
    intensity: "moderate",
    allowedModalities: ["focus", "flow"]
  });

  const userRole = user?.role;
  const isAdmin = userRole === "owner" || userRole === "teacher";

  useEffect(() => {
    const globalRule = rules.find(r => r.studentId === "global");
    if (globalRule) {
      setGlobalSessionRules({
        maxFocusSessionsPerWeek: globalRule.maxFocusSessionsPerWeek,
        maxFlowMinutesPerDay: globalRule.maxFlowMinutesPerDay,
        cooldownMinutes: globalRule.cooldownMinutes,
        breakReminderInterval: globalRule.breakReminderInterval,
        burnoutProtectionEnabled: globalRule.burnoutProtectionEnabled
      });
    }
  }, [rules]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      setLocation("/");
    }
  }, [loading, user, isAdmin, setLocation]);

  const handleSaveSessionRules = () => {
    updateRules("global", globalSessionRules);
    toast({ title: "Rules Saved", description: "Session rules have been updated" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreatePlan = () => {
    if (!newPlan.studentName || !newPlan.studentId) {
      toast({ title: "Missing information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    addPlan(newPlan as Omit<LearningPlan, "id" | "createdAt" | "updatedAt">);
    toast({ title: "Plan Created", description: `Learning plan for ${newPlan.studentName} has been created` });
    setShowPlanDialog(false);
    setNewPlan({
      studentName: "",
      studentId: "",
      subjects: ["Mathematics"],
      weeklyHours: 5,
      monthlyHours: 20,
      intensity: "moderate",
      allowedModalities: ["focus", "flow"]
    });
  };

  const handleAIGeneratePlan = () => {
    const result = generateAIPlan(newPlan.studentName || "Student", 9);
    setNewPlan(prev => ({ ...prev, ...result.plan }));
    
    addDecision({
      type: "plan_generation",
      studentName: newPlan.studentName,
      decision: `Generated ${result.plan.intensity} intensity plan with ${result.plan.weeklyHours} hours/week`,
      reasoning: result.reasoning,
      confidence: result.confidence,
      requiresHumanReview: result.confidence < 0.85,
      status: "pending"
    });
    
    toast({
      title: "AI Plan Generated",
      description: `Confidence: ${Math.round(result.confidence * 100)}%`
    });
  };

  const handleAgentOverride = (agentId: string, action: "pause" | "resume" | "override") => {
    const newStatus = action === "pause" ? "paused" : action === "override" ? "human_override" : "active";
    updateAgentStatus(agentId, newStatus);
    
    addAgentAction(agentId, {
      action: `Human ${action}`,
      reasoning: `Admin manually ${action}d the agent`,
      outcome: `Status changed to ${newStatus}`
    });
    
    toast({
      title: "Agent Updated",
      description: `Agent status changed to ${newStatus}`
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.75) return "text-yellow-600";
    return "text-orange-600";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "high") return "destructive";
    if (severity === "medium") return "default";
    return "secondary";
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const pendingDecisions = decisions.filter(d => d.status === "pending");

  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="p-8 bg-muted/20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Learning Orchestration</h1>
              <p className="text-muted-foreground mt-1">Configure learning plans, monitor workflows, and manage AI agents</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAIAssistDialog(true)} className="gap-2" data-testid="button-ai-assist">
                <Brain className="w-4 h-4" /> AI Assistant
              </Button>
              <Button onClick={() => setShowPlanDialog(true)} className="gap-2" data-testid="button-new-plan">
                <Settings className="w-4 h-4" /> New Plan
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Active Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Open Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{unresolvedAlerts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.filter(a => a.status === "active").length}/{agents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingDecisions.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="plans" data-testid="tab-plans">Plans</TabsTrigger>
              <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
              <TabsTrigger value="parents" data-testid="tab-parents">Parents</TabsTrigger>
              <TabsTrigger value="monitor" data-testid="tab-monitor">Monitor</TabsTrigger>
              <TabsTrigger value="agents" data-testid="tab-agents">Agents</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Plan Manager</CardTitle>
                  <CardDescription>Configure subjects, hours, intensity, and allowed modalities per student</CardDescription>
                </CardHeader>
                <CardContent>
                  {plans.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No learning plans configured</p>
                      <Button variant="outline" className="mt-4" onClick={() => setShowPlanDialog(true)}>
                        Create First Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plans.map(plan => (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{plan.studentName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {plan.subjects.join(", ")} • {plan.weeklyHours}h/week • {plan.intensity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {plan.allowedModalities.map(m => (
                                <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>
                              ))}
                              <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                            <span>Monthly: {plan.monthlyHours}h</span>
                            <span>Updated: {new Date(plan.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Orchestrator</CardTitle>
                  <CardDescription>Configure session limits, cooldowns, and burnout protection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="font-medium">Global Session Rules</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Focus Sessions / Week</Label>
                          <Input 
                            type="number" 
                            value={globalSessionRules.maxFocusSessionsPerWeek}
                            onChange={(e) => setGlobalSessionRules(prev => ({ 
                              ...prev, 
                              maxFocusSessionsPerWeek: parseInt(e.target.value) || 0 
                            }))}
                            className="w-full" 
                            data-testid="input-max-focus" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Flow Minutes / Day</Label>
                          <Input 
                            type="number" 
                            value={globalSessionRules.maxFlowMinutesPerDay}
                            onChange={(e) => setGlobalSessionRules(prev => ({ 
                              ...prev, 
                              maxFlowMinutesPerDay: parseInt(e.target.value) || 0 
                            }))}
                            className="w-full" 
                            data-testid="input-max-flow" 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cooldown Between Sessions (min)</Label>
                          <Input 
                            type="number" 
                            value={globalSessionRules.cooldownMinutes}
                            onChange={(e) => setGlobalSessionRules(prev => ({ 
                              ...prev, 
                              cooldownMinutes: parseInt(e.target.value) || 0 
                            }))}
                            className="w-full" 
                            data-testid="input-cooldown" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Break Reminder Interval (min)</Label>
                          <Input 
                            type="number" 
                            value={globalSessionRules.breakReminderInterval}
                            onChange={(e) => setGlobalSessionRules(prev => ({ 
                              ...prev, 
                              breakReminderInterval: parseInt(e.target.value) || 0 
                            }))}
                            className="w-full" 
                            data-testid="input-break-reminder" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Burnout Protection</Label>
                          <p className="text-sm text-muted-foreground">Automatically suggest breaks when patterns indicate fatigue</p>
                        </div>
                        <Switch 
                          checked={globalSessionRules.burnoutProtectionEnabled}
                          onCheckedChange={(checked) => setGlobalSessionRules(prev => ({ 
                            ...prev, 
                            burnoutProtectionEnabled: checked 
                          }))}
                          data-testid="switch-burnout-protection" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={handleSaveSessionRules} data-testid="button-save-session-rules">
                    <CheckCircle className="w-4 h-4 mr-2" /> Save Session Rules
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parent Interaction Panel</CardTitle>
                  <CardDescription>AI-generated plan proposals with clear trade-off explanations</CardDescription>
                </CardHeader>
                <CardContent>
                  {proposals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No parent proposals yet</p>
                      <p className="text-sm mt-2">Proposals are generated when parents request plan changes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map(proposal => (
                        <div key={proposal.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{proposal.studentName}</h4>
                              <p className="text-sm text-muted-foreground">{proposal.parentEmail}</p>
                            </div>
                            <Badge variant={
                              proposal.status === "approved" ? "default" :
                              proposal.status === "rejected" ? "destructive" :
                              "secondary"
                            }>
                              {proposal.status}
                            </Badge>
                          </div>
                          
                          <div className="bg-muted/50 p-3 rounded-lg mb-3">
                            <p className="text-sm font-medium mb-2">AI Reasoning:</p>
                            <p className="text-sm text-muted-foreground">{proposal.aiReasoning}</p>
                          </div>
                          
                          {proposal.tradeOffs.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-2">Trade-offs to consider:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {proposal.tradeOffs.map((t, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ChevronRight className="w-3 h-3 mt-1 flex-shrink-0" />
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {proposal.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateProposal(proposal.id, { status: "approved" })}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateProposal(proposal.id, { status: "negotiating" })}>
                                <MessageSquare className="w-4 h-4 mr-1" /> Negotiate
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => updateProposal(proposal.id, { status: "rejected" })}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitor" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Monitor</CardTitle>
                  <CardDescription>Track stuck students, overuse patterns, and escalation flags</CardDescription>
                </CardHeader>
                <CardContent>
                  {unresolvedAlerts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>All clear - no active alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {unresolvedAlerts.map(alert => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${
                                alert.severity === "high" ? "text-red-500" :
                                alert.severity === "medium" ? "text-orange-500" :
                                "text-yellow-500"
                              }`} />
                              <span className="font-medium">{alert.studentName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(alert.severity) as any}>{alert.severity}</Badge>
                              <Badge variant="outline" className="capitalize">{alert.type.replace("_", " ")}</Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm mb-2">{alert.message}</p>
                          <p className="text-sm text-muted-foreground mb-3">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            Suggestion: {alert.suggestion}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => resolveAlert(alert.id)} data-testid={`button-resolve-${alert.id}`}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                            </Button>
                            {!alert.escalated && (
                              <Button size="sm" variant="outline" onClick={() => escalateAlert(alert.id)} data-testid={`button-escalate-${alert.id}`}>
                                <AlertTriangle className="w-4 h-4 mr-1" /> Escalate
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Autonomous Agents</CardTitle>
                  <CardDescription>Monitor and control AI agents with full transparency and human override</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.map(agent => (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{agent.name}</h4>
                              <Badge variant={
                                agent.status === "active" ? "default" :
                                agent.status === "paused" ? "secondary" :
                                "outline"
                              }>
                                {agent.status === "human_override" ? "Human Override" : agent.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{agent.mandate}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getConfidenceColor(agent.confidence)}`}>
                              {Math.round(agent.confidence * 100)}%
                            </div>
                            <p className="text-xs text-muted-foreground">confidence</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-muted-foreground">
                            <Activity className="w-3 h-3 inline mr-1" />
                            Last: {agent.lastAction}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {agent.actionsToday} actions today
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {agent.status === "active" ? (
                            <Button size="sm" variant="outline" onClick={() => handleAgentOverride(agent.id, "pause")} data-testid={`button-pause-${agent.id}`}>
                              <Pause className="w-4 h-4 mr-1" /> Pause
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleAgentOverride(agent.id, "resume")} data-testid={`button-resume-${agent.id}`}>
                              <Play className="w-4 h-4 mr-1" /> Resume
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleAgentOverride(agent.id, "override")} data-testid={`button-override-${agent.id}`}>
                            <Hand className="w-4 h-4 mr-1" /> Human Override
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => { setSelectedAgent(agent); setShowAgentDetailDialog(true); }}
                            data-testid={`button-view-${agent.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View Details
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {pendingDecisions.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="w-5 h-5" /> Pending AI Decisions
                </CardTitle>
                <CardDescription className="text-orange-700">
                  These decisions require your review before being applied
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingDecisions.map(decision => (
                    <div key={decision.id} className="p-3 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="mb-1">{decision.type.replace("_", " ")}</Badge>
                          {decision.studentName && <span className="text-sm ml-2">{decision.studentName}</span>}
                        </div>
                        <span className={`text-sm font-medium ${getConfidenceColor(decision.confidence)}`}>
                          {Math.round(decision.confidence * 100)}% confident
                        </span>
                      </div>
                      <p className="text-sm mb-2">{decision.decision}</p>
                      <p className="text-sm text-muted-foreground mb-3">{decision.reasoning}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateDecision(decision.id, { status: "approved" })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateDecision(decision.id, { status: "rejected" })}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Learning Plan</DialogTitle>
            <DialogDescription>
              Configure a personalized learning plan for a student
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input 
                  value={newPlan.studentName} 
                  onChange={(e) => setNewPlan({ ...newPlan, studentName: e.target.value })}
                  placeholder="e.g., Emma Wilson"
                  data-testid="input-plan-student-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input 
                  value={newPlan.studentId} 
                  onChange={(e) => setNewPlan({ ...newPlan, studentId: e.target.value })}
                  placeholder="e.g., S001"
                  data-testid="input-plan-student-id"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="flex gap-2">
                {["Mathematics", "English"].map(subject => (
                  <Button
                    key={subject}
                    type="button"
                    variant={newPlan.subjects?.includes(subject) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const subjects = newPlan.subjects || [];
                      setNewPlan({
                        ...newPlan,
                        subjects: subjects.includes(subject)
                          ? subjects.filter(s => s !== subject)
                          : [...subjects, subject]
                      });
                    }}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weekly Hours</Label>
                <Input 
                  type="number"
                  value={newPlan.weeklyHours} 
                  onChange={(e) => setNewPlan({ ...newPlan, weeklyHours: parseInt(e.target.value) || 0, monthlyHours: (parseInt(e.target.value) || 0) * 4 })}
                  data-testid="input-plan-weekly-hours"
                />
              </div>
              <div className="space-y-2">
                <Label>Intensity</Label>
                <Select 
                  value={newPlan.intensity} 
                  onValueChange={(v) => setNewPlan({ ...newPlan, intensity: v as any })}
                >
                  <SelectTrigger data-testid="select-plan-intensity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="intensive">Intensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Allowed Modalities</Label>
              <div className="flex gap-2">
                {(["focus", "flow", "human"] as const).map(modality => (
                  <Button
                    key={modality}
                    type="button"
                    variant={newPlan.allowedModalities?.includes(modality) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const modalities = newPlan.allowedModalities || [];
                      setNewPlan({
                        ...newPlan,
                        allowedModalities: modalities.includes(modality)
                          ? modalities.filter(m => m !== modality)
                          : [...modalities, modality]
                      });
                    }}
                  >
                    {modality.charAt(0).toUpperCase() + modality.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button variant="outline" className="w-full gap-2" onClick={handleAIGeneratePlan} data-testid="button-ai-generate-plan">
              <Sparkles className="w-4 h-4" /> Let AI Suggest Plan
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} data-testid="button-create-plan">Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAgentDetailDialog} onOpenChange={setShowAgentDetailDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAgent?.name}</DialogTitle>
            <DialogDescription>{selectedAgent?.mandate}</DialogDescription>
          </DialogHeader>
          
          {selectedAgent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <Badge variant={selectedAgent.status === "active" ? "default" : "secondary"}>
                    {selectedAgent.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Confidence</p>
                  <span className={`text-lg font-bold ${getConfidenceColor(selectedAgent.confidence)}`}>
                    {Math.round(selectedAgent.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Recent Actions</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedAgent.recentActions.map(action => (
                    <div key={action.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{action.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Reasoning:</strong> {action.reasoning}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Outcome:</strong> {action.outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAIAssistDialog} onOpenChange={setShowAIAssistDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" /> AI Admin Agent
            </DialogTitle>
            <DialogDescription>
              Your AI assistant for learning orchestration decisions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-3">I can help you with:</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generate learning plans based on constraints
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Draft parent communication and negotiations
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Adjust weekly goals automatically
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  Escalate decisions when confidence is low
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground">
              All my decisions are explainable and require your approval when confidence is below 85%.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIAssistDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
