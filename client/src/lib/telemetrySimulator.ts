import {
  type TelemetrySnapshot,
  type OpsPolicy,
  type OpsAlert,
  type HumanHandoffCase,
  getDefaultTelemetry,
  detectAnomalies,
  opsStorage
} from "./opsAgentModels";

type IncidentType = "latency_spike" | "error_spike" | "capacity_overload" | "quality_drop";

const STUDENT_IDS = ["STU-001", "STU-002", "STU-003", "STU-004", "STU-005"];

function randomVariation(base: number, variance: number): number {
  return base + (Math.random() - 0.5) * 2 * variance;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateTelemetryTick(current: TelemetrySnapshot): TelemetrySnapshot {
  const newTelemetry: TelemetrySnapshot = {
    timestamp: new Date(),
    system: {
      uptimePct: clamp(randomVariation(current.system.uptimePct, 0.5), 95, 100),
      errorRatePct: clamp(randomVariation(current.system.errorRatePct, 0.3), 0, 15),
      p50ResponseMs: clamp(randomVariation(current.system.p50ResponseMs, 50), 200, 2000),
      p95ResponseMs: clamp(randomVariation(current.system.p95ResponseMs, 100), 500, 5000)
    },
    sessions: {
      active: clamp(Math.round(randomVariation(current.sessions.active, 5)), 0, 150),
      startedLastHour: clamp(Math.round(randomVariation(current.sessions.startedLastHour, 3)), 0, 50),
      successRatePct: clamp(randomVariation(current.sessions.successRatePct, 3), 50, 100),
      earlyExitRatePct: clamp(randomVariation(current.sessions.earlyExitRatePct, 2), 0, 40)
    },
    tutoring: {
      avgHintsPerSession: clamp(randomVariation(current.tutoring.avgHintsPerSession, 0.3), 0, 10),
      avgStuckEvents: clamp(randomVariation(current.tutoring.avgStuckEvents, 0.2), 0, 5),
      humanHandoffCount: clamp(Math.round(randomVariation(current.tutoring.humanHandoffCount, 1)), 0, 20)
    },
    capacity: {
      tutorUtilizationPct: clamp(randomVariation(current.capacity.tutorUtilizationPct, 5), 0, 100)
    }
  };

  return newTelemetry;
}

export function injectIncident(
  current: TelemetrySnapshot,
  incidentType: IncidentType
): TelemetrySnapshot {
  const injected = { ...current, timestamp: new Date() };

  switch (incidentType) {
    case "latency_spike":
      injected.system = {
        ...injected.system,
        p50ResponseMs: injected.system.p50ResponseMs * 2,
        p95ResponseMs: injected.system.p95ResponseMs * 2.5
      };
      break;
    case "error_spike":
      injected.system = {
        ...injected.system,
        errorRatePct: Math.min(injected.system.errorRatePct + 8, 20),
        uptimePct: Math.max(injected.system.uptimePct - 3, 90)
      };
      break;
    case "capacity_overload":
      injected.sessions = {
        ...injected.sessions,
        active: injected.sessions.active + 30
      };
      injected.capacity = {
        tutorUtilizationPct: Math.min(injected.capacity.tutorUtilizationPct + 25, 100)
      };
      break;
    case "quality_drop":
      injected.sessions = {
        ...injected.sessions,
        successRatePct: Math.max(injected.sessions.successRatePct - 15, 60),
        earlyExitRatePct: Math.min(injected.sessions.earlyExitRatePct + 12, 40)
      };
      injected.tutoring = {
        ...injected.tutoring,
        avgStuckEvents: injected.tutoring.avgStuckEvents + 2,
        avgHintsPerSession: injected.tutoring.avgHintsPerSession + 3
      };
      break;
  }

  return injected;
}

export function processAlertsFromTelemetry(
  policy: OpsPolicy,
  telemetry: TelemetrySnapshot
): OpsAlert[] {
  const existingAlerts = opsStorage.loadAlerts();
  const openAlerts = existingAlerts.filter(a => a.status === "open");
  
  const newAnomalies = detectAnomalies(policy, telemetry);
  const createdAlerts: OpsAlert[] = [];

  for (const anomaly of newAnomalies) {
    const existingOpenAlert = openAlerts.find(
      a => a.category === anomaly.category && a.status === "open"
    );
    
    if (!existingOpenAlert) {
      const alert = opsStorage.createAlert(anomaly);
      createdAlerts.push(alert);
    }
  }

  return createdAlerts;
}

export function generateMockHandoff(): Omit<HumanHandoffCase, "id" | "createdAt" | "status"> {
  const reasons: Array<HumanHandoffCase["reason"]> = [
    "stuck_loop",
    "low_confidence",
    "parent_request",
    "complex_topic",
    "behavioral"
  ];

  const studentId = STUDENT_IDS[Math.floor(Math.random() * STUDENT_IDS.length)];
  const reason = reasons[Math.floor(Math.random() * reasons.length)];

  const contextPacks: Record<string, { sessionSummary: string; lastAttempts: string[]; whatWasTried: string[]; recommendedTutorApproach: string }> = {
    stuck_loop: {
      sessionSummary: "Student repeatedly attempting same problem type with similar errors",
      lastAttempts: [
        "Tried factoring quadratic equation - incorrect sign",
        "Retried with same approach - same error",
        "Third attempt still showing conceptual gap"
      ],
      whatWasTried: ["Provided step-by-step hints", "Showed similar worked example", "Simplified problem"],
      recommendedTutorApproach: "Focus on sign rules in factoring. Student may have fundamental misconception about negative numbers."
    },
    low_confidence: {
      sessionSummary: "AI confidence dropped below threshold on multiple responses",
      lastAttempts: [
        "Student asked question about advanced topic",
        "AI provided uncertain response",
        "Follow-up question exceeded training scope"
      ],
      whatWasTried: ["Attempted simpler explanation", "Offered to break down concept"],
      recommendedTutorApproach: "Student exploring edge cases. Expert guidance needed on this advanced topic."
    },
    parent_request: {
      sessionSummary: "Parent requested human tutor involvement",
      lastAttempts: ["Normal session progression", "Parent submitted support request"],
      whatWasTried: ["AI tutoring was proceeding normally"],
      recommendedTutorApproach: "Parent may have concerns about AI tutoring. Reassure and demonstrate value."
    },
    complex_topic: {
      sessionSummary: "Topic complexity exceeds optimal AI tutoring scope",
      lastAttempts: [
        "Student working on multi-step proof",
        "Required creative problem-solving approach",
        "Standard scaffolding insufficient"
      ],
      whatWasTried: ["Provided structured hints", "Broke into sub-problems"],
      recommendedTutorApproach: "Advanced proof-writing skills needed. Human tutor can model mathematical thinking."
    },
    behavioral: {
      sessionSummary: "Detected potential frustration or disengagement",
      lastAttempts: [
        "Response times increasing",
        "Short/dismissive responses",
        "Multiple session pauses"
      ],
      whatWasTried: ["Offered encouragement", "Suggested break", "Changed topic pace"],
      recommendedTutorApproach: "Student may need motivational support. Focus on building confidence before content."
    }
  };

  return {
    studentId,
    reason,
    contextPack: contextPacks[reason],
    slaTimerMins: 15
  };
}

let simulatorInterval: NodeJS.Timeout | null = null;
let tickCallbacks: Array<(telemetry: TelemetrySnapshot, alerts: OpsAlert[]) => void> = [];

export function startSimulator(
  intervalMs: number = 20000,
  onTick?: (telemetry: TelemetrySnapshot, alerts: OpsAlert[]) => void
): void {
  if (simulatorInterval) {
    stopSimulator();
  }

  if (onTick) {
    tickCallbacks.push(onTick);
  }

  opsStorage.setSimulatorState(true);

  simulatorInterval = setInterval(() => {
    const policy = opsStorage.loadPolicy();
    
    if (policy.emergencyStop.enabled) {
      return;
    }

    const currentTelemetry = opsStorage.loadTelemetry();
    const newTelemetry = generateTelemetryTick(currentTelemetry);
    opsStorage.saveTelemetry(newTelemetry);

    const newAlerts = processAlertsFromTelemetry(policy, newTelemetry);

    tickCallbacks.forEach(cb => cb(newTelemetry, newAlerts));
  }, intervalMs);
}

export function stopSimulator(): void {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
  opsStorage.setSimulatorState(false);
  tickCallbacks = [];
}

export function isSimulatorRunning(): boolean {
  return simulatorInterval !== null;
}

export function registerTickCallback(
  callback: (telemetry: TelemetrySnapshot, alerts: OpsAlert[]) => void
): () => void {
  tickCallbacks.push(callback);
  return () => {
    tickCallbacks = tickCallbacks.filter(cb => cb !== callback);
  };
}

export function triggerManualTick(): { telemetry: TelemetrySnapshot; alerts: OpsAlert[] } {
  const policy = opsStorage.loadPolicy();
  const currentTelemetry = opsStorage.loadTelemetry();
  const newTelemetry = generateTelemetryTick(currentTelemetry);
  opsStorage.saveTelemetry(newTelemetry);

  const newAlerts = processAlertsFromTelemetry(policy, newTelemetry);

  tickCallbacks.forEach(cb => cb(newTelemetry, newAlerts));

  return { telemetry: newTelemetry, alerts: newAlerts };
}

export function resetTelemetryToBaseline(): TelemetrySnapshot {
  const baseline = getDefaultTelemetry();
  opsStorage.saveTelemetry(baseline);
  return baseline;
}
