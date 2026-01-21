import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Save,
  RotateCcw,
  History,
  AlertTriangle,
  Shield,
  Activity,
  Users,
  Gauge,
  BookOpen,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  type OpsPolicy,
  type PolicyVersion,
  type AutonomyLevel,
  opsStorage,
  getDefaultOpsPolicy,
  getAutonomyDescription,
  MITIGATION_CATALOG
} from "@/lib/opsAgentModels";

interface OpsAgentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPolicyChange?: (policy: OpsPolicy) => void;
}

export function OpsAgentSettings({ isOpen, onClose, userId, onPolicyChange }: OpsAgentSettingsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("autonomy");
  const [policy, setPolicy] = useState<OpsPolicy>(getDefaultOpsPolicy());
  const [policyHistory, setPolicyHistory] = useState<PolicyVersion[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPolicy(opsStorage.loadPolicy());
      setPolicyHistory(opsStorage.loadPolicyHistory());
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const savedPolicy = opsStorage.savePolicy(policy, userId);
    setPolicyHistory(opsStorage.loadPolicyHistory());
    setHasChanges(false);
    onPolicyChange?.(savedPolicy);
    toast({ title: "Settings Saved", description: `Policy version ${savedPolicy.version} saved successfully` });
  };

  const handleResetToDefault = () => {
    const defaultPolicy = getDefaultOpsPolicy();
    setPolicy(defaultPolicy);
    setHasChanges(true);
    toast({ title: "Reset to Defaults", description: "Settings reset. Click Save to apply." });
  };

  const handleRestoreVersion = (version: number) => {
    const restored = opsStorage.restorePolicy(version);
    if (restored) {
      setPolicy(restored);
      setShowHistoryDialog(false);
      setHasChanges(false);
      onPolicyChange?.(restored);
      toast({ title: "Version Restored", description: `Restored to version ${version}` });
    }
  };

  const updatePolicy = <K extends keyof OpsPolicy>(key: K, value: OpsPolicy[K]) => {
    setPolicy(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const autonomyDesc = getAutonomyDescription(policy.autonomy.level);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="ops-settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Operations Agent Settings
          </DialogTitle>
          <DialogDescription>
            Configure autonomy levels, SLA targets, guardrails, and mitigation permissions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="autonomy" className="text-xs" data-testid="tab-autonomy">
              <Shield className="h-3 w-3 mr-1" /> Autonomy
            </TabsTrigger>
            <TabsTrigger value="sla" className="text-xs" data-testid="tab-sla">
              <Activity className="h-3 w-3 mr-1" /> SLA
            </TabsTrigger>
            <TabsTrigger value="load" className="text-xs" data-testid="tab-load">
              <Gauge className="h-3 w-3 mr-1" /> Load
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-xs" data-testid="tab-quality">
              <BookOpen className="h-3 w-3 mr-1" /> Quality
            </TabsTrigger>
            <TabsTrigger value="mitigations" className="text-xs" data-testid="tab-mitigations">
              <Users className="h-3 w-3 mr-1" /> Actions
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="autonomy" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Autonomy Level: {policy.autonomy.level}
                  </CardTitle>
                  <CardDescription>{autonomyDesc.title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Slider
                      value={[policy.autonomy.level]}
                      onValueChange={([v]) => updatePolicy("autonomy", { ...policy.autonomy, level: v as AutonomyLevel })}
                      min={0}
                      max={3}
                      step={1}
                      className="w-full"
                      data-testid="autonomy-slider"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0: Observe</span>
                      <span>1: Assisted</span>
                      <span>2: Semi-Auto</span>
                      <span>3: Autonomous</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-700 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> WILL
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs space-y-1">
                          {autonomyDesc.will.map((item, i) => (
                            <li key={i} className="text-green-700">• {item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-700 flex items-center gap-1">
                          <XCircle className="h-4 w-4" /> WILL NOT
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs space-y-1">
                          {autonomyDesc.willNot.map((item, i) => (
                            <li key={i} className="text-red-700">• {item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Confidence Threshold (%)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[policy.autonomy.confidenceThreshold]}
                          onValueChange={([v]) => updatePolicy("autonomy", { ...policy.autonomy, confidenceThreshold: v })}
                          min={50}
                          max={95}
                          step={5}
                          className="flex-1"
                          data-testid="confidence-slider"
                        />
                        <Badge variant="outline">{policy.autonomy.confidenceThreshold}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AI requires at least this confidence level to auto-apply actions
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Approval for Major Actions</Label>
                        <p className="text-xs text-muted-foreground">
                          Always require human approval for major mitigations
                        </p>
                      </div>
                      <Switch
                        checked={policy.autonomy.requireApprovalForMajorActions}
                        onCheckedChange={(v) => updatePolicy("autonomy", { ...policy.autonomy, requireApprovalForMajorActions: v })}
                        data-testid="require-approval-switch"
                      />
                    </div>
                  </div>

                  <Separator />

                  <Alert variant={policy.emergencyStop.enabled ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        {policy.emergencyStop.enabled
                          ? "Emergency Stop ACTIVE - All auto actions disabled"
                          : "Emergency Stop is OFF"}
                      </span>
                      <Switch
                        checked={policy.emergencyStop.enabled}
                        onCheckedChange={(v) => updatePolicy("emergencyStop", { enabled: v })}
                        data-testid="emergency-stop-switch"
                      />
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sla" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    SLA Targets
                  </CardTitle>
                  <CardDescription>Define performance thresholds that trigger alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p95ResponseMs">p95 Response Time (ms)</Label>
                      <Input
                        id="p95ResponseMs"
                        type="number"
                        value={policy.slaTargets.p95ResponseMs}
                        onChange={(e) => updatePolicy("slaTargets", { ...policy.slaTargets, p95ResponseMs: parseInt(e.target.value) || 0 })}
                        data-testid="input-p95-response"
                      />
                      <p className="text-xs text-muted-foreground">Alert if 95th percentile exceeds this</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxErrorRatePct">Max Error Rate (%)</Label>
                      <Input
                        id="maxErrorRatePct"
                        type="number"
                        step="0.1"
                        value={policy.slaTargets.maxErrorRatePct}
                        onChange={(e) => updatePolicy("slaTargets", { ...policy.slaTargets, maxErrorRatePct: parseFloat(e.target.value) || 0 })}
                        data-testid="input-max-error-rate"
                      />
                      <p className="text-xs text-muted-foreground">Alert if error rate exceeds this</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSessionSuccessPct">Min Session Success (%)</Label>
                      <Input
                        id="minSessionSuccessPct"
                        type="number"
                        value={policy.slaTargets.minSessionSuccessPct}
                        onChange={(e) => updatePolicy("slaTargets", { ...policy.slaTargets, minSessionSuccessPct: parseInt(e.target.value) || 0 })}
                        data-testid="input-min-session-success"
                      />
                      <p className="text-xs text-muted-foreground">Alert if success rate drops below</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTimeToHandoffMins">Max Handoff Time (mins)</Label>
                      <Input
                        id="maxTimeToHandoffMins"
                        type="number"
                        value={policy.slaTargets.maxTimeToHandoffMins}
                        onChange={(e) => updatePolicy("slaTargets", { ...policy.slaTargets, maxTimeToHandoffMins: parseInt(e.target.value) || 0 })}
                        data-testid="input-max-handoff-time"
                      />
                      <p className="text-xs text-muted-foreground">SLA for human handoff response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="load" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Load Guardrails
                  </CardTitle>
                  <CardDescription>Configure capacity limits and throttling behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxConcurrentSessions">Max Concurrent Sessions</Label>
                      <Input
                        id="maxConcurrentSessions"
                        type="number"
                        value={policy.loadGuardrails.maxConcurrentSessions}
                        onChange={(e) => updatePolicy("loadGuardrails", { ...policy.loadGuardrails, maxConcurrentSessions: parseInt(e.target.value) || 0 })}
                        data-testid="input-max-sessions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTutorUtilizationPct">Max Tutor Utilization (%)</Label>
                      <Input
                        id="maxTutorUtilizationPct"
                        type="number"
                        value={policy.loadGuardrails.maxTutorUtilizationPct}
                        onChange={(e) => updatePolicy("loadGuardrails", { ...policy.loadGuardrails, maxTutorUtilizationPct: parseInt(e.target.value) || 0 })}
                        data-testid="input-max-utilization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="throttleStepPct">Throttle Step (%)</Label>
                      <Input
                        id="throttleStepPct"
                        type="number"
                        value={policy.loadGuardrails.throttleStepPct}
                        onChange={(e) => updatePolicy("loadGuardrails", { ...policy.loadGuardrails, throttleStepPct: parseInt(e.target.value) || 0 })}
                        data-testid="input-throttle-step"
                      />
                      <p className="text-xs text-muted-foreground">Reduce concurrency by this % when throttling</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Learning Quality Guardrails
                  </CardTitle>
                  <CardDescription>Configure thresholds for learning quality alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxStuckEventsPerSession">Max Stuck Events per Session</Label>
                      <Input
                        id="maxStuckEventsPerSession"
                        type="number"
                        value={policy.learningQualityGuardrails.maxStuckEventsPerSession}
                        onChange={(e) => updatePolicy("learningQualityGuardrails", { ...policy.learningQualityGuardrails, maxStuckEventsPerSession: parseInt(e.target.value) || 0 })}
                        data-testid="input-max-stuck"
                      />
                      <p className="text-xs text-muted-foreground">Alert if student gets stuck too often</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxHintsPerStep">Max Hints per Step</Label>
                      <Input
                        id="maxHintsPerStep"
                        type="number"
                        value={policy.learningQualityGuardrails.maxHintsPerStep}
                        onChange={(e) => updatePolicy("learningQualityGuardrails", { ...policy.learningQualityGuardrails, maxHintsPerStep: parseInt(e.target.value) || 0 })}
                        data-testid="input-max-hints"
                      />
                      <p className="text-xs text-muted-foreground">Alert if too many hints needed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxEarlyExitRatePct">Max Early Exit Rate (%)</Label>
                      <Input
                        id="maxEarlyExitRatePct"
                        type="number"
                        value={policy.learningQualityGuardrails.maxEarlyExitRatePct}
                        onChange={(e) => updatePolicy("learningQualityGuardrails", { ...policy.learningQualityGuardrails, maxEarlyExitRatePct: parseInt(e.target.value) || 0 })}
                        data-testid="input-max-early-exit"
                      />
                      <p className="text-xs text-muted-foreground">Alert if too many students exit early</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mitigations" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Mitigation Permissions
                  </CardTitle>
                  <CardDescription>Configure which mitigations can be auto-applied</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label>Major Actions Require Approval</Label>
                      <p className="text-xs text-muted-foreground">
                        Always require human approval for major mitigations
                      </p>
                    </div>
                    <Switch
                      checked={policy.mitigationPermissions.majorActionsRequireApproval}
                      onCheckedChange={(v) => updatePolicy("mitigationPermissions", { ...policy.mitigationPermissions, majorActionsRequireApproval: v })}
                      data-testid="major-actions-approval-switch"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Safe Mitigations Enabled</Label>
                    <div className="grid gap-2">
                      {MITIGATION_CATALOG.filter(m => m.type === "safe").map((mitigation) => (
                        <div key={mitigation.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={mitigation.id}
                            checked={policy.mitigationPermissions.safeMitigationsEnabled.includes(mitigation.id)}
                            onCheckedChange={(checked) => {
                              const enabled = policy.mitigationPermissions.safeMitigationsEnabled;
                              const newEnabled = checked
                                ? [...enabled, mitigation.id]
                                : enabled.filter(id => id !== mitigation.id);
                              updatePolicy("mitigationPermissions", { ...policy.mitigationPermissions, safeMitigationsEnabled: newEnabled });
                            }}
                            data-testid={`checkbox-${mitigation.id}`}
                          />
                          <div className="flex-1">
                            <Label htmlFor={mitigation.id} className="text-sm font-medium cursor-pointer">
                              {mitigation.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{mitigation.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {mitigation.category.join(", ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-muted-foreground">Major Mitigations (require approval)</Label>
                    <div className="grid gap-2">
                      {MITIGATION_CATALOG.filter(m => m.type === "major").map((mitigation) => (
                        <div key={mitigation.id} className="flex items-center space-x-2 opacity-75">
                          <Checkbox disabled checked={false} />
                          <div className="flex-1">
                            <Label className="text-sm font-medium text-muted-foreground">
                              {mitigation.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{mitigation.description}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            major
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>In-App Alerts</Label>
                      <p className="text-xs text-muted-foreground">Show alerts in the control room</p>
                    </div>
                    <Switch
                      checked={policy.notifications.enableInAppAlerts}
                      onCheckedChange={(v) => updatePolicy("notifications", { ...policy.notifications, enableInAppAlerts: v })}
                      data-testid="in-app-alerts-switch"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Toast Notifications</Label>
                      <p className="text-xs text-muted-foreground">Show toast messages for new alerts</p>
                    </div>
                    <Switch
                      checked={policy.notifications.leadLikeToasts}
                      onCheckedChange={(v) => updatePolicy("notifications", { ...policy.notifications, leadLikeToasts: v })}
                      data-testid="toast-notifications-switch"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)} data-testid="btn-history">
              <History className="h-4 w-4 mr-1" />
              History ({policyHistory.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetToDefault} data-testid="btn-reset">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} data-testid="btn-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} data-testid="btn-save">
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>Restore a previous policy version</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-60">
            {policyHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No previous versions</p>
            ) : (
              <div className="space-y-2">
                {policyHistory.map((v) => (
                  <div key={v.version} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">Version {v.version}</p>
                      <p className="text-xs text-muted-foreground">
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
