export type AutonomyLevel = 0 | 1 | 2 | 3;
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertCategory = "latency" | "errors" | "session_failures" | "quality_drop" | "capacity_overload" | "handoff_needed";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type MitigationType = "safe" | "major";
export type HandoffReason = "stuck_loop" | "low_confidence" | "parent_request" | "complex_topic" | "behavioral";
export type HandoffStatus = "new" | "assigned" | "in_progress" | "resolved";

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
}

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
  whyNow: string[];
  stopConditions: string[];
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
    category: ["latency", "capacity_overload"]
  },
  {
    id: "reduce_concurrency_10pct",
    name: "Reduce Concurrency 10%",
    description: "Reduce maximum concurrent sessions by 10% to stabilize performance",
    type: "safe",
    actionKey: "reduce_concurrency_10pct",
    category: ["latency", "capacity_overload", "errors"]
  },
  {
    id: "switch_lightweight_responses",
    name: "Switch to Lightweight Responses",
    description: "Use shorter, faster AI responses to reduce latency",
    type: "safe",
    actionKey: "switch_lightweight_responses",
    category: ["latency", "errors"]
  },
  {
    id: "pause_new_focus_sessions",
    name: "Pause New Focus Sessions",
    description: "Temporarily stop accepting new focus sessions",
    type: "major",
    actionKey: "pause_new_focus_sessions",
    category: ["capacity_overload", "errors"]
  },
  {
    id: "trigger_human_handoff",
    name: "Trigger Human Handoff",
    description: "Escalate student session to a human tutor",
    type: "safe",
    actionKey: "trigger_human_handoff",
    category: ["quality_drop", "handoff_needed"]
  },
  {
    id: "increase_hint_threshold",
    name: "Increase Hint Threshold",
    description: "Wait longer before offering hints to encourage independent thinking",
    type: "safe",
    actionKey: "increase_hint_threshold",
    category: ["quality_drop"]
  },
  {
    id: "restart_session_state",
    name: "Restart Session State",
    description: "Clear stuck session state and restart from last checkpoint",
    type: "safe",
    actionKey: "restart_session_state",
    category: ["session_failures", "quality_drop"]
  },
  {
    id: "notify_on_call_admin",
    name: "Notify On-Call Admin",
    description: "Send urgent notification to on-call administrator",
    type: "major",
    actionKey: "notify_on_call_admin",
    category: ["errors", "capacity_overload"]
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

export function generateIntentNarrative(policy: OpsPolicy, telemetry: TelemetrySnapshot): OpsIntentNarrative {
  const { slaTargets, loadGuardrails, learningQualityGuardrails } = policy;
  const { system, sessions, capacity } = telemetry;

  const whyNow: string[] = [];
  const stopConditions: string[] = [];

  if (system.p95ResponseMs > slaTargets.p95ResponseMs * 0.8) {
    whyNow.push(`p95 latency at ${system.p95ResponseMs}ms approaching ${slaTargets.p95ResponseMs}ms threshold`);
    stopConditions.push("Pause mitigations if latency drops below 80% of threshold");
  }

  if (system.errorRatePct > slaTargets.maxErrorRatePct * 0.5) {
    whyNow.push(`Error rate at ${system.errorRatePct.toFixed(1)}% - monitoring closely`);
  }

  if (capacity.tutorUtilizationPct > loadGuardrails.maxTutorUtilizationPct * 0.9) {
    whyNow.push(`Tutor utilization at ${capacity.tutorUtilizationPct}% - near capacity`);
    stopConditions.push("Throttle new sessions if utilization exceeds threshold");
  }

  if (sessions.earlyExitRatePct > learningQualityGuardrails.maxEarlyExitRatePct * 0.8) {
    whyNow.push(`Early exit rate at ${sessions.earlyExitRatePct}% - quality concern`);
  }

  if (whyNow.length === 0) {
    whyNow.push("All systems operating within normal parameters");
    whyNow.push("Monitoring for any emerging issues");
  }

  if (stopConditions.length === 0) {
    stopConditions.push("No active mitigations - standard monitoring in effect");
  }

  const headline = `Maintain ${slaTargets.minSessionSuccessPct}% session success and keep p95 latency under ${slaTargets.p95ResponseMs}ms while supporting up to ${loadGuardrails.maxConcurrentSessions} concurrent sessions.`;

  return { headline, whyNow, stopConditions };
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
