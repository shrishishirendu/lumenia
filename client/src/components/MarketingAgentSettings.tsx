import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Save,
  RotateCcw,
  History,
  AlertTriangle,
  Shield,
  DollarSign,
  MessageSquare,
  Target,
  Brain,
  Zap
} from "lucide-react";
import {
  type MarketingPolicy,
  type MarketingStrategyMemory,
  type PolicyVersion,
  marketingStorage,
  getDefaultPolicy,
  getDefaultStrategyMemory,
  DEFAULT_SYSTEM_PROMPT
} from "@/lib/marketingAgentModels";

interface MarketingAgentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPolicyChange?: (policy: MarketingPolicy) => void;
}

export function MarketingAgentSettings({ isOpen, onClose, userId, onPolicyChange }: MarketingAgentSettingsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("prompt");
  const [policy, setPolicy] = useState<MarketingPolicy>(getDefaultPolicy());
  const [strategyMemory, setStrategyMemory] = useState<MarketingStrategyMemory>(getDefaultStrategyMemory());
  const [policyHistory, setPolicyHistory] = useState<PolicyVersion[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPolicy(marketingStorage.loadPolicy());
      setStrategyMemory(marketingStorage.loadStrategyMemory());
      setPolicyHistory(marketingStorage.loadPolicyHistory());
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const savedPolicy = marketingStorage.savePolicy(policy, userId);
    marketingStorage.saveStrategyMemory(strategyMemory);
    setPolicyHistory(marketingStorage.loadPolicyHistory());
    setHasChanges(false);
    onPolicyChange?.(savedPolicy);
    toast({ title: "Settings Saved", description: `Policy version ${savedPolicy.version} saved successfully` });
  };

  const handleResetToDefault = () => {
    const defaultPolicy = getDefaultPolicy();
    const defaultMemory = getDefaultStrategyMemory();
    setPolicy(defaultPolicy);
    setStrategyMemory(defaultMemory);
    setHasChanges(true);
    toast({ title: "Reset to Defaults", description: "Settings reset. Click Save to apply." });
  };

  const handleRestoreVersion = (version: number) => {
    const restored = marketingStorage.restorePolicy(version);
    if (restored) {
      setPolicy(restored);
      setShowHistoryDialog(false);
      setHasChanges(false);
      onPolicyChange?.(restored);
      toast({ title: "Version Restored", description: `Restored to version ${version}` });
    }
  };

  const updatePolicy = (updates: Partial<MarketingPolicy>) => {
    setPolicy(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateBrandVoice = (updates: Partial<MarketingPolicy["brandVoice"]>) => {
    setPolicy(prev => ({ ...prev, brandVoice: { ...prev.brandVoice, ...updates } }));
    setHasChanges(true);
  };

  const updateAutonomy = (updates: Partial<MarketingPolicy["autonomy"]>) => {
    setPolicy(prev => ({ ...prev, autonomy: { ...prev.autonomy, ...updates } }));
    setHasChanges(true);
  };

  const updateBudget = (updates: Partial<MarketingPolicy["budget"]>) => {
    setPolicy(prev => ({ ...prev, budget: { ...prev.budget, ...updates } }));
    setHasChanges(true);
  };

  const updateCapacity = (updates: Partial<MarketingPolicy["capacityGuardrails"]>) => {
    setPolicy(prev => ({ ...prev, capacityGuardrails: { ...prev.capacityGuardrails, ...updates } }));
    setHasChanges(true);
  };

  const updateOutcome = (updates: Partial<MarketingPolicy["outcomeGuardrails"]>) => {
    setPolicy(prev => ({ ...prev, outcomeGuardrails: { ...prev.outcomeGuardrails, ...updates } }));
    setHasChanges(true);
  };

  const updateAiControls = (updates: Partial<MarketingPolicy["aiControls"]>) => {
    setPolicy(prev => ({ ...prev, aiControls: { ...prev.aiControls, ...updates } }));
    setHasChanges(true);
  };

  const toggleChannel = (channel: keyof MarketingPolicy["channels"]) => {
    setPolicy(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: { ...prev.channels[channel], enabled: !prev.channels[channel].enabled }
      }
    }));
    setHasChanges(true);
  };

  const updateStrategyMemory = (updates: Partial<MarketingStrategyMemory>) => {
    setStrategyMemory(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Marketing Agent Settings
            {hasChanges && <Badge variant="destructive">Unsaved Changes</Badge>}
          </DialogTitle>
          <DialogDescription>
            Configure the AI Marketing Agent's behavior, policies, and guardrails
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="prompt" className="flex items-center gap-1" data-testid="tab-prompt">
              <Brain className="h-4 w-4" /> Prompt
            </TabsTrigger>
            <TabsTrigger value="policy" className="flex items-center gap-1" data-testid="tab-policy">
              <Shield className="h-4 w-4" /> Policy
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-1" data-testid="tab-budget-settings">
              <DollarSign className="h-4 w-4" /> Budget
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-1" data-testid="tab-strategy-settings">
              <Target className="h-4 w-4" /> Strategy
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1" data-testid="tab-ai-controls">
              <Zap className="h-4 w-4" /> AI Controls
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="prompt" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>Define the AI agent's personality, role, and constraints</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={policy.systemPrompt}
                    onChange={(e) => updatePolicy({ systemPrompt: e.target.value })}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Enter system prompt..."
                    data-testid="input-system-prompt"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePolicy({ systemPrompt: DEFAULT_SYSTEM_PROMPT })}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Reset to Default
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brand Voice</CardTitle>
                  <CardDescription>Tone guidelines and content restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tone Guidelines</Label>
                    <Textarea
                      value={policy.brandVoice.toneGuidelines}
                      onChange={(e) => updateBrandVoice({ toneGuidelines: e.target.value })}
                      className="min-h-[80px]"
                      data-testid="input-tone-guidelines"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Forbidden Claims (one per line)</Label>
                    <Textarea
                      value={policy.brandVoice.forbiddenClaims.join("\n")}
                      onChange={(e) => updateBrandVoice({ forbiddenClaims: e.target.value.split("\n").filter(Boolean) })}
                      className="min-h-[100px]"
                      data-testid="input-forbidden-claims"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Required Disclaimers (one per line)</Label>
                    <Textarea
                      value={policy.brandVoice.requiredDisclaimers.join("\n")}
                      onChange={(e) => updateBrandVoice({ requiredDisclaimers: e.target.value.split("\n").filter(Boolean) })}
                      className="min-h-[60px]"
                      data-testid="input-disclaimers"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policy" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Autonomy Settings</CardTitle>
                  <CardDescription>Control how independently the AI can operate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Autonomy Level: {policy.autonomy.level}</Label>
                    <Slider
                      value={[policy.autonomy.level]}
                      onValueChange={([v]) => updateAutonomy({ level: v as 0|1|2|3 })}
                      max={3}
                      step={1}
                      data-testid="slider-autonomy"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0: Observe</span>
                      <span>1: Assisted</span>
                      <span>2: Semi-Auto</span>
                      <span>3: Autonomous</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confidence Threshold: {policy.autonomy.confidenceThreshold}%</Label>
                    <Slider
                      value={[policy.autonomy.confidenceThreshold]}
                      onValueChange={([v]) => updateAutonomy({ confidenceThreshold: v })}
                      max={100}
                      step={5}
                      data-testid="slider-confidence"
                    />
                    <p className="text-xs text-muted-foreground">AI must request human input below this confidence</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Approval for New Strategy</Label>
                    <Switch
                      checked={policy.autonomy.requireApprovalForNewStrategy}
                      onCheckedChange={(v) => updateAutonomy({ requireApprovalForNewStrategy: v })}
                      data-testid="switch-require-approval"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enabled Channels</CardTitle>
                  <CardDescription>Select which marketing channels the AI can use</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(policy.channels) as Array<keyof typeof policy.channels>).map((channel) => (
                      <div key={channel} className="flex items-center justify-between p-2 border rounded">
                        <span className="capitalize">{channel.replace(/([A-Z])/g, " $1").trim()}</span>
                        <Switch
                          checked={policy.channels[channel].enabled}
                          onCheckedChange={() => toggleChannel(channel)}
                          data-testid={`switch-channel-${channel}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Guardrails</CardTitle>
                  <CardDescription>Safety limits for capacity and outcomes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max New Students/Week</Label>
                      <Input
                        type="number"
                        value={policy.capacityGuardrails.maxNewStudentsPerWeek}
                        onChange={(e) => updateCapacity({ maxNewStudentsPerWeek: Number(e.target.value) })}
                        data-testid="input-max-students"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Tutor Utilization %</Label>
                      <Input
                        type="number"
                        value={policy.capacityGuardrails.maxTutorUtilizationPct}
                        onChange={(e) => updateCapacity({ maxTutorUtilizationPct: Number(e.target.value) })}
                        data-testid="input-max-utilization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min 2-Week Retention %</Label>
                      <Input
                        type="number"
                        value={policy.outcomeGuardrails.min2WeekRetentionPct}
                        onChange={(e) => updateOutcome({ min2WeekRetentionPct: Number(e.target.value) })}
                        data-testid="input-min-retention"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Complaint Rate %</Label>
                      <Input
                        type="number"
                        value={policy.outcomeGuardrails.maxComplaintRatePct}
                        onChange={(e) => updateOutcome({ maxComplaintRatePct: Number(e.target.value) })}
                        data-testid="input-max-complaint"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Controls</CardTitle>
                  <CardDescription>Set spending limits and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Budget Cap</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={policy.budget.monthlyCap}
                          onChange={(e) => updateBudget({ monthlyCap: Number(e.target.value) })}
                          data-testid="input-monthly-cap"
                        />
                        <Select value={policy.budget.currency} onValueChange={(v) => updateBudget({ currency: v })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Budget Cap</Label>
                      <Input
                        type="number"
                        value={policy.budget.dailyCap}
                        onChange={(e) => updateBudget({ dailyCap: Number(e.target.value) })}
                        data-testid="input-daily-cap"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Threshold: {policy.budget.alertThresholdPct}%</Label>
                    <Slider
                      value={[policy.budget.alertThresholdPct]}
                      onValueChange={([v]) => updateBudget({ alertThresholdPct: v })}
                      max={100}
                      step={5}
                      data-testid="slider-alert-threshold"
                    />
                    <p className="text-xs text-muted-foreground">Alert when spend reaches this % of monthly budget</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Memory</CardTitle>
                  <CardDescription>The AI's understanding of what works for your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Thesis</Label>
                    <Textarea
                      value={strategyMemory.currentThesis}
                      onChange={(e) => updateStrategyMemory({ currentThesis: e.target.value })}
                      className="min-h-[80px]"
                      data-testid="input-thesis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Segments (one per line)</Label>
                    <Textarea
                      value={strategyMemory.targetSegments.join("\n")}
                      onChange={(e) => updateStrategyMemory({ targetSegments: e.target.value.split("\n").filter(Boolean) })}
                      data-testid="input-segments"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message Angles (one per line)</Label>
                    <Textarea
                      value={strategyMemory.messageAngles.join("\n")}
                      onChange={(e) => updateStrategyMemory({ messageAngles: e.target.value.split("\n").filter(Boolean) })}
                      data-testid="input-angles"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>What Worked (one per line)</Label>
                      <Textarea
                        value={strategyMemory.whatWorked.join("\n")}
                        onChange={(e) => updateStrategyMemory({ whatWorked: e.target.value.split("\n").filter(Boolean) })}
                        className="min-h-[100px]"
                        data-testid="input-worked"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>What Failed (one per line)</Label>
                      <Textarea
                        value={strategyMemory.whatFailed.join("\n")}
                        onChange={(e) => updateStrategyMemory({ whatFailed: e.target.value.split("\n").filter(Boolean) })}
                        className="min-h-[100px]"
                        data-testid="input-failed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Seasonality Notes (one per line)</Label>
                    <Textarea
                      value={strategyMemory.seasonalityNotes.join("\n")}
                      onChange={(e) => updateStrategyMemory({ seasonalityNotes: e.target.value.split("\n").filter(Boolean) })}
                      data-testid="input-seasonality"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>AI Controls</CardTitle>
                  <CardDescription>Rate limits, model selection, and safety controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select value={policy.aiControls.modelName} onValueChange={(v) => updateAiControls({ modelName: v })}>
                      <SelectTrigger data-testid="select-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Cost-effective)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (High quality)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Tokens</Label>
                      <Input
                        type="number"
                        value={policy.aiControls.maxTokens}
                        onChange={(e) => updateAiControls({ maxTokens: Number(e.target.value) })}
                        data-testid="input-max-tokens"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={policy.aiControls.timeoutMs}
                        onChange={(e) => updateAiControls({ timeoutMs: Number(e.target.value) })}
                        data-testid="input-timeout"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Proposals Per Hour: {policy.aiControls.maxProposalsPerHour}</Label>
                    <Slider
                      value={[policy.aiControls.maxProposalsPerHour]}
                      onValueChange={([v]) => updateAiControls({ maxProposalsPerHour: v })}
                      max={20}
                      step={1}
                      data-testid="slider-rate-limit"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/10">
                    <div>
                      <Label className="text-destructive">Emergency Stop</Label>
                      <p className="text-sm text-muted-foreground">Disable all AI calls</p>
                    </div>
                    <Switch
                      checked={policy.aiControls.emergencyStopEnabled}
                      onCheckedChange={(v) => updateAiControls({ emergencyStopEnabled: v })}
                      data-testid="switch-emergency-stop"
                    />
                  </div>
                  {policy.aiControls.emergencyStopEnabled && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Emergency stop is active. AI proposal generation is disabled.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetToDefault} data-testid="button-reset-defaults">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset to Defaults
            </Button>
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)} data-testid="button-view-history">
              <History className="h-4 w-4 mr-1" /> Version History
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!hasChanges} data-testid="button-save-settings">
              <Save className="h-4 w-4 mr-1" /> Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Version History</DialogTitle>
            <DialogDescription>Restore a previous version of your settings</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {policyHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No previous versions</p>
            ) : (
              <div className="space-y-2">
                {policyHistory.map((v) => (
                  <div key={v.version} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Version {v.version}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(v.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRestoreVersion(v.version)}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
