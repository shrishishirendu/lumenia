import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Clock, Users, TrendingDown, Activity, Settings, RefreshCw, Eye, Check, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface AcademicAlert {
  id: number;
  studentId: number;
  alertType: string;
  severity: string;
  subject: string | null;
  topic: string | null;
  metric: string;
  currentValue: number;
  threshold: number;
  trend: string | null;
  recommendation: string;
  reasoning: string;
  aiConfidence: number;
  status: string;
  acknowledgedBy: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

interface AcademicQualitySettings {
  id: number;
  autonomyLevel: number;
  masteryThreshold: number;
  engagementThreshold: number;
  progressDeclineThreshold: number;
  inactivityDays: number;
  autoNotifyParent: boolean;
  autoNotifyTutor: boolean;
  scanFrequency: string;
  isActive: boolean;
  updatedAt: string;
}

interface Stats {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  acknowledgedToday: number;
  resolvedToday: number;
  atRiskStudents: number;
  avgResolutionTime: number;
}

export default function AcademicQualityAgent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAlert, setSelectedAlert] = useState<AcademicAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/academic-quality/stats"]
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<AcademicAlert[]>({
    queryKey: ["/api/academic-quality/alerts"]
  });

  const { data: activeAlerts = [] } = useQuery<AcademicAlert[]>({
    queryKey: ["/api/academic-quality/alerts", "active"],
    queryFn: () => apiRequest("GET", "/api/academic-quality/alerts?status=active").then(r => r.json())
  });

  const { data: settings } = useQuery<AcademicQualitySettings>({
    queryKey: ["/api/academic-quality/settings"]
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }: { id: number; status: string; resolutionNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/academic-quality/alerts/${id}`, { status, resolutionNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-quality/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic-quality/stats"] });
      setSelectedAlert(null);
      setResolutionNotes("");
    }
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/academic-quality/scan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-quality/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academic-quality/stats"] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<AcademicQualitySettings>) => {
      const res = await apiRequest("PUT", "/api/academic-quality/settings", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-quality/settings"] });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="destructive">Active</Badge>;
      case "acknowledged": return <Badge variant="secondary">Acknowledged</Badge>;
      case "in_progress": return <Badge className="bg-blue-500">In Progress</Badge>;
      case "resolved": return <Badge className="bg-green-500">Resolved</Badge>;
      case "dismissed": return <Badge variant="outline">Dismissed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "low_mastery": return "Low Mastery";
      case "declining_progress": return "Declining Progress";
      case "low_engagement": return "Low Engagement";
      case "struggling_topic": return "Struggling Topic";
      case "at_risk": return "At Risk";
      case "improvement_opportunity": return "Improvement Opportunity";
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">Academic Quality Agent</h1>
          <p className="text-gray-500 mt-1">Monitor student progress and identify at-risk students</p>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          data-testid="button-scan-students"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${scanMutation.isPending ? "animate-spin" : ""}`} />
          {scanMutation.isPending ? "Scanning..." : "Scan All Students"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{activeAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-alerts">
                  {statsLoading ? "..." : stats?.activeAlerts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.criticalAlerts || 0} critical, {stats?.highAlerts || 0} high
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-at-risk-students">
                  {statsLoading ? "..." : stats?.atRiskStudents || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-resolved-today">
                  {statsLoading ? "..." : stats?.resolvedToday || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.acknowledgedToday || 0} acknowledged today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-avg-resolution">
                  {statsLoading ? "..." : `${stats?.avgResolutionTime || 0}h`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hours to resolve alerts
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Alerts
                </CardTitle>
                <CardDescription>Alerts requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeAlerts.filter(a => a.severity === "critical" || a.severity === "high").length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No critical alerts</p>
                  ) : (
                    activeAlerts
                      .filter(a => a.severity === "critical" || a.severity === "high")
                      .slice(0, 5)
                      .map(alert => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-red-50 border-red-200"
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{getAlertTypeLabel(alert.alertType)}</p>
                            <p className="text-xs text-gray-600">{alert.recommendation}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(alert.createdAt)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest alert resolutions and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.filter(a => a.status === "resolved" || a.status === "acknowledged").length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  ) : (
                    alerts
                      .filter(a => a.status === "resolved" || a.status === "acknowledged")
                      .slice(0, 5)
                      .map(alert => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{getAlertTypeLabel(alert.alertType)}</p>
                            <p className="text-xs text-gray-600">{alert.status === "resolved" ? "Resolved" : "Acknowledged"}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {alert.resolvedAt ? formatDate(alert.resolvedAt) : alert.acknowledgedAt ? formatDate(alert.acknowledgedAt) : ""}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>View and manage all academic quality alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="text-center py-8">Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No alerts found</p>
                  <p className="text-sm">Run a scan to check for student issues</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {alerts.map(alert => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                        data-testid={`alert-item-${alert.id}`}
                      >
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{getAlertTypeLabel(alert.alertType)}</span>
                            {getStatusBadge(alert.status)}
                            <Badge variant="outline">{alert.severity}</Badge>
                            {alert.subject && <Badge variant="secondary">{alert.subject}</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.recommendation}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Student #{alert.studentId}</span>
                            <span>{alert.metric}: {alert.currentValue}% (threshold: {alert.threshold}%)</span>
                            <span>Confidence: {alert.aiConfidence}%</span>
                            <span>{formatDate(alert.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {alert.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAlertMutation.mutate({ id: alert.id, status: "acknowledged" })}
                                disabled={updateAlertMutation.isPending}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAlertMutation.mutate({ id: alert.id, status: "dismissed" })}
                                disabled={updateAlertMutation.isPending}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                At-Risk Students
              </CardTitle>
              <CardDescription>Students requiring intervention based on performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.filter(a => a.alertType === "at_risk").length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No at-risk students identified</p>
                  <p className="text-sm">Run a scan to check for student issues</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts
                    .filter(a => a.alertType === "at_risk")
                    .map(alert => (
                      <div key={alert.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Student #{alert.studentId}</p>
                            <p className="text-sm text-gray-600 mt-1">{alert.recommendation}</p>
                            <p className="text-xs text-gray-500 mt-2">{alert.reasoning}</p>
                          </div>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => setSelectedAlert(alert)}>
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAlertMutation.mutate({ id: alert.id, status: "in_progress" })}
                            disabled={updateAlertMutation.isPending}
                          >
                            Start Intervention
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Settings
              </CardTitle>
              <CardDescription>Configure monitoring thresholds and automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Agent Active</Label>
                  <p className="text-sm text-gray-500">Enable or disable the Academic Quality Agent</p>
                </div>
                <Switch
                  checked={settings?.isActive ?? true}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ isActive: checked })}
                  data-testid="switch-active"
                />
              </div>

              <div className="space-y-2">
                <Label>Autonomy Level: {settings?.autonomyLevel || 1}</Label>
                <p className="text-sm text-gray-500">
                  {settings?.autonomyLevel === 1 && "Monitor only - generates alerts for human review"}
                  {settings?.autonomyLevel === 2 && "Alert + Recommend - notifies tutors automatically"}
                  {settings?.autonomyLevel === 3 && "Full autonomy - auto-escalates critical issues"}
                </p>
                <Slider
                  value={[settings?.autonomyLevel || 1]}
                  onValueChange={([v]) => updateSettingsMutation.mutate({ autonomyLevel: v })}
                  min={1}
                  max={3}
                  step={1}
                  data-testid="slider-autonomy"
                />
              </div>

              <div className="space-y-2">
                <Label>Mastery Threshold: {settings?.masteryThreshold || 60}%</Label>
                <p className="text-sm text-gray-500">Alert when mastery falls below this level</p>
                <Slider
                  value={[settings?.masteryThreshold || 60]}
                  onValueChange={([v]) => updateSettingsMutation.mutate({ masteryThreshold: v })}
                  min={20}
                  max={90}
                  step={5}
                  data-testid="slider-mastery-threshold"
                />
              </div>

              <div className="space-y-2">
                <Label>Engagement Threshold: {settings?.engagementThreshold || 40}%</Label>
                <p className="text-sm text-gray-500">Alert when engagement falls below this level</p>
                <Slider
                  value={[settings?.engagementThreshold || 40]}
                  onValueChange={([v]) => updateSettingsMutation.mutate({ engagementThreshold: v })}
                  min={10}
                  max={80}
                  step={5}
                  data-testid="slider-engagement-threshold"
                />
              </div>

              <div className="space-y-2">
                <Label>Inactivity Days: {settings?.inactivityDays || 7}</Label>
                <p className="text-sm text-gray-500">Days without activity before flagging</p>
                <Slider
                  value={[settings?.inactivityDays || 7]}
                  onValueChange={([v]) => updateSettingsMutation.mutate({ inactivityDays: v })}
                  min={3}
                  max={30}
                  step={1}
                  data-testid="slider-inactivity-days"
                />
              </div>

              <div className="space-y-2">
                <Label>Scan Frequency</Label>
                <Select
                  value={settings?.scanFrequency || "daily"}
                  onValueChange={(v) => updateSettingsMutation.mutate({ scanFrequency: v })}
                >
                  <SelectTrigger data-testid="select-scan-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-notify Parents</Label>
                  <p className="text-sm text-gray-500">Automatically notify parents of critical alerts</p>
                </div>
                <Switch
                  checked={settings?.autoNotifyParent ?? false}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ autoNotifyParent: checked })}
                  data-testid="switch-notify-parent"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-notify Tutors</Label>
                  <p className="text-sm text-gray-500">Automatically notify tutors of active alerts</p>
                </div>
                <Switch
                  checked={settings?.autoNotifyTutor ?? true}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ autoNotifyTutor: checked })}
                  data-testid="switch-notify-tutor"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && (
                <>
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(selectedAlert.severity)}`} />
                  {getAlertTypeLabel(selectedAlert.alertType)}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Student #{selectedAlert?.studentId} - {selectedAlert?.subject || "General"}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500">Current Value</p>
                  <p className="text-2xl font-bold">{selectedAlert.currentValue}%</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500">Threshold</p>
                  <p className="text-2xl font-bold">{selectedAlert.threshold}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">AI Recommendation</p>
                <p className="text-gray-600 mt-1">{selectedAlert.recommendation}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Reasoning</p>
                <p className="text-gray-600 mt-1">{selectedAlert.reasoning}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>AI Confidence: {selectedAlert.aiConfidence}%</span>
                <span>Status: {selectedAlert.status}</span>
                {selectedAlert.trend && <span>Trend: {selectedAlert.trend}</span>}
              </div>

              {selectedAlert.status !== "resolved" && (
                <div className="space-y-2">
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about the resolution..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedAlert?.status === "active" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => updateAlertMutation.mutate({
                    id: selectedAlert.id,
                    status: "acknowledged"
                  })}
                  disabled={updateAlertMutation.isPending}
                >
                  Acknowledge
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateAlertMutation.mutate({
                    id: selectedAlert.id,
                    status: "in_progress"
                  })}
                  disabled={updateAlertMutation.isPending}
                >
                  Start Intervention
                </Button>
              </>
            )}
            {selectedAlert?.status !== "resolved" && selectedAlert?.status !== "dismissed" && (
              <Button
                onClick={() => updateAlertMutation.mutate({
                  id: selectedAlert!.id,
                  status: "resolved",
                  resolutionNotes
                })}
                disabled={updateAlertMutation.isPending}
              >
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
