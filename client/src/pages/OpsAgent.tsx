import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Activity,
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Server,
  TrendingUp,
  TrendingDown,
  Shield,
  Eye,
  Hand,
  Bot,
  UserCheck
} from "lucide-react";
import { OpsAgentSettings } from "@/components/OpsAgentSettings";
import {
  type OpsPolicy,
  type TelemetrySnapshot,
  type OpsAlert,
  type OpsActionLog,
  type HumanHandoffCase,
  type AlertBucket,
  opsStorage,
  generateIntentNarrative,
  detectAnomalies,
  MITIGATION_CATALOG,
  canAutoApplyMitigation,
  getAutonomyDescription,
  categorizeAlertBucket,
  getBucketLabel,
  generateHumanReadableLogSentence,
  getHandoffReasonExplanation
} from "@/lib/opsAgentModels";
import {
  startSimulator,
  stopSimulator,
  isSimulatorRunning,
  injectIncident,
  resetTelemetryToBaseline,
  registerTickCallback,
  generateMockHandoff
} from "@/lib/telemetrySimulator";

function MetricCard({ 
  title, 
  value, 
  unit = "", 
  trend,
  status = "normal"
}: { 
  title: string; 
  value: number | string; 
  unit?: string; 
  trend?: "up" | "down" | "stable";
  status?: "normal" | "warning" | "critical";
}) {
  const statusColors = {
    normal: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    critical: "bg-red-50 border-red-200"
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3 text-green-500" />,
    down: <TrendingDown className="h-3 w-3 text-red-500" />,
    stable: null
  };

  return (
    <Card className={`${statusColors[status]}`} data-testid={`metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{title}</p>
          {trend && trendIcons[trend]}
        </div>
        <p className="text-2xl font-bold mt-1">
          {value}{unit}
        </p>
      </CardContent>
    </Card>
  );
}

function AlertCard({ 
  alert, 
  policy,
  onAcknowledge, 
  onResolve,
  onApplyMitigation
}: { 
  alert: OpsAlert;
  policy: OpsPolicy;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string, notes: string) => void;
  onApplyMitigation: (alertId: string, mitigationId: string) => void;
}) {
  const [resolveNotes, setResolveNotes] = useState("");
  const [showResolveInput, setShowResolveInput] = useState(false);

  const severityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800"
  };

  const severityIcons: Record<string, React.ReactNode> = {
    low: <Eye className="h-4 w-4" />,
    medium: <AlertTriangle className="h-4 w-4" />,
    high: <AlertTriangle className="h-4 w-4" />,
    critical: <Zap className="h-4 w-4" />
  };

  return (
    <Card className="mb-2" data-testid={`alert-${alert.id}`}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={severityColors[alert.severity]}>
              {severityIcons[alert.severity]}
              <span className="ml-1">{alert.severity.toUpperCase()}</span>
            </Badge>
            <Badge variant="outline">{alert.category}</Badge>
            <Badge variant="secondary">{alert.confidence}% conf</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(alert.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <p className="text-sm">{alert.description}</p>

        {alert.recommendedMitigations.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Recommended mitigations:</p>
            {alert.recommendedMitigations.map((mitigationId) => {
              const mitigation = MITIGATION_CATALOG.find(m => m.id === mitigationId);
              if (!mitigation) return null;
              const canAuto = canAutoApplyMitigation(policy, mitigation);
              
              return (
                <div key={mitigationId} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{mitigation.name}</span>
                    <Button
                      size="sm"
                      variant={canAuto.allowed ? "default" : "outline"}
                      onClick={() => onApplyMitigation(alert.id, mitigationId)}
                      disabled={alert.status === "resolved"}
                      data-testid={`apply-${mitigationId}`}
                      title={canAuto.reason}
                    >
                      {canAuto.allowed ? <Bot className="h-3 w-3 mr-1" /> : <Hand className="h-3 w-3 mr-1" />}
                      Apply
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Impact:</span>{" "}
                      <Badge variant="outline" className="text-xs">
                        {mitigation.impactScope === "system" ? "System-wide" : 
                         mitigation.impactScope === "cohort" ? "Student group" : "Single session"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reversible:</span>{" "}
                      <Badge variant={mitigation.reversible ? "secondary" : "outline"} className="text-xs">
                        {mitigation.reversible ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      Side-effect: {mitigation.sideEffect}
                    </div>
                    {mitigation.reversible && mitigation.reversalMethod && (
                      <div className="col-span-2 text-muted-foreground">
                        Recovery: {mitigation.reversalMethod}
                        {mitigation.estimatedRecoveryMins && ` (~${mitigation.estimatedRecoveryMins} min)`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          {alert.status === "open" && (
            <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)} data-testid={`ack-${alert.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              Acknowledge
            </Button>
          )}
          {alert.status !== "resolved" && (
            <>
              {showResolveInput ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Resolution notes..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="flex-1"
                    data-testid={`resolve-notes-${alert.id}`}
                  />
                  <Button size="sm" onClick={() => {
                    onResolve(alert.id, resolveNotes);
                    setResolveNotes("");
                    setShowResolveInput(false);
                  }} data-testid={`confirm-resolve-${alert.id}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowResolveInput(true)} data-testid={`resolve-${alert.id}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              )}
            </>
          )}
          {alert.status === "resolved" && (
            <Badge variant="secondary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolved
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentSupportCard({ 
  handoff, 
  onAssign, 
  onResolve 
}: { 
  handoff: HumanHandoffCase;
  onAssign: (id: string, assignee: string) => void;
  onResolve: (id: string, notes: string) => void;
}) {
  const [assignee, setAssignee] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const explanation = getHandoffReasonExplanation(handoff.reason);

  const elapsedMins = Math.round((Date.now() - new Date(handoff.createdAt).getTime()) / 60000);
  const isOverdue = elapsedMins > handoff.slaTimerMins;

  return (
    <Card className={`mb-3 ${isOverdue ? "border-amber-300 bg-amber-50" : "bg-white"}`} data-testid={`support-${handoff.id}`}>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium text-sm">Student: {handoff.studentId}</p>
            <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {isOverdue ? `${elapsedMins - handoff.slaTimerMins}m overdue` : `${handoff.slaTimerMins - elapsedMins}m remaining`}
            </Badge>
          </div>
          <Badge variant={
            handoff.status === "resolved" ? "secondary" :
            handoff.status === "assigned" ? "default" :
            handoff.status === "in_progress" ? "default" : "outline"
          }>
            {handoff.status === "new" ? "Needs attention" : handoff.status}
          </Badge>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-blue-900">Why human support is needed:</p>
          <p className="text-sm text-blue-800">{explanation.whyNeeded}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">What the AI tutor already tried:</p>
          <ul className="text-sm space-y-1">
            {handoff.contextPack.whatWasTried.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-green-900">Suggested coaching approach:</p>
          <p className="text-sm text-green-800">{explanation.suggestedApproach}</p>
        </div>

        <div className="text-sm text-muted-foreground">
          <strong>Session context:</strong> {handoff.contextPack.sessionSummary}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t">
          {handoff.status === "new" && (
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Your name..."
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="flex-1"
                data-testid={`assignee-${handoff.id}`}
              />
              <Button size="sm" onClick={() => {
                onAssign(handoff.id, assignee);
                setAssignee("");
              }} disabled={!assignee} data-testid={`assign-${handoff.id}`}>
                <UserCheck className="h-3 w-3 mr-1" />
                I'll help this student
              </Button>
            </div>
          )}
          {(handoff.status === "assigned" || handoff.status === "in_progress") && (
            <div className="flex gap-2 flex-1">
              <span className="text-sm font-medium">{handoff.assignedTo} is helping</span>
              <Input
                placeholder="How did it go?"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="flex-1"
                data-testid={`handoff-notes-${handoff.id}`}
              />
              <Button size="sm" onClick={() => {
                onResolve(handoff.id, resolveNotes);
                setResolveNotes("");
              }} data-testid={`handoff-resolve-${handoff.id}`}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark resolved
              </Button>
            </div>
          )}
          {handoff.status === "resolved" && (
            <div className="text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
              Resolved: {handoff.resolutionNotes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpsAgent() {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [policy, setPolicy] = useState<OpsPolicy>(opsStorage.loadPolicy());
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(opsStorage.loadTelemetry());
  const [alerts, setAlerts] = useState<OpsAlert[]>(opsStorage.loadAlerts());
  const [actionLog, setActionLog] = useState<OpsActionLog[]>(opsStorage.loadActionLog());
  const [handoffs, setHandoffs] = useState<HumanHandoffCase[]>(opsStorage.loadHandoffs());
  const [simulatorRunning, setSimulatorRunning] = useState(isSimulatorRunning());
  const [activeTab, setActiveTab] = useState("alerts");
  const [showAllBuckets, setShowAllBuckets] = useState(false);

  const userId = "admin";

  const refreshData = useCallback(() => {
    setPolicy(opsStorage.loadPolicy());
    setTelemetry(opsStorage.loadTelemetry());
    setAlerts(opsStorage.loadAlerts());
    setActionLog(opsStorage.loadActionLog());
    setHandoffs(opsStorage.loadHandoffs());
  }, []);

  useEffect(() => {
    refreshData();

    const unregister = registerTickCallback((newTelemetry, newAlerts) => {
      setTelemetry(newTelemetry);
      if (newAlerts.length > 0) {
        setAlerts(opsStorage.loadAlerts());
        const p = opsStorage.loadPolicy();
        if (p.notifications.leadLikeToasts) {
          newAlerts.forEach(alert => {
            toast({
              title: `New ${alert.severity.toUpperCase()} Alert`,
              description: alert.description,
              variant: alert.severity === "critical" ? "destructive" : "default"
            });
          });
        }
      }
    });

    return () => unregister();
  }, [refreshData, toast]);

  const handleToggleSimulator = () => {
    if (simulatorRunning) {
      stopSimulator();
      setSimulatorRunning(false);
      toast({ title: "Simulator Stopped" });
    } else {
      startSimulator(15000);
      setSimulatorRunning(true);
      toast({ title: "Simulator Started", description: "Telemetry will update every 15 seconds" });
    }
  };

  const handleInjectIncident = (type: "latency_spike" | "error_spike" | "capacity_overload" | "quality_drop") => {
    const current = opsStorage.loadTelemetry();
    const injected = injectIncident(current, type);
    opsStorage.saveTelemetry(injected);
    setTelemetry(injected);

    const p = opsStorage.loadPolicy();
    const anomalies = detectAnomalies(p, injected);
    for (const anomaly of anomalies) {
      const existing = alerts.find((a: OpsAlert) => a.category === anomaly.category && a.status === "open");
      if (!existing) {
        opsStorage.createAlert(anomaly);
      }
    }

    setAlerts(opsStorage.loadAlerts());
    toast({ 
      title: "Incident Injected", 
      description: `${type.replace("_", " ")} simulated`,
      variant: "destructive"
    });
  };

  const handleResetTelemetry = () => {
    resetTelemetryToBaseline();
    setTelemetry(opsStorage.loadTelemetry());
    toast({ title: "Telemetry Reset", description: "All metrics reset to baseline" });
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    opsStorage.acknowledgeAlert(alertId, userId);
    setAlerts(opsStorage.loadAlerts());
    setActionLog(opsStorage.loadActionLog());
  };

  const handleResolveAlert = (alertId: string, notes: string) => {
    opsStorage.resolveAlert(alertId, userId, notes);
    setAlerts(opsStorage.loadAlerts());
    setActionLog(opsStorage.loadActionLog());
    toast({ title: "Alert Resolved" });
  };

  const handleApplyMitigation = (alertId: string, mitigationId: string) => {
    const mitigation = MITIGATION_CATALOG.find(m => m.id === mitigationId);
    if (!mitigation) return;

    const canAuto = canAutoApplyMitigation(policy, mitigation);

    opsStorage.addActionLog({
      actionType: canAuto.allowed ? "mitigation_applied" : "mitigation_recommended",
      what: `${mitigation.name} ${canAuto.allowed ? "applied" : "recommended"}`,
      why: canAuto.reason,
      alternatives: MITIGATION_CATALOG
        .filter(m => m.id !== mitigationId && m.category.some(c => mitigation.category.includes(c)))
        .slice(0, 2)
        .map(m => ({ option: m.name, whyRejected: "Not selected by user" })),
      confidence: 85,
      autonomyLevelAtTime: policy.autonomy.level,
      actor: canAuto.allowed ? "ai" : "human",
      relatedIds: { alertId }
    });

    setActionLog(opsStorage.loadActionLog());

    toast({
      title: canAuto.allowed ? "Mitigation Applied" : "Mitigation Applied (Manual)",
      description: mitigation.name
    });
  };

  const handleAssignHandoff = (handoffId: string, assignee: string) => {
    opsStorage.assignHandoff(handoffId, assignee);
    setHandoffs(opsStorage.loadHandoffs());
    toast({ title: "Handoff Assigned", description: `Assigned to ${assignee}` });
  };

  const handleResolveHandoff = (handoffId: string, notes: string) => {
    opsStorage.resolveHandoff(handoffId, notes);
    setHandoffs(opsStorage.loadHandoffs());
    toast({ title: "Handoff Resolved" });
  };

  const handleCreateMockHandoff = () => {
    const mockData = generateMockHandoff();
    opsStorage.createHandoff(mockData);
    setHandoffs(opsStorage.loadHandoffs());
    setActionLog(opsStorage.loadActionLog());
    toast({ title: "Mock Handoff Created", description: `Reason: ${mockData.reason}` });
  };

  const handleEmergencyStop = () => {
    const newEnabled = !policy.emergencyStop.enabled;
    opsStorage.setEmergencyStop(newEnabled, userId);
    setPolicy(opsStorage.loadPolicy());
    setActionLog(opsStorage.loadActionLog());
    toast({
      title: newEnabled ? "Emergency Stop ACTIVATED" : "Emergency Stop Deactivated",
      variant: newEnabled ? "destructive" : "default"
    });
  };

  const intentNarrative = generateIntentNarrative(policy, telemetry);
  const autonomyDesc = getAutonomyDescription(policy.autonomy.level);
  const openAlerts = alerts.filter(a => a.status === "open");
  const pendingHandoffs = handoffs.filter(h => h.status !== "resolved");

  const getMetricStatus = (value: number, threshold: number, inverse = false): "normal" | "warning" | "critical" => {
    const ratio = inverse ? threshold / value : value / threshold;
    if (ratio > 1.2) return "critical";
    if (ratio > 0.9) return "warning";
    return "normal";
  };

  const alertsByBucket = {
    critical: alerts.filter(a => a.status !== "resolved" && categorizeAlertBucket(a) === "critical"),
    quality_risk: alerts.filter(a => a.status !== "resolved" && categorizeAlertBucket(a) === "quality_risk"),
    capacity_risk: alerts.filter(a => a.status !== "resolved" && categorizeAlertBucket(a) === "capacity_risk"),
    informational: alerts.filter(a => a.status !== "resolved" && categorizeAlertBucket(a) === "informational")
  };
  const priorityAlerts = [...alertsByBucket.critical, ...alertsByBucket.quality_risk];
  const secondaryAlerts = [...alertsByBucket.capacity_risk, ...alertsByBucket.informational];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="ops-agent-page">
      {policy.emergencyStop.enabled && (
        <Alert variant="destructive" className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ops Agent Paused by Human</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>All automatic mitigations are disabled. The agent is in observe-only mode.</span>
            <Button size="sm" variant="outline" onClick={handleEmergencyStop} data-testid="btn-resume">
              Resume Agent
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8" />
            Operations Control Room
          </h1>
          <p className="text-muted-foreground">
            Protecting student learning experiences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)} data-testid="btn-settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          {!policy.emergencyStop.enabled && (
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleEmergencyStop}
              data-testid="btn-emergency-stop"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause Agent
            </Button>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mt-2 pt-2">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" data-testid="intent-narrative">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-4">
              <Activity className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 text-lg">{intentNarrative.headline}</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">Why monitoring now:</p>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      {intentNarrative.whyNow.slice(0, 2).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">Auto-stop if:</p>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      {intentNarrative.stopConditions.slice(0, 2).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={policy.emergencyStop.enabled ? "destructive" : "secondary"}>
                        Level {policy.autonomy.level}
                      </Badge>
                      <span className="text-xs font-medium text-blue-900">{autonomyDesc.title}</span>
                    </div>
                    <div className="text-xs text-blue-800">
                      <span className="font-medium text-green-700">WILL:</span> {autonomyDesc.will.slice(0, 2).join(", ")}
                    </div>
                    <div className="text-xs text-blue-800">
                      <span className="font-medium text-red-600">WON'T:</span> {autonomyDesc.willNot.slice(0, 2).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <MetricCard
          title="Uptime"
          value={telemetry.system.uptimePct.toFixed(1)}
          unit="%"
          status={telemetry.system.uptimePct < 99 ? "warning" : "normal"}
        />
        <MetricCard
          title="p95 Latency"
          value={telemetry.system.p95ResponseMs}
          unit="ms"
          status={getMetricStatus(telemetry.system.p95ResponseMs, policy.slaTargets.p95ResponseMs)}
        />
        <MetricCard
          title="Error Rate"
          value={telemetry.system.errorRatePct.toFixed(1)}
          unit="%"
          status={getMetricStatus(telemetry.system.errorRatePct, policy.slaTargets.maxErrorRatePct)}
        />
        <MetricCard
          title="Active Sessions"
          value={telemetry.sessions.active}
          status={telemetry.sessions.active > policy.loadGuardrails.maxConcurrentSessions * 0.9 ? "warning" : "normal"}
        />
        <MetricCard
          title="Tutor Utilization"
          value={telemetry.capacity.tutorUtilizationPct}
          unit="%"
          status={getMetricStatus(telemetry.capacity.tutorUtilizationPct, policy.loadGuardrails.maxTutorUtilizationPct)}
        />
        <MetricCard
          title="Session Success"
          value={telemetry.sessions.successRatePct}
          unit="%"
          status={getMetricStatus(policy.slaTargets.minSessionSuccessPct, telemetry.sessions.successRatePct)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Simulator Controls
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={simulatorRunning ? "destructive" : "default"}
                onClick={handleToggleSimulator}
                data-testid="btn-toggle-simulator"
              >
                {simulatorRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {simulatorRunning ? "Stop" : "Start"} Simulator
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetTelemetry} data-testid="btn-reset-telemetry">
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => handleInjectIncident("latency_spike")} data-testid="inject-latency">
              Inject Latency Spike
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleInjectIncident("error_spike")} data-testid="inject-errors">
              Inject Error Spike
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleInjectIncident("capacity_overload")} data-testid="inject-capacity">
              Inject Capacity Overload
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleInjectIncident("quality_drop")} data-testid="inject-quality">
              Inject Quality Drop
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button size="sm" variant="outline" onClick={handleCreateMockHandoff} data-testid="create-handoff">
              <Users className="h-4 w-4 mr-1" />
              Create Mock Handoff
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Alerts ({priorityAlerts.length + (showAllBuckets ? secondaryAlerts.length : 0)})
          </TabsTrigger>
          <TabsTrigger value="support" data-testid="tab-support">
            <Users className="h-4 w-4 mr-1" />
            Student Support ({pendingHandoffs.length})
          </TabsTrigger>
          <TabsTrigger value="log" data-testid="tab-log">
            <Activity className="h-4 w-4 mr-1" />
            Decision Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          {priorityAlerts.length === 0 && secondaryAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No alerts - all systems healthy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertsByBucket.critical.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive" className="text-xs">
                      {getBucketLabel("critical").label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getBucketLabel("critical").description}</span>
                  </div>
                  <ScrollArea className="max-h-[250px]">
                    {alertsByBucket.critical.map(alert => (
                      <AlertCard key={alert.id} alert={alert} policy={policy} onAcknowledge={handleAcknowledgeAlert} onResolve={handleResolveAlert} onApplyMitigation={handleApplyMitigation} />
                    ))}
                  </ScrollArea>
                </div>
              )}
              
              {alertsByBucket.quality_risk.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      {getBucketLabel("quality_risk").label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getBucketLabel("quality_risk").description}</span>
                  </div>
                  <ScrollArea className="max-h-[250px]">
                    {alertsByBucket.quality_risk.map(alert => (
                      <AlertCard key={alert.id} alert={alert} policy={policy} onAcknowledge={handleAcknowledgeAlert} onResolve={handleResolveAlert} onApplyMitigation={handleApplyMitigation} />
                    ))}
                  </ScrollArea>
                </div>
              )}

              {secondaryAlerts.length > 0 && (
                <div className="pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setShowAllBuckets(!showAllBuckets)} className="text-xs text-muted-foreground">
                    {showAllBuckets ? "Hide" : "Show"} {secondaryAlerts.length} lower-priority alerts
                  </Button>
                  
                  {showAllBuckets && (
                    <div className="mt-3 space-y-4">
                      {alertsByBucket.capacity_risk.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {getBucketLabel("capacity_risk").label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{getBucketLabel("capacity_risk").description}</span>
                          </div>
                          {alertsByBucket.capacity_risk.map(alert => (
                            <AlertCard key={alert.id} alert={alert} policy={policy} onAcknowledge={handleAcknowledgeAlert} onResolve={handleResolveAlert} onApplyMitigation={handleApplyMitigation} />
                          ))}
                        </div>
                      )}
                      
                      {alertsByBucket.informational.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs text-gray-500">
                              {getBucketLabel("informational").label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{getBucketLabel("informational").description}</span>
                          </div>
                          {alertsByBucket.informational.map(alert => (
                            <AlertCard key={alert.id} alert={alert} policy={policy} onAcknowledge={handleAcknowledgeAlert} onResolve={handleResolveAlert} onApplyMitigation={handleApplyMitigation} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="support" className="mt-4">
          <ScrollArea className="h-[400px]">
            {handoffs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No students waiting for support</p>
                <p className="text-xs mt-1">When the AI tutor needs human help, cases will appear here</p>
              </div>
            ) : (
              handoffs.map(handoff => (
                <StudentSupportCard
                  key={handoff.id}
                  handoff={handoff}
                  onAssign={handleAssignHandoff}
                  onResolve={handleResolveHandoff}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <ScrollArea className="h-[400px]">
            {actionLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No actions logged yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {actionLog.map(log => (
                  <Card key={log.id} className="text-sm" data-testid={`log-${log.id}`}>
                    <CardContent className="pt-3 pb-2">
                      <p className="text-sm mb-2">{generateHumanReadableLogSentence(log)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={log.actor === "ai" ? "default" : "secondary"} className="text-xs">
                          {log.actor === "ai" ? <Bot className="h-3 w-3 mr-1" /> : <Hand className="h-3 w-3 mr-1" />}
                          {log.actor.toUpperCase()}
                        </Badge>
                        <span>{log.actionType.replace(/_/g, " ")}</span>
                        {log.alternatives.length > 0 && (
                          <span className="text-muted-foreground">
                            (Also considered: {log.alternatives.map(a => a.option).join(", ")})
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <OpsAgentSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
        onPolicyChange={setPolicy}
      />
    </div>
  );
}
