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
  opsStorage,
  generateIntentNarrative,
  detectAnomalies,
  MITIGATION_CATALOG,
  canAutoApplyMitigation,
  getAutonomyDescription
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
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recommended mitigations:</p>
            <div className="flex flex-wrap gap-2">
              {alert.recommendedMitigations.map((mitigationId) => {
                const mitigation = MITIGATION_CATALOG.find(m => m.id === mitigationId);
                if (!mitigation) return null;
                const canAuto = canAutoApplyMitigation(policy, mitigation);
                
                return (
                  <Button
                    key={mitigationId}
                    size="sm"
                    variant={canAuto.allowed ? "default" : "outline"}
                    onClick={() => onApplyMitigation(alert.id, mitigationId)}
                    disabled={alert.status === "resolved"}
                    data-testid={`apply-${mitigationId}`}
                    title={canAuto.reason}
                  >
                    {canAuto.allowed ? <Bot className="h-3 w-3 mr-1" /> : <Hand className="h-3 w-3 mr-1" />}
                    {mitigation.name}
                  </Button>
                );
              })}
            </div>
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

function HandoffCard({ 
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

  const reasonLabels: Record<string, string> = {
    stuck_loop: "Stuck in Loop",
    low_confidence: "Low Confidence",
    parent_request: "Parent Request",
    complex_topic: "Complex Topic",
    behavioral: "Behavioral"
  };

  const elapsedMins = Math.round((Date.now() - new Date(handoff.createdAt).getTime()) / 60000);
  const isOverdue = elapsedMins > handoff.slaTimerMins;

  return (
    <Card className={`mb-2 ${isOverdue ? "border-red-300 bg-red-50" : ""}`} data-testid={`handoff-${handoff.id}`}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isOverdue ? "destructive" : "outline"}>
              <Clock className="h-3 w-3 mr-1" />
              {elapsedMins}m / {handoff.slaTimerMins}m SLA
            </Badge>
            <Badge variant="secondary">{reasonLabels[handoff.reason]}</Badge>
            <Badge variant="outline">Student: {handoff.studentId}</Badge>
          </div>
          <Badge variant={
            handoff.status === "resolved" ? "secondary" :
            handoff.status === "assigned" ? "default" :
            handoff.status === "in_progress" ? "default" : "outline"
          }>
            {handoff.status}
          </Badge>
        </div>

        <div className="text-sm space-y-2">
          <p><strong>Summary:</strong> {handoff.contextPack.sessionSummary}</p>
          <div>
            <p className="text-xs text-muted-foreground">What was tried:</p>
            <ul className="text-xs list-disc list-inside">
              {handoff.contextPack.whatWasTried.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs bg-blue-50 p-2 rounded">
            <strong>Recommended approach:</strong> {handoff.contextPack.recommendedTutorApproach}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          {handoff.status === "new" && (
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Assign to..."
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
                Assign
              </Button>
            </div>
          )}
          {(handoff.status === "assigned" || handoff.status === "in_progress") && (
            <div className="flex gap-2 flex-1">
              <span className="text-sm">Assigned to: {handoff.assignedTo}</span>
              <Input
                placeholder="Resolution notes..."
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
                Resolve
              </Button>
            </div>
          )}
          {handoff.status === "resolved" && (
            <span className="text-sm text-muted-foreground">
              Resolved: {handoff.resolutionNotes}
            </span>
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

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="ops-agent-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8" />
            Operations Control Room
          </h1>
          <p className="text-muted-foreground">
            Monitor system health, triage alerts, and manage learning quality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={policy.emergencyStop.enabled ? "destructive" : "outline"} className="text-sm py-1 px-3">
            <Shield className="h-4 w-4 mr-1" />
            Level {policy.autonomy.level}: {autonomyDesc.title}
          </Badge>
          <Button
            variant={policy.emergencyStop.enabled ? "destructive" : "outline"}
            onClick={handleEmergencyStop}
            data-testid="btn-emergency-stop"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            {policy.emergencyStop.enabled ? "Deactivate E-Stop" : "Emergency Stop"}
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)} data-testid="btn-settings">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" data-testid="intent-narrative">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <Activity className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">{intentNarrative.headline}</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700 font-medium mb-1">Why Now:</p>
                  <ul className="text-xs text-blue-800">
                    {intentNarrative.whyNow.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium mb-1">Stop Conditions:</p>
                  <ul className="text-xs text-blue-800">
                    {intentNarrative.stopConditions.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            Alerts ({openAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="handoffs" data-testid="tab-handoffs">
            <Users className="h-4 w-4 mr-1" />
            Handoffs ({pendingHandoffs.length})
          </TabsTrigger>
          <TabsTrigger value="log" data-testid="tab-log">
            <Activity className="h-4 w-4 mr-1" />
            Decision Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <ScrollArea className="h-[400px]">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No alerts - all systems healthy</p>
              </div>
            ) : (
              alerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  policy={policy}
                  onAcknowledge={handleAcknowledgeAlert}
                  onResolve={handleResolveAlert}
                  onApplyMitigation={handleApplyMitigation}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="handoffs" className="mt-4">
          <ScrollArea className="h-[400px]">
            {handoffs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No handoff cases</p>
              </div>
            ) : (
              handoffs.map(handoff => (
                <HandoffCard
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
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.actor === "ai" ? "default" : "secondary"}>
                            {log.actor === "ai" ? <Bot className="h-3 w-3 mr-1" /> : <Hand className="h-3 w-3 mr-1" />}
                            {log.actor.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{log.actionType.replace("_", " ")}</Badge>
                          <Badge variant="outline">L{log.autonomyLevelAtTime}</Badge>
                          {log.confidence && (
                            <Badge variant="secondary">{log.confidence}% conf</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{log.what}</p>
                      <p className="text-muted-foreground text-xs">{log.why}</p>
                      {log.alternatives.length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Alternatives: {log.alternatives.map(a => a.option).join(", ")}
                        </div>
                      )}
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
