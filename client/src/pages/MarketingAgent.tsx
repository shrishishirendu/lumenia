import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useMarketingAgent, AUTONOMY_LEVELS, type AutonomyLevel, type Campaign, type Lead, type MarketingStrategy } from "@/lib/marketingAgent";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Eye,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Mail,
  MessageSquare,
  Globe,
  Clock,
  ArrowRight,
  RefreshCw,
  Settings,
  FileText,
  BarChart3,
  Activity,
  Lock,
  Unlock,
  AlertCircle,
  ChevronRight,
  Megaphone,
  UserPlus,
  Phone,
  BookOpen,
  Sparkles,
  Loader2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IntentNarrativePanel } from "@/components/IntentNarrativePanel";
import { ProposalQueue } from "@/components/ProposalQueue";
import { MarketingAgentSettings } from "@/components/MarketingAgentSettings";
import { 
  type MarketingPolicy, 
  type MarketingProposal, 
  type IntentNarrative,
  marketingStorage,
  getMockSituationSnapshot
} from "@/lib/marketingAgentModels";
import { generateIntentNarrative } from "@/lib/intentNarrativeGenerator";

export default function MarketingAgent() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("proposals");
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showInstructionDialog, setShowInstructionDialog] = useState(false);
  const [confirmLevelChange, setConfirmLevelChange] = useState<AutonomyLevel | null>(null);
  
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [policy, setPolicy] = useState<MarketingPolicy | null>(null);
  const [proposals, setProposals] = useState<MarketingProposal[]>([]);
  const [intentNarrative, setIntentNarrative] = useState<IntentNarrative | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    objective: "acquisition" as "acquisition" | "nurture" | "re_engage" | "brand_trust",
    notes: "",
    timeWindow: "week" as "week" | "month"
  });
  
  const {
    state,
    autonomyLevels,
    changeAutonomyLevel,
    pauseAgent,
    resumeAgent,
    emergencyStop,
    lockAction,
    unlockAction,
    analyzeSituation,
    proposeStrategy,
    approveStrategy,
    createCampaign,
    approveCampaign,
    launchCampaign,
    pauseCampaign,
    addLead,
    markLeadNotified,
    updateLeadStatus,
    addHumanInstruction,
    updateBudget,
    simulateSpend,
    resetAgent
  } = useMarketingAgent();

  // Growth Engine integration - fetch leads from single source of truth
  interface GrowthEngineLead {
    id: number;
    parentName: string | null;
    email: string;
    phone: string | null;
    childYearLevel: number | null;
    status: string;
    sourceType: string;
    leadScore: number;
    message: string | null;
    createdAt: string;
  }

  const { data: growthEngineLeads, refetch: refetchGrowthLeads } = useQuery<{ leads: GrowthEngineLead[]; total: number }>({
    queryKey: ["/api/growth/leads"],
    queryFn: async () => {
      const res = await fetch("/api/growth/leads?limit=20");
      if (!res.ok) return { leads: [], total: 0 };
      return res.json();
    },
    refetchInterval: 30000
  });

  const [newStrategy, setNewStrategy] = useState({
    targetDescription: "",
    primaryAngle: "confidence",
    channels: ["meta_ads", "email"]
  });

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "meta_ads" as Campaign["channel"],
    headline: "",
    body: "",
    cta: "",
    dailyBudget: 50,
    totalBudget: 500
  });

  const [newInstruction, setNewInstruction] = useState({
    type: "strategy_change" as const,
    instruction: ""
  });

  useEffect(() => {
    setPolicy(marketingStorage.loadPolicy());
    setProposals(marketingStorage.loadProposals());
  }, []);

  const refreshIntentNarrative = useCallback(() => {
    const currentPolicy = policy || marketingStorage.loadPolicy();
    const strategyMemory = marketingStorage.loadStrategyMemory();
    const situationSnapshot = getMockSituationSnapshot();
    
    const narrative = generateIntentNarrative({
      policy: currentPolicy,
      strategyMemory,
      situationSnapshot
    });
    setIntentNarrative(narrative);
  }, [policy]);

  useEffect(() => {
    if (policy) {
      refreshIntentNarrative();
    }
  }, [policy, refreshIntentNarrative]);

  const handleGenerateProposal = async () => {
    const currentPolicy = policy || marketingStorage.loadPolicy();
    
    if (currentPolicy.aiControls.emergencyStopEnabled) {
      toast({ title: "Emergency Stop Active", description: "AI generation is disabled", variant: "destructive" });
      return;
    }

    const rateLimit = marketingStorage.checkRateLimit();
    if (!rateLimit.allowed) {
      toast({ 
        title: "Rate Limit Reached", 
        description: `Try again at ${rateLimit.resetAt.toLocaleTimeString()}`, 
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    try {
      const strategyMemory = marketingStorage.loadStrategyMemory();
      const situationSnapshot = getMockSituationSnapshot();
      const narrative = intentNarrative || generateIntentNarrative({
        policy: currentPolicy,
        strategyMemory,
        situationSnapshot
      });

      const response = await fetch("/api/marketing/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: generateForm.objective,
          notesFromHuman: generateForm.notes,
          timeWindow: generateForm.timeWindow,
          systemPrompt: currentPolicy.systemPrompt,
          policy: currentPolicy,
          strategyMemory,
          situationSnapshot,
          intentNarrative: narrative
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate proposal");
      }

      const data = await response.json();
      
      marketingStorage.incrementRateLimit();
      
      const newProposal = marketingStorage.createProposal({
        createdBy: "ai",
        status: "draft",
        intentNarrative: data.proposal.intentNarrative || narrative.headline,
        situationSnapshot,
        strategy: data.proposal.strategy,
        campaignDrafts: data.proposal.campaignDrafts?.map((d: any, i: number) => ({
          ...d,
          id: `draft_${Date.now()}_${i}`
        })) || [],
        budgetPlan: data.proposal.budgetPlan,
        risksAndSafeguards: data.proposal.risksAndSafeguards,
        decisionLogEntry: {
          ...data.proposal.decisionLogEntry,
          autonomyLevel: currentPolicy.autonomy.level
        },
        humanRequests: data.proposal.humanRequests || { approvalsNeeded: [], questions: [] }
      });

      setProposals(marketingStorage.loadProposals());
      setShowGenerateDialog(false);
      setGenerateForm({ objective: "acquisition", notes: "", timeWindow: "week" });
      
      toast({ 
        title: "Proposal Generated", 
        description: `Confidence: ${data.proposal.decisionLogEntry?.confidence || "N/A"}%` 
      });
    } catch (error: any) {
      console.error("Proposal generation error:", error);
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveProposal = (id: string) => {
    marketingStorage.approveProposal(id, user?.email || "admin");
    setProposals(marketingStorage.loadProposals());
    toast({ title: "Proposal Approved", description: "The proposal has been approved" });
  };

  const handleRejectProposal = (id: string, reason: string) => {
    marketingStorage.rejectProposal(id, user?.email || "admin", reason);
    setProposals(marketingStorage.loadProposals());
    toast({ title: "Proposal Rejected", description: "The proposal has been rejected" });
  };

  const handleArchiveProposal = (id: string) => {
    marketingStorage.archiveProposal(id);
    setProposals(marketingStorage.loadProposals());
    toast({ title: "Proposal Archived" });
  };

  const handleDuplicateProposal = (id: string) => {
    marketingStorage.duplicateProposal(id, user?.email || "admin");
    setProposals(marketingStorage.loadProposals());
    toast({ title: "Proposal Duplicated", description: "A copy has been created in drafts" });
  };

  const handlePolicyChange = (newPolicy: MarketingPolicy) => {
    setPolicy(newPolicy);
  };

  const userRole = user?.role;
  const isAdmin = userRole === "owner" || userRole === "teacher";

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

  const currentAutonomy = autonomyLevels[state.autonomyLevel];
  const newLeads = state.leads.filter(l => !l.humanNotified && l.status === "new");
  const budgetPercent = (state.budget.currentSpend / state.budget.monthlyBudget) * 100;

  const handleAnalyze = () => {
    analyzeSituation();
    toast({ title: "Analysis Complete", description: "Market situation has been analyzed" });
  };

  const handleCreateStrategy = () => {
    if (!newStrategy.targetDescription) {
      toast({ title: "Missing Information", description: "Please describe your target audience", variant: "destructive" });
      return;
    }
    proposeStrategy({
      targetDescription: newStrategy.targetDescription,
      primaryAngle: newStrategy.primaryAngle,
      channels: newStrategy.channels
    });
    setShowStrategyDialog(false);
    setNewStrategy({ targetDescription: "", primaryAngle: "confidence", channels: ["meta_ads", "email"] });
    toast({ title: "Strategy Proposed", description: "New marketing strategy has been created" });
  };

  const handleCreateCampaign = () => {
    if (!state.currentStrategy) {
      toast({ title: "No Strategy", description: "Please create a strategy first", variant: "destructive" });
      return;
    }
    if (!newCampaign.name || !newCampaign.headline) {
      toast({ title: "Missing Information", description: "Please fill in campaign details", variant: "destructive" });
      return;
    }
    createCampaign({
      strategyId: state.currentStrategy.id,
      ...newCampaign
    });
    setShowCampaignDialog(false);
    setNewCampaign({ name: "", channel: "meta_ads", headline: "", body: "", cta: "", dailyBudget: 50, totalBudget: 500 });
    toast({ title: "Campaign Created", description: "New campaign has been drafted" });
  };

  const handleAddInstruction = () => {
    if (!newInstruction.instruction) return;
    
    const acknowledgment = generateAcknowledgment(newInstruction.type, newInstruction.instruction);
    addHumanInstruction({
      type: newInstruction.type,
      instruction: newInstruction.instruction,
      agentAcknowledgment: acknowledgment.ack,
      behaviorChange: acknowledgment.change
    });
    setShowInstructionDialog(false);
    setNewInstruction({ type: "strategy_change", instruction: "" });
    toast({ title: "Instruction Received", description: "Agent has acknowledged your instruction" });
  };

  const generateAcknowledgment = (type: string, instruction: string) => {
    const responses: Record<string, { ack: string; change: string }> = {
      strategy_change: {
        ack: "I understand you want to change our marketing direction.",
        change: `I will adjust my strategy proposals to align with: "${instruction.substring(0, 100)}...". Future campaigns will reflect this new direction.`
      },
      constraint: {
        ack: "I acknowledge this new constraint on my actions.",
        change: `I will now operate within this constraint: "${instruction.substring(0, 100)}...". This will affect my budget allocation and channel selection.`
      },
      rejection: {
        ack: "I understand you've rejected my previous assumption or proposal.",
        change: `I will revise my approach and avoid: "${instruction.substring(0, 100)}...". My next proposals will take this feedback into account.`
      },
      idea: {
        ack: "Thank you for this new idea. I will incorporate it.",
        change: `I will explore: "${instruction.substring(0, 100)}..." and propose campaigns that leverage this insight.`
      },
      pause: {
        ack: "I am pausing my current thinking and actions.",
        change: "All active analysis and proposals are on hold until you resume."
      },
      reset: {
        ack: "I understand you want me to start fresh.",
        change: "I will clear my current context and begin analysis from scratch."
      }
    };
    return responses[type] || { ack: "Instruction received.", change: "Behavior updated accordingly." };
  };

  const handleLevelChange = (level: AutonomyLevel) => {
    setConfirmLevelChange(level);
  };

  const confirmAutonomyChange = () => {
    if (confirmLevelChange !== null) {
      changeAutonomyLevel(confirmLevelChange, user?.email || "Admin", "Manual level change");
      toast({ 
        title: "Autonomy Level Changed", 
        description: `Agent is now at Level ${confirmLevelChange}: ${AUTONOMY_LEVELS[confirmLevelChange].name}` 
      });
      setConfirmLevelChange(null);
    }
  };

  const simulateNewLead = () => {
    const names = ["Sarah Johnson", "Michael Chen", "Emma Wilson", "James Brown"];
    const sources = ["Google Ads", "Facebook", "Email Campaign", "Website"];
    addLead({
      source: sources[Math.floor(Math.random() * sources.length)],
      campaignId: state.campaigns[0]?.id,
      campaignName: state.campaigns[0]?.name || "Direct",
      contact: {
        name: names[Math.floor(Math.random() * names.length)],
        email: `parent${Date.now()}@example.com`,
        phone: "0412 345 678"
      },
      student: {
        name: "Alex",
        yearLevel: `Year ${Math.floor(Math.random() * 4) + 9}`,
        subjects: ["Mathematics"]
      },
      intent: ["high", "medium", "low"][Math.floor(Math.random() * 3)] as any,
      status: "new",
      suggestedAction: "Schedule discovery call within 24 hours",
      notes: ""
    });
    toast({ title: "New Lead!", description: "A new lead has been captured" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Marketing Agent Control</h1>
                <p className="text-sm text-muted-foreground">Autonomous marketing with human oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {newLeads.length > 0 && (
                <Badge variant="destructive" className="animate-pulse" data-testid="new-leads-badge">
                  {newLeads.length} New Lead{newLeads.length > 1 ? "s" : ""}
                </Badge>
              )}
              <Badge variant={state.isPaused ? "destructive" : "default"} data-testid="agent-status-badge">
                {state.isPaused ? "Paused" : "Active"}
              </Badge>
              <Badge variant="outline" data-testid="autonomy-level-badge">
                Level {state.autonomyLevel}: {currentAutonomy.name}
              </Badge>
              {state.isPaused ? (
                <Button size="sm" onClick={resumeAgent} data-testid="button-resume-agent">
                  <Play className="h-4 w-4 mr-1" /> Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={pauseAgent} data-testid="button-pause-agent">
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={emergencyStop} data-testid="button-emergency-stop">
                <AlertTriangle className="h-4 w-4 mr-1" /> Emergency Stop
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowSettingsDialog(true)} data-testid="button-settings">
                <Settings className="h-4 w-4 mr-1" /> Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <IntentNarrativePanel narrative={intentNarrative} />
          </div>
          <div className="ml-4 flex flex-col gap-2">
            <Button onClick={refreshIntentNarrative} variant="outline" size="sm" data-testid="button-analyze-intent">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh Analysis
            </Button>
            <Button onClick={() => setShowGenerateDialog(true)} disabled={policy?.aiControls.emergencyStopEnabled} data-testid="button-generate-proposal">
              <Sparkles className="h-4 w-4 mr-1" /> Generate Proposal
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full max-w-5xl">
            <TabsTrigger value="proposals" className="flex items-center gap-2" data-testid="tab-proposals">
              <Sparkles className="h-4 w-4" /> Proposals
              {proposals.filter(p => p.status === "draft" || p.status === "in_review").length > 0 && (
                <Badge className="ml-1">{proposals.filter(p => p.status === "draft" || p.status === "in_review").length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="autonomy" className="flex items-center gap-2" data-testid="tab-autonomy">
              <Shield className="h-4 w-4" /> Autonomy
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2" data-testid="tab-strategy">
              <Target className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2" data-testid="tab-campaigns">
              <Megaphone className="h-4 w-4" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2" data-testid="tab-budget">
              <DollarSign className="h-4 w-4" /> Budget
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2" data-testid="tab-leads">
              <UserPlus className="h-4 w-4" /> Leads
              {newLeads.length > 0 && <Badge variant="destructive" className="ml-1">{newLeads.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2" data-testid="tab-logs">
              <FileText className="h-4 w-4" /> Decision Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            <ProposalQueue
              proposals={proposals}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
              onArchive={handleArchiveProposal}
              onDuplicate={handleDuplicateProposal}
            />
          </TabsContent>

          <TabsContent value="autonomy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Autonomy Control Panel
                  </CardTitle>
                  <CardDescription>Set the agent's level of autonomous operation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {autonomyLevels.map((level) => (
                      <motion.div
                        key={level.level}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          state.autonomyLevel === level.level 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-muted-foreground/50"
                        }`}
                        onClick={() => handleLevelChange(level.level)}
                        whileHover={{ scale: 1.01 }}
                        data-testid={`autonomy-level-${level.level}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              state.autonomyLevel === level.level ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              {level.level}
                            </div>
                            <div>
                              <p className="font-medium">{level.name}</p>
                              <p className="text-sm text-muted-foreground">{level.description}</p>
                            </div>
                          </div>
                          {state.autonomyLevel === level.level && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Level Details</CardTitle>
                  <CardDescription>Level {state.autonomyLevel}: {currentAutonomy.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Agent Can Do
                    </h4>
                    <ul className="space-y-1">
                      {currentAutonomy.canDo.map((item, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Agent Cannot Do
                    </h4>
                    <ul className="space-y-1">
                      {currentAutonomy.cannotDo.map((item, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-red-400" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Human Actions Required
                    </h4>
                    <ul className="space-y-1">
                      {currentAutonomy.humanActions.map((item, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" /> Human Instructions
                </CardTitle>
                <CardDescription>Guide the agent's behavior with direct instructions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => setShowInstructionDialog(true)} data-testid="button-add-instruction">
                    <MessageSquare className="h-4 w-4 mr-2" /> Give Instruction
                  </Button>
                  <Button variant="outline" onClick={() => {
                    addHumanInstruction({
                      type: "pause",
                      instruction: "Pause all thinking",
                      agentAcknowledgment: "I am pausing my current thinking.",
                      behaviorChange: "All analysis on hold."
                    });
                    pauseAgent();
                  }} data-testid="button-pause-thinking">
                    <Pause className="h-4 w-4 mr-2" /> Pause Thinking
                  </Button>
                  <Button variant="outline" onClick={resetAgent} data-testid="button-reset-agent">
                    <RefreshCw className="h-4 w-4 mr-2" /> Reset Context
                  </Button>
                </div>
                <ScrollArea className="h-[200px]">
                  {state.humanInstructions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No instructions given yet</p>
                  ) : (
                    <div className="space-y-3">
                      {state.humanInstructions.map((instr) => (
                        <div key={instr.id} className="p-3 border rounded-lg" data-testid={`instruction-${instr.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{instr.type.replace("_", " ")}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(instr.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-2">"{instr.instruction}"</p>
                          <div className="bg-muted/50 p-2 rounded text-sm">
                            <p className="text-muted-foreground italic">Agent: {instr.agentAcknowledgment}</p>
                            <p className="mt-1">{instr.behaviorChange}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autonomy History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {state.autonomyHistory.slice().reverse().map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Level {h.level}</Badge>
                          <span>{AUTONOMY_LEVELS[h.level].name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{h.changedBy}</span>
                          <span>{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button onClick={handleAnalyze} data-testid="button-analyze-situation">
                <Brain className="h-4 w-4 mr-2" /> Analyze Market Situation
              </Button>
              <Button onClick={() => setShowStrategyDialog(true)} data-testid="button-create-strategy">
                <Target className="h-4 w-4 mr-2" /> Propose Strategy
              </Button>
            </div>

            {state.currentSituation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Market Situation Analysis
                  </CardTitle>
                  <CardDescription>
                    Last analyzed: {new Date(state.currentSituation.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Capacity Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Current Students</span>
                          <span className="font-medium">{state.currentSituation.capacityStatus.currentStudents}</span>
                        </div>
                        <Progress value={state.currentSituation.capacityStatus.utilizationPercent} />
                        <p className="text-xs text-muted-foreground">
                          {state.currentSituation.capacityStatus.utilizationPercent}% utilized
                          <Badge variant="outline" className="ml-2">{state.currentSituation.capacityStatus.trend}</Badge>
                        </p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Retention Health
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Retention Rate</span>
                          <span className="font-medium text-green-600">{state.currentSituation.retentionHealth.retentionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>At-Risk Students</span>
                          <span className="font-medium text-amber-600">{state.currentSituation.retentionHealth.atRiskStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Churned (last month)</span>
                          <span className="font-medium text-red-600">{state.currentSituation.retentionHealth.churnedLastMonth}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Tutor Availability
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Tutors</span>
                          <span className="font-medium">{state.currentSituation.tutorAvailability.totalTutors}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available Hours</span>
                          <span className="font-medium">{state.currentSituation.tutorAvailability.availableHours}h</span>
                        </div>
                        <Progress value={state.currentSituation.tutorAvailability.bookedPercent} />
                        <p className="text-xs text-muted-foreground">{state.currentSituation.tutorAvailability.bookedPercent}% booked</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Signals</h4>
                    <div className="space-y-2">
                      {state.currentSituation.signals.map((signal, i) => (
                        <Alert key={i} variant={signal.type === "critical" ? "destructive" : "default"}>
                          {signal.type === "positive" && <CheckCircle className="h-4 w-4" />}
                          {signal.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                          {signal.type === "critical" && <AlertCircle className="h-4 w-4" />}
                          <AlertDescription>{signal.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {state.currentStrategy && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" /> Current Strategy
                      </CardTitle>
                      <CardDescription>{state.currentStrategy.name}</CardDescription>
                    </div>
                    <Badge variant={
                      state.currentStrategy.status === "approved" ? "default" :
                      state.currentStrategy.status === "active" ? "default" :
                      state.currentStrategy.status === "draft" ? "secondary" : "outline"
                    }>
                      {state.currentStrategy.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Target Audience</h4>
                      <p className="text-sm text-muted-foreground mb-2">{state.currentStrategy.targetAudience.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {state.currentStrategy.targetAudience.yearLevels.map((y, i) => (
                          <Badge key={i} variant="outline">{y}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Message Angle</h4>
                      <p className="text-sm"><strong>Primary:</strong> {state.currentStrategy.messageAngle.primary}</p>
                      <p className="text-sm"><strong>Secondary:</strong> {state.currentStrategy.messageAngle.secondary}</p>
                      <Badge className="mt-2">{state.currentStrategy.messageAngle.tone}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Channels</h4>
                    <div className="space-y-2">
                      {state.currentStrategy.channels.map((ch, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span className="font-medium">{ch.name}</span>
                              <Badge variant={ch.priority === "high" ? "default" : "outline"}>{ch.priority}</Badge>
                            </div>
                            <span className="text-sm">{ch.budgetAllocation}% budget</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{ch.reasoning}</p>
                          <p className="text-sm text-amber-600 mt-1">Risk: {ch.risk}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <h4 className="font-medium mb-2 text-amber-800 dark:text-amber-200">Risk Assessment: {state.currentStrategy.riskAssessment.level}</h4>
                    <ul className="text-sm space-y-1">
                      {state.currentStrategy.riskAssessment.factors.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  {state.currentStrategy.status === "draft" || state.currentStrategy.status === "pending_approval" ? (
                    <>
                      <Button onClick={() => approveStrategy(state.currentStrategy!.id, user?.email || "Admin")} data-testid="button-approve-strategy">
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve Strategy
                      </Button>
                      <Button variant="outline" data-testid="button-edit-strategy">
                        Edit Strategy
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setShowStrategyDialog(true)}>
                      <Target className="h-4 w-4 mr-2" /> Create New Strategy
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Campaign Management</h2>
                <p className="text-sm text-muted-foreground">Review, approve, and monitor campaigns</p>
              </div>
              <Button 
                onClick={() => setShowCampaignDialog(true)} 
                disabled={!state.currentStrategy}
                data-testid="button-create-campaign"
              >
                <Megaphone className="h-4 w-4 mr-2" /> Create Campaign
              </Button>
            </div>

            {state.campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No campaigns yet. Create a strategy first, then add campaigns.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {state.campaigns.map((campaign) => (
                  <Card key={campaign.id} data-testid={`campaign-${campaign.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{campaign.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="outline">{campaign.channel}</Badge>
                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          campaign.status === "running" ? "default" :
                          campaign.status === "approved" ? "secondary" :
                          campaign.status === "paused" ? "destructive" : "outline"
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Content Preview</h4>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-semibold">{campaign.content.headline}</p>
                            <p className="text-sm text-muted-foreground mt-1">{campaign.content.body}</p>
                            <Button size="sm" className="mt-2">{campaign.content.cta}</Button>
                          </div>
                          <p className="text-xs text-muted-foreground italic">CTA reasoning: {campaign.content.ctaReasoning}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Budget & Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Daily Budget</span>
                              <span>${campaign.budget.daily}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Budget</span>
                              <span>${campaign.budget.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Spent</span>
                              <span>${campaign.budget.spent}</span>
                            </div>
                            <Progress value={(campaign.budget.spent / campaign.budget.total) * 100} className="mt-2" />
                          </div>
                          {campaign.status === "running" && (
                            <div className="grid grid-cols-3 gap-2 text-center mt-3">
                              <div className="p-2 bg-muted rounded">
                                <p className="text-lg font-bold">{campaign.metrics.impressions}</p>
                                <p className="text-xs text-muted-foreground">Impressions</p>
                              </div>
                              <div className="p-2 bg-muted rounded">
                                <p className="text-lg font-bold">{campaign.metrics.clicks}</p>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                              </div>
                              <div className="p-2 bg-muted rounded">
                                <p className="text-lg font-bold">{campaign.metrics.conversions}</p>
                                <p className="text-xs text-muted-foreground">Conversions</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm"><strong>Agent Notes:</strong> {campaign.agentNotes}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      {campaign.status === "draft" && (
                        <Button size="sm" onClick={() => approveCampaign(campaign.id)} data-testid={`button-approve-campaign-${campaign.id}`}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                      )}
                      {campaign.status === "approved" && (
                        <Button size="sm" onClick={() => launchCampaign(campaign.id)} data-testid={`button-launch-campaign-${campaign.id}`}>
                          <Play className="h-4 w-4 mr-2" /> Launch
                        </Button>
                      )}
                      {campaign.status === "running" && (
                        <Button size="sm" variant="destructive" onClick={() => pauseCampaign(campaign.id, "Human requested pause")} data-testid={`button-pause-campaign-${campaign.id}`}>
                          <Pause className="h-4 w-4 mr-2" /> Pause
                        </Button>
                      )}
                      <Button size="sm" variant="outline" data-testid={`button-edit-campaign-${campaign.id}`}>
                        Edit
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${state.budget.monthlyBudget}</p>
                  <div className="mt-4 space-y-2">
                    <Label>Adjust Monthly Budget</Label>
                    <Input 
                      type="number" 
                      value={state.budget.monthlyBudget}
                      onChange={(e) => updateBudget({ monthlyBudget: Number(e.target.value) })}
                      data-testid="input-monthly-budget"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Current Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${state.budget.currentSpend.toFixed(2)}</p>
                  <Progress value={budgetPercent} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">{budgetPercent.toFixed(0)}% of monthly budget</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${state.budget.dailyLimit}</p>
                  <div className="mt-4 space-y-2">
                    <Label>Adjust Daily Limit</Label>
                    <Input 
                      type="number" 
                      value={state.budget.dailyLimit}
                      onChange={(e) => updateBudget({ dailyLimit: Number(e.target.value) })}
                      data-testid="input-daily-limit"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Alert Threshold (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[state.budget.alertThreshold]}
                      onValueChange={([v]) => updateBudget({ alertThreshold: v })}
                      max={100}
                      step={5}
                      className="flex-1"
                      data-testid="slider-alert-threshold"
                    />
                    <span className="font-mono w-12">{state.budget.alertThreshold}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Alert when spend reaches this percentage of monthly budget</p>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => simulateSpend(50)} data-testid="button-simulate-spend">
                    <DollarSign className="h-4 w-4 mr-2" /> Simulate $50 Spend
                  </Button>
                </div>
              </CardContent>
            </Card>

            {state.budget.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Budget Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {state.budget.alerts.slice(-5).reverse().map((alert, i) => (
                      <Alert key={i} variant={alert.type === "limit_reached" ? "destructive" : "default"}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{alert.type.replace("_", " ").toUpperCase()}</AlertTitle>
                        <AlertDescription>
                          {alert.message}
                          <span className="text-xs block text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</span>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Lead Management</h2>
                <p className="text-sm text-muted-foreground">Growth Engine integration for real lead data</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetchGrowthLeads()} data-testid="button-refresh-leads">
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
                <Button onClick={() => setLocation("/admin/growth")} data-testid="button-open-growth-engine">
                  <ExternalLink className="h-4 w-4 mr-2" /> Full Growth Engine
                </Button>
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Growth Engine Leads</CardTitle>
                  </div>
                  <Badge variant="secondary">{growthEngineLeads?.total || 0} total</Badge>
                </div>
                <CardDescription>Real leads from your landing page and marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {(!growthEngineLeads?.leads || growthEngineLeads.leads.length === 0) ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No leads captured yet. Leads will appear when visitors submit your landing page form.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {growthEngineLeads.leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-background rounded-lg border" data-testid={`growth-lead-${lead.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                            {(lead.parentName || lead.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lead.parentName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">Year {lead.childYearLevel || "N/A"}</span>
                          <Badge variant={
                            lead.status === "NEW" ? "default" :
                            lead.status === "CONVERTED" ? "secondary" : "outline"
                          } className="text-xs">
                            {lead.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {growthEngineLeads.leads.length > 5 && (
                      <Button variant="ghost" className="w-full" onClick={() => setLocation("/admin/growth")}>
                        View all {growthEngineLeads.total} leads in Growth Engine
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Demo Leads (Simulated)</h3>
                <p className="text-sm text-muted-foreground">Test leads for agent demonstration</p>
              </div>
              <Button variant="outline" onClick={simulateNewLead} data-testid="button-simulate-lead">
                <UserPlus className="h-4 w-4 mr-2" /> Simulate New Lead
              </Button>
            </div>

            {newLeads.length > 0 && (
              <Alert className="border-primary">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>New Demo Leads</AlertTitle>
                <AlertDescription>
                  You have {newLeads.length} new simulated lead{newLeads.length > 1 ? "s" : ""} for testing
                </AlertDescription>
              </Alert>
            )}

            {state.leads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No leads captured yet. Leads will appear here as campaigns run.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {state.leads.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className={`${!lead.humanNotified && lead.status === "new" ? "border-primary border-2 animate-pulse" : ""}`}
                    data-testid={`lead-${lead.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{lead.contact.name}</CardTitle>
                            <CardDescription>
                              {lead.contact.email} {lead.contact.phone && `• ${lead.contact.phone}`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            lead.intent === "high" ? "default" :
                            lead.intent === "medium" ? "secondary" : "outline"
                          }>
                            {lead.intent} intent
                          </Badge>
                          <Badge variant={
                            lead.status === "new" ? "destructive" :
                            lead.status === "converted" ? "default" : "outline"
                          }>
                            {lead.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Student</p>
                          <p className="font-medium">{lead.student.name} ({lead.student.yearLevel})</p>
                          <p>{lead.student.subjects.join(", ")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Source</p>
                          <p className="font-medium">{lead.source}</p>
                          {lead.campaignName && <p className="text-xs">Campaign: {lead.campaignName}</p>}
                        </div>
                        <div>
                          <p className="text-muted-foreground">Suggested Action</p>
                          <p className="font-medium text-primary">{lead.suggestedAction}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      {lead.status === "new" && (
                        <>
                          <Button size="sm" onClick={() => {
                            markLeadNotified(lead.id);
                            updateLeadStatus(lead.id, "contacted");
                          }} data-testid={`button-contact-lead-${lead.id}`}>
                            <Phone className="h-4 w-4 mr-2" /> Mark Contacted
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markLeadNotified(lead.id)} data-testid={`button-dismiss-lead-${lead.id}`}>
                            Dismiss
                          </Button>
                        </>
                      )}
                      {lead.status === "contacted" && (
                        <>
                          <Button size="sm" onClick={() => updateLeadStatus(lead.id, "qualified")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Qualify
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateLeadStatus(lead.id, "lost")}>
                            <XCircle className="h-4 w-4 mr-2" /> Lost
                          </Button>
                        </>
                      )}
                      {lead.status === "qualified" && (
                        <Button size="sm" onClick={() => updateLeadStatus(lead.id, "converted")}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Convert
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(lead.timestamp).toLocaleString()}
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Decision Log
                </CardTitle>
                <CardDescription>Complete audit trail of all agent decisions with reasoning</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {state.decisionLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No decisions logged yet</p>
                  ) : (
                    <div className="space-y-4">
                      {state.decisionLogs.map((log) => (
                        <div key={log.id} className="p-4 border rounded-lg" data-testid={`log-${log.id}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{log.actionType}</Badge>
                              <Badge variant={log.autonomyLevel >= 2 ? "default" : "secondary"}>
                                Level {log.autonomyLevel}
                              </Badge>
                              <div className={`flex items-center gap-1 text-sm ${
                                log.confidenceScore >= 85 ? "text-green-600" :
                                log.confidenceScore >= 70 ? "text-amber-600" : "text-red-600"
                              }`}>
                                <Activity className="h-3 w-3" />
                                {log.confidenceScore}% confidence
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">What I did:</p>
                              <p className="text-sm">{log.action}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Why I did it:</p>
                              <p className="text-sm text-muted-foreground">{log.reasoning}</p>
                            </div>
                            {log.alternatives.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">What I considered but rejected:</p>
                                <ul className="text-sm text-muted-foreground">
                                  {log.alternatives.map((alt, i) => (
                                    <li key={i}>
                                      <span className="font-medium">{alt.option}:</span> {alt.whyRejected}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {log.requiresApproval && (
                              <div className="flex items-center gap-2 mt-2">
                                {log.approved ? (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Approved by {log.approvedBy}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <Clock className="h-3 w-3 mr-1" /> Pending Approval
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirmLevelChange !== null} onOpenChange={() => setConfirmLevelChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Autonomy Level Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the agent's autonomy to Level {confirmLevelChange}?
            </DialogDescription>
          </DialogHeader>
          {confirmLevelChange !== null && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{AUTONOMY_LEVELS[confirmLevelChange].name}</p>
                <p className="text-sm text-muted-foreground">{AUTONOMY_LEVELS[confirmLevelChange].description}</p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This change will be logged and take effect immediately.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLevelChange(null)}>Cancel</Button>
            <Button onClick={confirmAutonomyChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Propose Marketing Strategy</DialogTitle>
            <DialogDescription>Define your target audience and messaging approach</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Audience Description</Label>
              <Textarea
                placeholder="e.g., Parents of Year 10-12 students preparing for HSC exams..."
                value={newStrategy.targetDescription}
                onChange={(e) => setNewStrategy({ ...newStrategy, targetDescription: e.target.value })}
                data-testid="input-strategy-target"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Message Angle</Label>
              <Select
                value={newStrategy.primaryAngle}
                onValueChange={(v) => setNewStrategy({ ...newStrategy, primaryAngle: v })}
              >
                <SelectTrigger data-testid="select-strategy-angle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidence">Build Confidence</SelectItem>
                  <SelectItem value="clarity">Academic Clarity</SelectItem>
                  <SelectItem value="exam_prep">Exam Preparation</SelectItem>
                  <SelectItem value="stress_relief">Stress Relief</SelectItem>
                  <SelectItem value="achievement">Achievement Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2">
                {["meta_ads", "google_ads", "email", "organic_social", "youtube"].map((ch) => (
                  <Badge
                    key={ch}
                    variant={newStrategy.channels.includes(ch) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewStrategy({
                        ...newStrategy,
                        channels: newStrategy.channels.includes(ch)
                          ? newStrategy.channels.filter(c => c !== ch)
                          : [...newStrategy.channels, ch]
                      });
                    }}
                    data-testid={`channel-${ch}`}
                  >
                    {ch.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStrategyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateStrategy} data-testid="button-submit-strategy">Create Strategy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Design a new marketing campaign</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g., HSC Math Prep Campaign"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  data-testid="input-campaign-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select
                  value={newCampaign.channel}
                  onValueChange={(v: Campaign["channel"]) => setNewCampaign({ ...newCampaign, channel: v })}
                >
                  <SelectTrigger data-testid="select-campaign-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta_ads">Meta Ads</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="organic_social">Organic Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                placeholder="e.g., Struggling with HSC Math? We Can Help"
                value={newCampaign.headline}
                onChange={(e) => setNewCampaign({ ...newCampaign, headline: e.target.value })}
                data-testid="input-campaign-headline"
              />
            </div>
            <div className="space-y-2">
              <Label>Body Copy</Label>
              <Textarea
                placeholder="e.g., Our AI tutors provide personalized support..."
                value={newCampaign.body}
                onChange={(e) => setNewCampaign({ ...newCampaign, body: e.target.value })}
                data-testid="input-campaign-body"
              />
            </div>
            <div className="space-y-2">
              <Label>Call to Action</Label>
              <Input
                placeholder="e.g., Start Free Trial"
                value={newCampaign.cta}
                onChange={(e) => setNewCampaign({ ...newCampaign, cta: e.target.value })}
                data-testid="input-campaign-cta"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Budget ($)</Label>
                <Input
                  type="number"
                  value={newCampaign.dailyBudget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, dailyBudget: Number(e.target.value) })}
                  data-testid="input-campaign-daily-budget"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Budget ($)</Label>
                <Input
                  type="number"
                  value={newCampaign.totalBudget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, totalBudget: Number(e.target.value) })}
                  data-testid="input-campaign-total-budget"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCampaign} data-testid="button-submit-campaign">Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInstructionDialog} onOpenChange={setShowInstructionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Agent Instruction</DialogTitle>
            <DialogDescription>Guide the agent's behavior with a direct instruction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Instruction Type</Label>
              <Select
                value={newInstruction.type}
                onValueChange={(v: any) => setNewInstruction({ ...newInstruction, type: v })}
              >
                <SelectTrigger data-testid="select-instruction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategy_change">Change Strategy Direction</SelectItem>
                  <SelectItem value="constraint">Add Constraint</SelectItem>
                  <SelectItem value="rejection">Reject Assumption</SelectItem>
                  <SelectItem value="idea">Inject New Idea</SelectItem>
                  <SelectItem value="pause">Pause Thinking</SelectItem>
                  <SelectItem value="reset">Reset Context</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your Instruction</Label>
              <Textarea
                placeholder="Tell the agent what you want it to do differently..."
                value={newInstruction.instruction}
                onChange={(e) => setNewInstruction({ ...newInstruction, instruction: e.target.value })}
                data-testid="input-instruction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstructionDialog(false)}>Cancel</Button>
            <Button onClick={handleAddInstruction} data-testid="button-submit-instruction">Send Instruction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate AI Proposal
            </DialogTitle>
            <DialogDescription>
              The AI will create a marketing proposal based on current policy and situation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Objective</Label>
              <Select
                value={generateForm.objective}
                onValueChange={(v: any) => setGenerateForm({ ...generateForm, objective: v })}
              >
                <SelectTrigger data-testid="select-objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acquisition">Acquisition - Get new students</SelectItem>
                  <SelectItem value="nurture">Nurture - Engage trial users</SelectItem>
                  <SelectItem value="re_engage">Re-engage - Win back inactive users</SelectItem>
                  <SelectItem value="brand_trust">Brand Trust - Build awareness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select
                value={generateForm.timeWindow}
                onValueChange={(v: any) => setGenerateForm({ ...generateForm, timeWindow: v })}
              >
                <SelectTrigger data-testid="select-timewindow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes for AI (optional)</Label>
              <Textarea
                placeholder="Any specific guidance or context for the AI..."
                value={generateForm.notes}
                onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                data-testid="input-generate-notes"
              />
            </div>
            {policy?.aiControls.emergencyStopEnabled && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Emergency stop is active. AI generation is disabled.
                </AlertDescription>
              </Alert>
            )}
            <div className="text-sm text-muted-foreground">
              Rate limit: {marketingStorage.checkRateLimit().remaining} proposals remaining this hour
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleGenerateProposal} 
              disabled={isGenerating || policy?.aiControls.emergencyStopEnabled}
              data-testid="button-confirm-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" /> Generate Proposal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarketingAgentSettings
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        userId={user?.email || "admin"}
        onPolicyChange={handlePolicyChange}
      />
    </div>
  );
}
