export type AutonomyLevel = 0 | 1 | 2 | 3;
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertCategory = "latency" | "errors" | "session_failures" | "quality_drop" | "capacity_overload" | "handoff_needed";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type MitigationType = "safe" | "major";
export type HandoffReason = "stuck_loop" | "low_confidence" | "parent_request" | "complex_topic" | "behavioral";
export type HandoffStatus = "new" | "assigned" | "in_progress" | "resolved";
export type SystemState = "stable" | "degraded" | "at_risk";

export interface OpsPolicy {
  id: string;
  version: number;
  updatedAt: Date;
  updatedBy: string;

  autonomy: {
    level: AutonomyLevel;
    confidenceThreshold: number;
    requireApprovalForMajorActions: boolean;
  };

  slaTargets: {
    p95ResponseMs: number;
    maxErrorRatePct: number;
    minSessionSuccessPct: number;
    maxTimeToHandoffMins: number;
  };

  loadGuardrails: {
    maxConcurrentSessions: number;
    maxTutorUtilizationPct: number;
    throttleStepPct: number;
  };

  learningQualityGuardrails: {
    maxStuckEventsPerSession: number;
    maxHintsPerStep: number;
    maxEarlyExitRatePct: number;
  };

  mitigationPermissions: {
    safeMitigationsEnabled: string[];
    majorActionsRequireApproval: boolean;
  };

  notifications: {
    enableInAppAlerts: boolean;
    leadLikeToasts: boolean;
  };

  emergencyStop: {
    enabled: boolean;
  };
}

export interface TelemetrySnapshot {
  timestamp: Date;
  system: {
    uptimePct: number;
    errorRatePct: number;
    p50ResponseMs: number;
    p95ResponseMs: number;
  };
  sessions: {
    active: number;
    startedLastHour: number;
    successRatePct: number;
    earlyExitRatePct: number;
  };
  tutoring: {
    avgHintsPerSession: number;
    avgStuckEvents: number;
    humanHandoffCount: number;
  };
  capacity: {
    tutorUtilizationPct: number;
  };
}

export interface OpsAlert {
  id: string;
  createdAt: Date;
  severity: AlertSeverity;
  category: AlertCategory;
  description: string;
  triggerMetrics: Record<string, number | string>;
  recommendedMitigations: string[];
  confidence: number;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface MitigationCatalogItem {
  id: string;
  name: string;
  description: string;
  type: MitigationType;
  actionKey: string;
  category: AlertCategory[];
  impactScope: "system" | "cohort" | "session";
  sideEffect: string;
  reversible: boolean;
  reversalMethod?: string;
  estimatedRecoveryMins?: number;
}

export type AlertBucket = "critical" | "quality_risk" | "capacity_risk" | "informational";

export type OpsActionType = 
  | "alert_created"
  | "mitigation_applied"
  | "mitigation_recommended"
  | "policy_changed"
  | "handoff_triggered"
  | "incident_opened"
  | "incident_closed"
  | "alert_acknowledged"
  | "alert_resolved"
  | "emergency_stop";

export interface OpsActionLog {
  id: string;
  timestamp: Date;
  actionType: OpsActionType;
  what: string;
  why: string;
  alternatives: { option: string; whyRejected: string }[];
  confidence: number;
  autonomyLevelAtTime: AutonomyLevel;
  actor: "ai" | "human";
  relatedIds: {
    alertId?: string;
    incidentId?: string;
    studentId?: string;
    handoffId?: string;
  };
}

export interface ContextPack {
  sessionSummary: string;
  lastAttempts: string[];
  whatWasTried: string[];
  recommendedTutorApproach: string;
}

export interface HumanHandoffCase {
  id: string;
  createdAt: Date;
  status: HandoffStatus;
  studentId: string;
  reason: HandoffReason;
  contextPack: ContextPack;
  slaTimerMins: number;
  assignedTo?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface OpsIntentNarrative {
  headline: string;
  protectingNow: string;
  whyNow: string[];
  stopConditions: string[];
}

export interface MitigationCooldown {
  mitigationId: string;
  appliedAt: Date;
  cooldownMins: number;
  expiresAt: Date;
}

export interface DecisionEpisode {
  id: string;
  incidentId?: string;
  startedAt: Date;
  endedAt?: Date;
  triggerAlert?: string;
  actions: OpsActionLog[];
  summary?: string;
}

export interface PolicyVersion {
  version: number;
  savedAt: Date;
  policy: OpsPolicy;
}

const STORAGE_KEYS = {
  POLICY: "ops_policy",
  POLICY_HISTORY: "ops_policy_history",
  TELEMETRY: "ops_telemetry",
  ALERTS: "ops_alerts",
  ACTION_LOG: "ops_action_log",
  HANDOFFS: "ops_handoffs",
  SIMULATOR_STATE: "ops_simulator_state"
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const MITIGATION_CATALOG: MitigationCatalogItem[] = [
  {
    id: "degrade_voice_mode",
    name: "Degrade Voice Mode",
    description: "Temporarily disable voice interactions to reduce server load",
    type: "safe",
    actionKey: "degrade_voice_mode",
    category: ["latency", "capacity_overload"],
    impactScope: "system",
    sideEffect: "Students use text-only mode until restored",
    reversible: true,
    reversalMethod: "Auto-restores when latency drops below threshold",
    estimatedRecoveryMins: 15
  },
  {
    id: "reduce_concurrency_10pct",
    name: "Reduce Concurrency 10%",
    description: "Reduce maximum concurrent sessions by 10% to stabilize performance",
    type: "safe",
    actionKey: "reduce_concurrency_10pct",
    category: ["latency", "capacity_overload", "errors"],
    impactScope: "system",
    sideEffect: "New students may wait in queue",
    reversible: true,
    reversalMethod: "Auto-restores after 15 minutes if metrics stable",
    estimatedRecoveryMins: 15
  },
  {
    id: "switch_lightweight_responses",
    name: "Switch to Lightweight Responses",
    description: "Use shorter, faster AI responses to reduce latency",
    type: "safe",
    actionKey: "switch_lightweight_responses",
    category: ["latency", "errors"],
    impactScope: "system",
    sideEffect: "Explanations become briefer",
    reversible: true,
    reversalMethod: "Auto-restores when latency normalizes",
    estimatedRecoveryMins: 10
  },
  {
    id: "pause_new_focus_sessions",
    name: "Pause New Focus Sessions",
    description: "Temporarily stop accepting new focus sessions",
    type: "major",
    actionKey: "pause_new_focus_sessions",
    category: ["capacity_overload", "errors"],
    impactScope: "system",
    sideEffect: "New students see 'busy' message",
    reversible: true,
    reversalMethod: "Manual resume required by admin",
    estimatedRecoveryMins: undefined
  },
  {
    id: "trigger_human_handoff",
    name: "Trigger Human Handoff",
    description: "Escalate student session to a human tutor",
    type: "safe",
    actionKey: "trigger_human_handoff",
    category: ["quality_drop", "handoff_needed"],
    impactScope: "session",
    sideEffect: "Student waits for human tutor availability",
    reversible: false
  },
  {
    id: "increase_hint_threshold",
    name: "Increase Hint Threshold",
    description: "Wait longer before offering hints to encourage independent thinking",
    type: "safe",
    actionKey: "increase_hint_threshold",
    category: ["quality_drop"],
    impactScope: "cohort",
    sideEffect: "Students spend more time before receiving guidance",
    reversible: true,
    reversalMethod: "Auto-reverts after session ends",
    estimatedRecoveryMins: 30
  },
  {
    id: "restart_session_state",
    name: "Restart Session State",
    description: "Clear stuck session state and restart from last checkpoint",
    type: "safe",
    actionKey: "restart_session_state",
    category: ["session_failures", "quality_drop"],
    impactScope: "session",
    sideEffect: "Student loses progress since last checkpoint",
    reversible: false
  },
  {
    id: "notify_on_call_admin",
    name: "Notify On-Call Admin",
    description: "Send urgent notification to on-call administrator",
    type: "major",
    actionKey: "notify_on_call_admin",
    category: ["errors", "capacity_overload"],
    impactScope: "system",
    sideEffect: "Admin receives alert via email/SMS",
    reversible: false
  }
];

export const getDefaultOpsPolicy = (): OpsPolicy => ({
  id: generateId(),
  version: 1,
  updatedAt: new Date(),
  updatedBy: "system",

  autonomy: {
    level: 1,
    confidenceThreshold: 70,
    requireApprovalForMajorActions: true
  },

  slaTargets: {
    p95ResponseMs: 2000,
    maxErrorRatePct: 5,
    minSessionSuccessPct: 85,
    maxTimeToHandoffMins: 15
  },

  loadGuardrails: {
    maxConcurrentSessions: 100,
    maxTutorUtilizationPct: 85,
    throttleStepPct: 10
  },

  learningQualityGuardrails: {
    maxStuckEventsPerSession: 3,
    maxHintsPerStep: 5,
    maxEarlyExitRatePct: 20
  },

  mitigationPermissions: {
    safeMitigationsEnabled: [
      "degrade_voice_mode",
      "reduce_concurrency_10pct",
      "switch_lightweight_responses",
      "trigger_human_handoff",
      "increase_hint_threshold",
      "restart_session_state"
    ],
    majorActionsRequireApproval: true
  },

  notifications: {
    enableInAppAlerts: true,
    leadLikeToasts: true
  },

  emergencyStop: {
    enabled: false
  }
});

export const getDefaultTelemetry = (): TelemetrySnapshot => ({
  timestamp: new Date(),
  system: {
    uptimePct: 99.8,
    errorRatePct: 0.5,
    p50ResponseMs: 450,
    p95ResponseMs: 1200
  },
  sessions: {
    active: 45,
    startedLastHour: 12,
    successRatePct: 92,
    earlyExitRatePct: 8
  },
  tutoring: {
    avgHintsPerSession: 2.3,
    avgStuckEvents: 0.4,
    humanHandoffCount: 2
  },
  capacity: {
    tutorUtilizationPct: 68
  }
});

export class OpsAgentStorage {
  loadPolicy(): OpsPolicy {
    const stored = localStorage.getItem(STORAGE_KEYS.POLICY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...parsed, updatedAt: new Date(parsed.updatedAt) };
      } catch {
        return getDefaultOpsPolicy();
      }
    }
    return getDefaultOpsPolicy();
  }

  savePolicy(policy: OpsPolicy, userId: string): OpsPolicy {
    const history = this.loadPolicyHistory();
    const currentPolicy = this.loadPolicy();

    if (history.length >= 5) {
      history.shift();
    }
    history.push({
      version: currentPolicy.version,
      savedAt: new Date(),
      policy: currentPolicy
    });
    localStorage.setItem(STORAGE_KEYS.POLICY_HISTORY, JSON.stringify(history));

    const updated: OpsPolicy = {
      ...policy,
      version: currentPolicy.version + 1,
      updatedAt: new Date(),
      updatedBy: userId
    };
    localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(updated));

    this.addActionLog({
      actionType: "policy_changed",
      what: `Policy updated to version ${updated.version}`,
      why: "User modified ops policy settings",
      alternatives: [],
      confidence: 100,
      autonomyLevelAtTime: updated.autonomy.level,
      actor: "human",
      relatedIds: {}
    });

    return updated;
  }

  loadPolicyHistory(): PolicyVersion[] {
    const stored = localStorage.getItem(STORAGE_KEYS.POLICY_HISTORY);
    if (stored) {
      try {
        return JSON.parse(stored).map((v: any) => ({
          ...v,
          savedAt: new Date(v.savedAt),
          policy: { ...v.policy, updatedAt: new Date(v.policy.updatedAt) }
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  restorePolicy(version: number): OpsPolicy | null {
    const history = this.loadPolicyHistory();
    const found = history.find(h => h.version === version);
    if (found) {
      localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(found.policy));
      return found.policy;
    }
    return null;
  }

  resetPolicyToDefault(userId: string): OpsPolicy {
    const defaultPolicy = getDefaultOpsPolicy();
    return this.savePolicy(defaultPolicy, userId);
  }

  loadTelemetry(): TelemetrySnapshot {
    const stored = localStorage.getItem(STORAGE_KEYS.TELEMETRY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...parsed, timestamp: new Date(parsed.timestamp) };
      } catch {
        return getDefaultTelemetry();
      }
    }
    return getDefaultTelemetry();
  }

  saveTelemetry(telemetry: TelemetrySnapshot): TelemetrySnapshot {
    const updated = { ...telemetry, timestamp: new Date() };
    localStorage.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(updated));
    return updated;
  }

  loadAlerts(): OpsAlert[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (stored) {
      try {
        return JSON.parse(stored).map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          acknowledgedAt: a.acknowledgedAt ? new Date(a.acknowledgedAt) : undefined,
          resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  saveAlert(alert: OpsAlert): OpsAlert {
    const alerts = this.loadAlerts();
    const existingIndex = alerts.findIndex(a => a.id === alert.id);
    if (existingIndex >= 0) {
      alerts[existingIndex] = alert;
    } else {
      alerts.unshift(alert);
    }
    if (alerts.length > 100) {
      alerts.pop();
    }
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    return alert;
  }

  createAlert(alertData: Omit<OpsAlert, "id" | "createdAt" | "status">): OpsAlert {
    const alert: OpsAlert = {
      ...alertData,
      id: generateId(),
      createdAt: new Date(),
      status: "open"
    };
    this.saveAlert(alert);

    this.addActionLog({
      actionType: "alert_created",
      what: `Alert created: ${alert.description}`,
      why: `Threshold breach detected - ${alert.category}`,
      alternatives: [],
      confidence: alert.confidence,
      autonomyLevelAtTime: this.loadPolicy().autonomy.level,
      actor: "ai",
      relatedIds: { alertId: alert.id }
    });

    return alert;
  }

  acknowledgeAlert(alertId: string, userId: string): OpsAlert | null {
    const alerts = this.loadAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.status = "acknowledged";
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    this.saveAlert(alert);

    this.addActionLog({
      actionType: "alert_acknowledged",
      what: `Alert acknowledged: ${alert.description}`,
      why: `Human acknowledged alert`,
      alternatives: [],
      confidence: 100,
      autonomyLevelAtTime: this.loadPolicy().autonomy.level,
      actor: "human",
      relatedIds: { alertId: alert.id }
    });

    return alert;
  }

  resolveAlert(alertId: string, userId: string, notes: string): OpsAlert | null {
    const alerts = this.loadAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.status = "resolved";
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = notes;
    this.saveAlert(alert);

    this.addActionLog({
      actionType: "alert_resolved",
      what: `Alert resolved: ${alert.description}`,
      why: notes || "Issue resolved",
      alternatives: [],
      confidence: 100,
      autonomyLevelAtTime: this.loadPolicy().autonomy.level,
      actor: "human",
      relatedIds: { alertId: alert.id }
    });

    return alert;
  }

  loadActionLog(): OpsActionLog[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTION_LOG);
    if (stored) {
      try {
        return JSON.parse(stored).map((l: any) => ({
          ...l,
          timestamp: new Date(l.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  addActionLog(entry: Omit<OpsActionLog, "id" | "timestamp">): OpsActionLog {
    const logs = this.loadActionLog();
    const newEntry: OpsActionLog = {
      ...entry,
      id: generateId(),
      timestamp: new Date()
    };
    logs.unshift(newEntry);
    if (logs.length > 200) {
      logs.pop();
    }
    localStorage.setItem(STORAGE_KEYS.ACTION_LOG, JSON.stringify(logs));
    return newEntry;
  }

  loadHandoffs(): HumanHandoffCase[] {
    const stored = localStorage.getItem(STORAGE_KEYS.HANDOFFS);
    if (stored) {
      try {
        return JSON.parse(stored).map((h: any) => ({
          ...h,
          createdAt: new Date(h.createdAt),
          assignedAt: h.assignedAt ? new Date(h.assignedAt) : undefined,
          resolvedAt: h.resolvedAt ? new Date(h.resolvedAt) : undefined
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  saveHandoff(handoff: HumanHandoffCase): HumanHandoffCase {
    const handoffs = this.loadHandoffs();
    const existingIndex = handoffs.findIndex(h => h.id === handoff.id);
    if (existingIndex >= 0) {
      handoffs[existingIndex] = handoff;
    } else {
      handoffs.unshift(handoff);
    }
    localStorage.setItem(STORAGE_KEYS.HANDOFFS, JSON.stringify(handoffs));
    return handoff;
  }

  createHandoff(handoffData: Omit<HumanHandoffCase, "id" | "createdAt" | "status">): HumanHandoffCase {
    const handoff: HumanHandoffCase = {
      ...handoffData,
      id: generateId(),
      createdAt: new Date(),
      status: "new"
    };
    this.saveHandoff(handoff);

    this.addActionLog({
      actionType: "handoff_triggered",
      what: `Handoff created for student ${handoff.studentId}`,
      why: `Reason: ${handoff.reason}`,
      alternatives: [],
      confidence: 85,
      autonomyLevelAtTime: this.loadPolicy().autonomy.level,
      actor: "ai",
      relatedIds: { handoffId: handoff.id, studentId: handoff.studentId }
    });

    return handoff;
  }

  assignHandoff(handoffId: string, assignee: string): HumanHandoffCase | null {
    const handoffs = this.loadHandoffs();
    const handoff = handoffs.find(h => h.id === handoffId);
    if (!handoff) return null;

    handoff.status = "assigned";
    handoff.assignedTo = assignee;
    handoff.assignedAt = new Date();
    this.saveHandoff(handoff);

    return handoff;
  }

  resolveHandoff(handoffId: string, notes: string): HumanHandoffCase | null {
    const handoffs = this.loadHandoffs();
    const handoff = handoffs.find(h => h.id === handoffId);
    if (!handoff) return null;

    handoff.status = "resolved";
    handoff.resolvedAt = new Date();
    handoff.resolutionNotes = notes;
    this.saveHandoff(handoff);

    return handoff;
  }

  setEmergencyStop(enabled: boolean, userId: string): void {
    const policy = this.loadPolicy();
    policy.emergencyStop.enabled = enabled;
    localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(policy));

    this.addActionLog({
      actionType: "emergency_stop",
      what: enabled ? "Emergency stop ACTIVATED" : "Emergency stop DEACTIVATED",
      why: enabled ? "User triggered emergency stop - all auto actions disabled" : "User deactivated emergency stop",
      alternatives: [],
      confidence: 100,
      autonomyLevelAtTime: policy.autonomy.level,
      actor: "human",
      relatedIds: {}
    });
  }

  getSimulatorState(): { running: boolean } {
    const stored = localStorage.getItem(STORAGE_KEYS.SIMULATOR_STATE);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { running: false };
      }
    }
    return { running: false };
  }

  setSimulatorState(running: boolean): void {
    localStorage.setItem(STORAGE_KEYS.SIMULATOR_STATE, JSON.stringify({ running }));
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
}

export const opsStorage = new OpsAgentStorage();

export function determineSystemState(
  policy: OpsPolicy,
  telemetry: TelemetrySnapshot,
  openAlerts: OpsAlert[]
): SystemState {
  const { slaTargets, loadGuardrails } = policy;
  const { system, capacity } = telemetry;

  const hasCriticalAlert = openAlerts.some(a => a.severity === "critical" && a.status !== "resolved");
  const hasHighAlert = openAlerts.some(a => a.severity === "high" && a.status !== "resolved");

  if (hasCriticalAlert || system.errorRatePct > slaTargets.maxErrorRatePct * 1.5 || 
      system.p95ResponseMs > slaTargets.p95ResponseMs * 1.5) {
    return "at_risk";
  }

  if (hasHighAlert || system.errorRatePct > slaTargets.maxErrorRatePct ||
      system.p95ResponseMs > slaTargets.p95ResponseMs ||
      capacity.tutorUtilizationPct > loadGuardrails.maxTutorUtilizationPct) {
    return "degraded";
  }

  return "stable";
}

export function getSystemStateLabel(state: SystemState): { label: string; color: string; description: string } {
  const labels: Record<SystemState, { label: string; color: string; description: string }> = {
    stable: { label: "Stable", color: "bg-green-100 text-green-800 border-green-300", description: "All systems healthy" },
    degraded: { label: "Degraded", color: "bg-yellow-100 text-yellow-800 border-yellow-300", description: "Some metrics outside targets" },
    at_risk: { label: "At Risk", color: "bg-red-100 text-red-800 border-red-300", description: "Immediate attention required" }
  };
  return labels[state];
}

export function generateIntentNarrative(
  policy: OpsPolicy, 
  telemetry: TelemetrySnapshot,
  openAlerts: OpsAlert[] = []
): OpsIntentNarrative {
  const { slaTargets, loadGuardrails, learningQualityGuardrails } = policy;
  const { system, sessions, capacity } = telemetry;

  const whyNow: string[] = [];
  const stopConditions: string[] = [];

  const systemState = determineSystemState(policy, telemetry, openAlerts);
  let protectingNow = "Ensuring smooth learning experiences for all active students";

  if (systemState === "at_risk") {
    protectingNow = "Preventing service disruption for students currently in sessions";
  } else if (systemState === "degraded") {
    protectingNow = "Restoring optimal learning conditions while maintaining session quality";
  }

  if (system.p95ResponseMs > slaTargets.p95ResponseMs * 0.8) {
    whyNow.push(`Response times rising - students may notice delays`);
    stopConditions.push("Pause mitigations when response times normalize");
  }

  if (system.errorRatePct > slaTargets.maxErrorRatePct * 0.5) {
    whyNow.push(`Error rate elevated - some students may experience issues`);
  }

  if (capacity.tutorUtilizationPct > loadGuardrails.maxTutorUtilizationPct * 0.9) {
    whyNow.push(`Approaching capacity limits - may need to queue new students`);
    stopConditions.push("Resume normal capacity when utilization drops");
  }

  if (sessions.earlyExitRatePct > learningQualityGuardrails.maxEarlyExitRatePct * 0.8) {
    whyNow.push(`More students leaving early than expected - investigating causes`);
  }

  if (whyNow.length === 0) {
    whyNow.push("All systems operating smoothly");
    whyNow.push("Watching for any emerging issues");
  }

  if (stopConditions.length === 0) {
    stopConditions.push("Continue standard monitoring");
  }

  const headline = `Keep learning smooth for ${sessions.active} active students`;

  return { headline, protectingNow, whyNow, stopConditions };
}

export function getPrimaryRecommendation(alerts: OpsAlert[]): { recommendation: string; alertId: string; confidence: number } | null {
  const openAlerts = alerts.filter(a => a.status !== "resolved");
  if (openAlerts.length === 0) return null;

  const sortedByPriority = [...openAlerts].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const topAlert = sortedByPriority[0];
  if (!topAlert.recommendedMitigations.length) {
    return {
      recommendation: `Review ${topAlert.category} alert: ${topAlert.description}`,
      alertId: topAlert.id,
      confidence: topAlert.confidence
    };
  }

  const mitigationId = topAlert.recommendedMitigations[0];
  const mitigation = MITIGATION_CATALOG.find(m => m.id === mitigationId);
  if (!mitigation) {
    return {
      recommendation: `Address ${topAlert.severity} ${topAlert.category} issue`,
      alertId: topAlert.id,
      confidence: topAlert.confidence
    };
  }

  const actionVerb = mitigation.type === "safe" ? "Apply" : "Consider";
  return {
    recommendation: `${actionVerb} "${mitigation.name}" to address ${topAlert.category} issue`,
    alertId: topAlert.id,
    confidence: topAlert.confidence
  };
}

const COOLDOWN_STORAGE_KEY = "ops_mitigation_cooldowns";
const DEFAULT_COOLDOWN_MINS = 10;

export function getMitigationCooldowns(): MitigationCooldown[] {
  const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored).map((c: any) => ({
        ...c,
        appliedAt: new Date(c.appliedAt),
        expiresAt: new Date(c.expiresAt)
      })).filter((c: MitigationCooldown) => new Date(c.expiresAt) > new Date());
    } catch {
      return [];
    }
  }
  return [];
}

export function addMitigationCooldown(mitigationId: string, cooldownMins = DEFAULT_COOLDOWN_MINS): MitigationCooldown {
  const cooldowns = getMitigationCooldowns();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cooldownMins * 60 * 1000);
  
  const newCooldown: MitigationCooldown = {
    mitigationId,
    appliedAt: now,
    cooldownMins,
    expiresAt
  };
  
  const existingIndex = cooldowns.findIndex(c => c.mitigationId === mitigationId);
  if (existingIndex >= 0) {
    cooldowns[existingIndex] = newCooldown;
  } else {
    cooldowns.push(newCooldown);
  }
  
  localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
  return newCooldown;
}

export function isMitigationOnCooldown(mitigationId: string): { onCooldown: boolean; remainingMins?: number } {
  const cooldowns = getMitigationCooldowns();
  const cooldown = cooldowns.find(c => c.mitigationId === mitigationId);
  
  if (!cooldown) return { onCooldown: false };
  
  const now = new Date();
  if (cooldown.expiresAt <= now) return { onCooldown: false };
  
  const remainingMs = cooldown.expiresAt.getTime() - now.getTime();
  const remainingMins = Math.ceil(remainingMs / 60000);
  
  return { onCooldown: true, remainingMins };
}

export function groupLogsIntoEpisodes(logs: OpsActionLog[]): DecisionEpisode[] {
  if (logs.length === 0) return [];

  const episodes: DecisionEpisode[] = [];
  let currentEpisode: DecisionEpisode | null = null;
  const EPISODE_GAP_MINS = 5;

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  for (const log of sortedLogs) {
    const logTime = new Date(log.timestamp);

    if (!currentEpisode) {
      currentEpisode = {
        id: log.relatedIds.incidentId || log.id,
        incidentId: log.relatedIds.incidentId,
        startedAt: logTime,
        triggerAlert: log.relatedIds.alertId,
        actions: [log]
      };
    } else {
      const episodeStart = new Date(currentEpisode.startedAt);
      const gapMs = episodeStart.getTime() - logTime.getTime();
      const gapMins = gapMs / 60000;

      if (gapMins > EPISODE_GAP_MINS || 
          (log.actionType === "incident_opened" || log.actionType === "alert_created")) {
        currentEpisode.summary = generateEpisodeSummary(currentEpisode);
        episodes.push(currentEpisode);
        
        currentEpisode = {
          id: log.relatedIds.incidentId || log.id,
          incidentId: log.relatedIds.incidentId,
          startedAt: logTime,
          triggerAlert: log.relatedIds.alertId,
          actions: [log]
        };
      } else {
        currentEpisode.actions.push(log);
        currentEpisode.startedAt = logTime;
        if (log.relatedIds.alertId && !currentEpisode.triggerAlert) {
          currentEpisode.triggerAlert = log.relatedIds.alertId;
        }
      }
    }
  }

  if (currentEpisode) {
    currentEpisode.summary = generateEpisodeSummary(currentEpisode);
    episodes.push(currentEpisode);
  }

  return episodes;
}

function generateEpisodeSummary(episode: DecisionEpisode): string {
  const actionCount = episode.actions.length;
  const mitigations = episode.actions.filter(a => a.actionType === "mitigation_applied");
  const alerts = episode.actions.filter(a => a.actionType === "alert_created");
  
  if (mitigations.length > 0 && alerts.length > 0) {
    return `Detected ${alerts.length} issue(s) and applied ${mitigations.length} fix(es)`;
  } else if (alerts.length > 0) {
    return `Detected ${alerts.length} issue(s) - awaiting resolution`;
  } else if (mitigations.length > 0) {
    return `Applied ${mitigations.length} mitigation(s)`;
  } else {
    return `${actionCount} action(s) recorded`;
  }
}

export function getHandoffGoal(reason: HandoffReason): string {
  const goals: Record<HandoffReason, string> = {
    stuck_loop: "Help the student regain confidence by finding a different approach that clicks for them",
    low_confidence: "Rebuild the student's belief in their ability to solve this type of problem",
    parent_request: "Address parent's specific concerns while maintaining the student's learning momentum",
    complex_topic: "Break down the concept in a way that connects with this student's existing knowledge",
    behavioral: "Re-engage the student and help them return to a productive learning mindset"
  };
  return goals[reason];
}

export function detectAnomalies(
  policy: OpsPolicy,
  telemetry: TelemetrySnapshot
): Omit<OpsAlert, "id" | "createdAt" | "status">[] {
  const alerts: Omit<OpsAlert, "id" | "createdAt" | "status">[] = [];
  const { slaTargets, loadGuardrails, learningQualityGuardrails } = policy;
  const { system, sessions, tutoring, capacity } = telemetry;

  if (system.p95ResponseMs > slaTargets.p95ResponseMs) {
    const severity: AlertSeverity = system.p95ResponseMs > slaTargets.p95ResponseMs * 1.5 ? "critical" : 
                                    system.p95ResponseMs > slaTargets.p95ResponseMs * 1.2 ? "high" : "medium";
    alerts.push({
      severity,
      category: "latency",
      description: `p95 response time ${system.p95ResponseMs}ms exceeds target ${slaTargets.p95ResponseMs}ms`,
      triggerMetrics: { p95ResponseMs: system.p95ResponseMs, target: slaTargets.p95ResponseMs },
      recommendedMitigations: ["switch_lightweight_responses", "degrade_voice_mode", "reduce_concurrency_10pct"],
      confidence: 90
    });
  }

  if (system.errorRatePct > slaTargets.maxErrorRatePct) {
    const severity: AlertSeverity = system.errorRatePct > slaTargets.maxErrorRatePct * 2 ? "critical" : "high";
    alerts.push({
      severity,
      category: "errors",
      description: `Error rate ${system.errorRatePct.toFixed(1)}% exceeds maximum ${slaTargets.maxErrorRatePct}%`,
      triggerMetrics: { errorRatePct: system.errorRatePct, maxErrorRatePct: slaTargets.maxErrorRatePct },
      recommendedMitigations: ["reduce_concurrency_10pct", "notify_on_call_admin"],
      confidence: 95
    });
  }

  if (sessions.successRatePct < slaTargets.minSessionSuccessPct) {
    alerts.push({
      severity: "high",
      category: "session_failures",
      description: `Session success rate ${sessions.successRatePct}% below minimum ${slaTargets.minSessionSuccessPct}%`,
      triggerMetrics: { successRatePct: sessions.successRatePct, minSessionSuccessPct: slaTargets.minSessionSuccessPct },
      recommendedMitigations: ["restart_session_state", "trigger_human_handoff"],
      confidence: 85
    });
  }

  if (capacity.tutorUtilizationPct > loadGuardrails.maxTutorUtilizationPct) {
    alerts.push({
      severity: "medium",
      category: "capacity_overload",
      description: `Tutor utilization ${capacity.tutorUtilizationPct}% exceeds maximum ${loadGuardrails.maxTutorUtilizationPct}%`,
      triggerMetrics: { tutorUtilizationPct: capacity.tutorUtilizationPct, maxTutorUtilizationPct: loadGuardrails.maxTutorUtilizationPct },
      recommendedMitigations: ["pause_new_focus_sessions", "reduce_concurrency_10pct"],
      confidence: 88
    });
  }

  if (sessions.earlyExitRatePct > learningQualityGuardrails.maxEarlyExitRatePct) {
    alerts.push({
      severity: "medium",
      category: "quality_drop",
      description: `Early exit rate ${sessions.earlyExitRatePct}% exceeds maximum ${learningQualityGuardrails.maxEarlyExitRatePct}%`,
      triggerMetrics: { earlyExitRatePct: sessions.earlyExitRatePct, maxEarlyExitRatePct: learningQualityGuardrails.maxEarlyExitRatePct },
      recommendedMitigations: ["increase_hint_threshold", "trigger_human_handoff"],
      confidence: 75
    });
  }

  if (tutoring.avgStuckEvents > learningQualityGuardrails.maxStuckEventsPerSession) {
    alerts.push({
      severity: "medium",
      category: "quality_drop",
      description: `Average stuck events ${tutoring.avgStuckEvents.toFixed(1)} per session exceeds limit ${learningQualityGuardrails.maxStuckEventsPerSession}`,
      triggerMetrics: { avgStuckEvents: tutoring.avgStuckEvents, maxStuckEventsPerSession: learningQualityGuardrails.maxStuckEventsPerSession },
      recommendedMitigations: ["restart_session_state", "trigger_human_handoff"],
      confidence: 80
    });
  }

  return alerts;
}

export function canAutoApplyMitigation(
  policy: OpsPolicy,
  mitigation: MitigationCatalogItem
): { allowed: boolean; reason: string } {
  if (policy.emergencyStop.enabled) {
    return { allowed: false, reason: "Emergency stop is active - no auto actions" };
  }

  const autonomyLevel = policy.autonomy.level;

  if (autonomyLevel === 0) {
    return { allowed: false, reason: "Level 0: Observe only - no auto actions" };
  }

  if (autonomyLevel === 1) {
    return { allowed: false, reason: "Level 1: Human must click to apply" };
  }

  if (mitigation.type === "major") {
    if (policy.mitigationPermissions.majorActionsRequireApproval) {
      return { allowed: false, reason: "Major action requires human approval" };
    }
    if (autonomyLevel < 3) {
      return { allowed: false, reason: "Major actions require autonomy level 3" };
    }
  }

  if (!policy.mitigationPermissions.safeMitigationsEnabled.includes(mitigation.id)) {
    return { allowed: false, reason: "Mitigation not in allowed list" };
  }

  if (autonomyLevel >= 2 && mitigation.type === "safe") {
    return { allowed: true, reason: "Level 2+: Safe mitigation auto-applied" };
  }

  if (autonomyLevel >= 3) {
    return { allowed: true, reason: "Level 3: Auto-applied with guardrails" };
  }

  return { allowed: false, reason: "Insufficient autonomy level" };
}

export function getAutonomyDescription(level: AutonomyLevel): { title: string; will: string[]; willNot: string[] } {
  const descriptions: Record<AutonomyLevel, { title: string; will: string[]; willNot: string[] }> = {
    0: {
      title: "OBSERVE ONLY",
      will: ["Monitor system health", "Detect anomalies", "Draft alert entries", "Recommend mitigations"],
      willNot: ["Apply any mitigations", "Change policies", "Escalate automatically", "Create handoffs"]
    },
    1: {
      title: "ASSISTED EXECUTION",
      will: ["All Level 0 capabilities", "Notify humans of issues", "Generate 'Apply' buttons", "Create handoff packs"],
      willNot: ["Auto-apply mitigations", "Change policies", "Assign handoffs automatically"]
    },
    2: {
      title: "SEMI-AUTONOMOUS",
      will: ["All Level 1 capabilities", "Auto-apply SAFE mitigations", "Notify human for each action"],
      willNot: ["Apply major actions without approval", "Change policies", "Trigger major state changes"]
    },
    3: {
      title: "AUTONOMOUS WITH GUARDRAILS",
      will: ["All Level 2 capabilities", "Apply mitigations per policy", "Throttle load automatically", "Open/close incidents", "Trigger handoffs"],
      willNot: ["Exceed policy guardrails", "Hide actions from logs", "Ignore confidence thresholds"]
    }
  };
  return descriptions[level];
}

export function categorizeAlertBucket(alert: OpsAlert): AlertBucket {
  if (alert.severity === "critical" || alert.category === "errors" || alert.category === "session_failures") {
    return "critical";
  }
  if (alert.category === "quality_drop" || alert.category === "handoff_needed") {
    return "quality_risk";
  }
  if (alert.category === "capacity_overload" || alert.category === "latency") {
    return "capacity_risk";
  }
  return "informational";
}

export function getBucketLabel(bucket: AlertBucket): { label: string; description: string; priority: number } {
  const buckets: Record<AlertBucket, { label: string; description: string; priority: number }> = {
    critical: { label: "Learning Blocked", description: "Students cannot continue - immediate action needed", priority: 1 },
    quality_risk: { label: "Quality Risk", description: "Students may be frustrated or stuck", priority: 2 },
    capacity_risk: { label: "Capacity Risk", description: "System strain - may affect future students", priority: 3 },
    informational: { label: "Informational", description: "Monitoring - no action required yet", priority: 4 }
  };
  return buckets[bucket];
}

export function generateHumanReadableLogSentence(log: OpsActionLog): string {
  const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const actor = log.actor === "ai" ? "Ops Agent" : "A human operator";
  const confidence = log.confidence ? ` Confidence: ${log.confidence}%.` : "";
  const autonomy = ` Autonomy: Level ${log.autonomyLevelAtTime}.`;
  
  switch (log.actionType) {
    case "mitigation_applied":
      return `At ${time}, ${actor} ${log.what.toLowerCase()}.${confidence}${autonomy}`;
    case "mitigation_recommended":
      return `At ${time}, ${actor} recommended: ${log.what.toLowerCase()}.${confidence}${autonomy}`;
    case "alert_created":
      return `At ${time}, ${actor} detected an issue: ${log.why.toLowerCase()}.${confidence}${autonomy}`;
    case "alert_acknowledged":
      return `At ${time}, ${actor} acknowledged: ${log.what.toLowerCase()}.${autonomy}`;
    case "alert_resolved":
      return `At ${time}, ${actor} resolved: ${log.what.toLowerCase()}. Reason: ${log.why}.${autonomy}`;
    case "handoff_triggered":
      return `At ${time}, ${actor} escalated a student case: ${log.what.toLowerCase()}.${confidence}${autonomy}`;
    case "policy_changed":
      return `At ${time}, ${actor} updated ops policy. ${log.why}.${autonomy}`;
    case "emergency_stop":
      return `At ${time}, ${actor} ${log.what.toLowerCase()}. ${log.why}.`;
    case "incident_opened":
      return `At ${time}, ${actor} opened an incident: ${log.what.toLowerCase()}.${confidence}${autonomy}`;
    case "incident_closed":
      return `At ${time}, ${actor} closed an incident: ${log.what.toLowerCase()}.${autonomy}`;
    default:
      return `At ${time}, ${actor}: ${log.what}.${confidence}${autonomy}`;
  }
}

export function getHandoffReasonExplanation(reason: HandoffReason): { whyNeeded: string; suggestedApproach: string } {
  const explanations: Record<HandoffReason, { whyNeeded: string; suggestedApproach: string }> = {
    stuck_loop: {
      whyNeeded: "The AI tutor detected the student is going in circles and needs a fresh perspective.",
      suggestedApproach: "Start with encouragement, then gently redirect the student's approach. Ask what they think is confusing them."
    },
    low_confidence: {
      whyNeeded: "The AI is uncertain how best to help this student and wants human judgment.",
      suggestedApproach: "Review the session context, then engage with open-ended questions to understand where the student is struggling."
    },
    parent_request: {
      whyNeeded: "A parent has requested direct communication about their child's progress.",
      suggestedApproach: "Contact the parent first, listen to their concerns, then follow up with the student as appropriate."
    },
    complex_topic: {
      whyNeeded: "The topic requires nuanced explanation that benefits from human expertise.",
      suggestedApproach: "Take time to understand the student's prior knowledge, then build understanding step by step."
    },
    behavioral: {
      whyNeeded: "The student's engagement patterns suggest they may need motivational support.",
      suggestedApproach: "Approach with empathy. Focus on building rapport before diving into content. Ask how they're feeling about learning."
    }
  };
  return explanations[reason];
}
