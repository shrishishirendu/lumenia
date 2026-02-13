import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Play, 
  HelpCircle, 
  Target, 
  Calendar,
  Flame,
  Clock,
  BookOpen,
  ArrowRight,
  Send,
  Calculator,
  PenTool,
  Settings,
  GraduationCap,
  Sparkles,
  TrendingUp,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { featureFlags } from "@/config/featureFlags";

interface StudentMemoryData {
  lastSubject: string | null;
  lastTopicId: string | null;
  lastTopicName: string | null;
  streakCount: number;
  dailyGoalMinutes: number;
  todayMinutesCompleted: number;
  yearLevel: number;
  lastAccuracy?: number;
  previousAccuracy?: number;
  problemsCorrectToday?: number;
}

interface DashboardData {
  memory: StudentMemoryData | null;
  grade: number;
  hasWarmupQuestions: boolean;
  nextSession: { subject: string; topic: string; scheduledAt: string } | null;
}

interface GradeTopicInfo {
  id: number;
  title: string;
  description: string | null;
  gradeLevel: number;
  orderIndex: number;
  lessonCount: number;
}

const SESSION_FLAG_KEY = "lumenia_session_started";
const CLOSURE_SHOWN_KEY = "lumenia_closure_shown";

function getImprovementSentence(memory: StudentMemoryData | null): string {
  if (!memory) {
    return "You're building momentum — let's take the next step.";
  }

  const { lastAccuracy, previousAccuracy, streakCount, problemsCorrectToday } = memory;

  if (lastAccuracy && previousAccuracy && lastAccuracy > previousAccuracy) {
    const topic = memory.lastTopicName || "recent topics";
    return `You're getting more accurate on ${topic}.`;
  }

  if (streakCount >= 3) {
    return "Great consistency this week — keep the rhythm going.";
  }

  if (problemsCorrectToday && problemsCorrectToday > 5) {
    return `Nice work today — you've solved ${problemsCorrectToday} problems correctly.`;
  }

  if (streakCount > 0) {
    return `You're on day ${streakCount} of your learning streak — keep going!`;
  }

  return "You're building momentum — let's take the next step.";
}

function getClosureMessage(memory: StudentMemoryData | null): string {
  const topic = memory?.lastTopicName || "that topic";
  
  const messages = [
    `You handled ${topic} better today.`,
    "That was challenging — and you stayed with it.",
    "Good effort today. Every session counts.",
    "You showed up and did the work. That's what matters."
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function StudentToday() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quickHelpInput, setQuickHelpInput] = useState("");
  const [quickHelpSubject, setQuickHelpSubject] = useState<"math" | "english">("math");
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoalMinutes, setNewGoalMinutes] = useState("15");
  const [showClosure, setShowClosure] = useState(false);
  const [closureMessage, setClosureMessage] = useState("");

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/student/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/student/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    }
  });

  const memory = dashboardData?.memory;
  const studentGrade = dashboardData?.grade || 9;

  const lastSubjectSlug = memory?.lastSubject || "math";
  const subjectIdForLookup = lastSubjectSlug.includes("math") ? 1 : 2;

  const { data: gradeTopics, isLoading: topicsLoading } = useQuery<GradeTopicInfo[]>({
    queryKey: ["/api/topics/by-grade", studentGrade, subjectIdForLookup],
    queryFn: async () => {
      const res = await fetch(`/api/topics/by-grade?grade=${studentGrade}&subjectId=${subjectIdForLookup}`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.topics || [];
    },
    enabled: !!dashboardData,
  });

  const resolveTopicRoute = (subjectSlug: string): string | null => {
    const topicName = memory?.lastTopicName;
    const topicSlugFromMemory = memory?.lastTopicId;
    if (!topicName && !topicSlugFromMemory) return null;

    const topics = gradeTopics || [];
    if (topics.length === 0) return null;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    let matched: GradeTopicInfo | undefined;
    if (topicName) {
      matched = topics.find(t => normalize(t.title) === normalize(topicName));
    }
    if (!matched && topicSlugFromMemory) {
      matched = topics.find(t => normalize(t.title) === normalize(decodeURIComponent(topicSlugFromMemory)));
    }
    if (!matched && topicName) {
      matched = topics.find(t => normalize(t.title).includes(normalize(topicName)) || normalize(topicName).includes(normalize(t.title)));
    }

    if (!matched && topics.length > 0) {
      matched = topics[0];
    }

    if (matched) {
      const topicParam = encodeURIComponent(matched.title);
      return `/student/session/${subjectSlug}/${topicParam}?year=${studentGrade}&topicId=${matched.id}`;
    }

    return null;
  };
  const streakCount = memory?.streakCount || 0;
  const dailyGoalMinutes = memory?.dailyGoalMinutes || 15;
  const todayMinutesCompleted = memory?.todayMinutesCompleted || 0;
  const progressPercent = Math.min((todayMinutesCompleted / dailyGoalMinutes) * 100, 100);
  const minutesRemaining = Math.max(dailyGoalMinutes - todayMinutesCompleted, 0);

  useEffect(() => {
    const sessionStarted = localStorage.getItem(SESSION_FLAG_KEY);
    const closureShown = localStorage.getItem(CLOSURE_SHOWN_KEY);
    
    if (sessionStarted && !closureShown) {
      setClosureMessage(getClosureMessage(memory ?? null));
      setShowClosure(true);
      localStorage.removeItem(SESSION_FLAG_KEY);
      localStorage.setItem(CLOSURE_SHOWN_KEY, "true");
      
      setTimeout(() => {
        setShowClosure(false);
        localStorage.removeItem(CLOSURE_SHOWN_KEY);
      }, 5000);
    }
  }, [memory]);

  const handleStartTodaysSession = () => {
    localStorage.setItem(SESSION_FLAG_KEY, "true");
    localStorage.removeItem(CLOSURE_SHOWN_KEY);

    const subject = memory?.lastSubject || "math";
    const resolvedRoute = resolveTopicRoute(subject);

    if (resolvedRoute) {
      setLocation(resolvedRoute);
    } else {
      setLocation(`/student/session/${subject}/warmup?year=${studentGrade}`);
    }
  };

  const handleStartWarmup = () => {
    localStorage.setItem(SESSION_FLAG_KEY, "true");
    localStorage.removeItem(CLOSURE_SHOWN_KEY);
    const subject = memory?.lastSubject || "math";
    setLocation(`/student/session/${subject}/warmup?year=${studentGrade}`);
  };

  const handleContinueLearning = () => {
    localStorage.setItem(SESSION_FLAG_KEY, "true");
    localStorage.removeItem(CLOSURE_SHOWN_KEY);

    const subject = memory?.lastSubject || "math";
    const resolvedRoute = resolveTopicRoute(subject);

    if (resolvedRoute) {
      setLocation(resolvedRoute);
    } else {
      setLocation(`/student/session/${subject}/warmup?year=${studentGrade}`);
    }
  };

  const updateGoalMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const res = await apiRequest("POST", "/api/student/goal", { dailyGoalMinutes: minutes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      setShowGoalDialog(false);
    }
  });

  const handleQuickHelp = () => {
    const subjectParam = `subject=${quickHelpSubject}&year=${studentGrade}`;
    if (quickHelpInput.trim()) {
      setLocation(`/student/classroom?${subjectParam}&question=${encodeURIComponent(quickHelpInput)}`);
    } else {
      setLocation(`/student/classroom?${subjectParam}`);
    }
  };

  const handleSaveGoal = () => {
    const minutes = parseInt(newGoalMinutes) || 15;
    updateGoalMutation.mutate(minutes);
  };

  const handleBookSession = () => {
    setLocation("/student/practice");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTopic = memory?.lastTopicName || "Continue your learning";
  const currentSubject = memory?.lastSubject || "math";
  const improvementSentence = getImprovementSentence(memory ?? null);

  const shouldSuggestPractice = 
    (memory?.lastAccuracy !== undefined && memory.lastAccuracy < 70) ||
    (memory?.problemsCorrectToday !== undefined && memory.problemsCorrectToday === 0);

  if (featureFlags.simpleStudentToday) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8" data-testid="student-today-page">
        <AnimatePresence>
          {showClosure && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 shadow-lg flex items-center gap-3"
              data-testid="closure-message"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-800 font-medium">{closureMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground capitalize" data-testid="simple-context">
            {currentSubject} · {currentTopic}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <Button
            size="lg"
            onClick={handleStartTodaysSession}
            className="w-full gap-2 py-6 text-lg shadow-md"
            data-testid="simple-continue-btn"
          >
            <Play className="w-5 h-5" />
            Continue today's learning
          </Button>
        </motion.div>

        {shouldSuggestPractice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/student/practice")}
              className="w-full gap-2"
              data-testid="simple-practice-btn"
            >
              <Target className="w-4 h-4" />
              Practice recommended
            </Button>
          </motion.div>
        )}

        <p className="text-sm text-muted-foreground text-center" data-testid="simple-reassurance">
          You're on track for today.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6" data-testid="student-today-page">
      <AnimatePresence>
        {showClosure && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 shadow-lg flex items-center gap-3"
            data-testid="closure-message"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-800 font-medium">{closureMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-2xl p-6 shadow-sm"
        data-testid="todays-focus-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Today's Focus</h2>
              <div className="flex items-center gap-2 ml-2 bg-muted rounded-lg px-2 py-1">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium" data-testid="year-display">Year {studentGrade}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xl font-medium text-foreground capitalize">
                {currentSubject}: {currentTopic}
              </p>
              <p className="text-sm text-muted-foreground">
                Goal: Complete a focused session and build understanding
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-muted-foreground">{improvementSentence}</span>
            </div>
          </div>

          <Button 
            size="lg"
            onClick={handleStartTodaysSession}
            className="sm:self-center gap-2 shadow-md"
            data-testid="start-today-session-btn"
          >
            <Play className="w-4 h-4" />
            Start today's session
          </Button>
        </div>
      </motion.div>

      <div className="bg-muted/30 rounded-xl p-4 border border-muted">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          What's next
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={handleStartWarmup}
            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-muted hover:border-primary/30 transition-colors text-left group"
            data-testid="whats-next-warmup"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Quick warm-up</p>
              <p className="text-xs text-muted-foreground">2-3 min review</p>
            </div>
          </button>
          
          <button 
            onClick={() => setLocation("/student/subjects")}
            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-muted hover:border-primary/30 transition-colors text-left group"
            data-testid="whats-next-subjects"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">My Subjects</p>
              <p className="text-xs text-muted-foreground">Browse courses &amp; units</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-purple-100 bg-purple-50/30 hover:shadow-sm transition-shadow" data-testid="quick-help-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center">
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Ask Mentora</CardTitle>
                <CardDescription className="text-xs">Get help anytime</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={quickHelpSubject === "math" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickHelpSubject("math")}
                className={`text-xs ${quickHelpSubject === "math" ? "bg-purple-500 hover:bg-purple-600" : ""}`}
                data-testid="quick-help-math-btn"
              >
                <Calculator className="h-3 w-3 mr-1" />
                Maths
              </Button>
              <Button
                variant={quickHelpSubject === "english" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickHelpSubject("english")}
                className={`text-xs ${quickHelpSubject === "english" ? "bg-purple-500 hover:bg-purple-600" : ""}`}
                data-testid="quick-help-english-btn"
              >
                <PenTool className="h-3 w-3 mr-1" />
                English
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Ask about ${quickHelpSubject === "math" ? "maths" : "English"}...`}
                value={quickHelpInput}
                onChange={(e) => setQuickHelpInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickHelp()}
                className="flex-1 text-sm"
                data-testid="quick-help-input"
              />
              <Button onClick={handleQuickHelp} size="sm" className="bg-purple-500 hover:bg-purple-600" data-testid="quick-help-btn">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-100 bg-green-50/30" data-testid="daily-goal-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Daily Goal</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Flame className={`h-3 w-3 ${streakCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                  {streakCount > 0 ? `${streakCount} day streak` : "Start your streak!"}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => {
                  setNewGoalMinutes(dailyGoalMinutes.toString());
                  setShowGoalDialog(true);
                }}
                data-testid="edit-goal-btn"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{todayMinutesCompleted} / {dailyGoalMinutes} min</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              {minutesRemaining > 0 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {minutesRemaining} minutes to reach today's goal
                </p>
              ) : (
                <p className="text-xs text-green-600 font-medium">
                  Goal reached! Great work today!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-100 bg-slate-50/30" data-testid="next-session-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-400 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Upcoming Session</CardTitle>
              <CardDescription className="text-xs">
                {dashboardData?.nextSession 
                  ? `${dashboardData.nextSession.subject} - ${dashboardData.nextSession.topic}`
                  : "No session scheduled"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData?.nextSession ? (
            <p className="text-sm text-muted-foreground">
              Scheduled for {new Date(dashboardData.nextSession.scheduledAt).toLocaleDateString()}
            </p>
          ) : (
            <Button variant="outline" size="sm" onClick={handleBookSession} className="w-full" data-testid="book-session-btn">
              <Calendar className="mr-2 h-4 w-4" />
              Book a Session
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md" data-testid="goal-settings-dialog">
          <DialogHeader>
            <DialogTitle>Set Your Daily Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Choose how many minutes you'd like to learn each day. Consistent practice builds stronger skills!
            </p>
            <RadioGroup
              value={newGoalMinutes}
              onValueChange={setNewGoalMinutes}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="10" id="goal-10" className="peer sr-only" />
                <Label
                  htmlFor="goal-10"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer"
                >
                  <span className="text-2xl font-bold">10</span>
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <span className="text-xs text-muted-foreground mt-1">Quick session</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="15" id="goal-15" className="peer sr-only" />
                <Label
                  htmlFor="goal-15"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer"
                >
                  <span className="text-2xl font-bold">15</span>
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <span className="text-xs text-muted-foreground mt-1">Recommended</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="20" id="goal-20" className="peer sr-only" />
                <Label
                  htmlFor="goal-20"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer"
                >
                  <span className="text-2xl font-bold">20</span>
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <span className="text-xs text-muted-foreground mt-1">Focused</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="30" id="goal-30" className="peer sr-only" />
                <Label
                  htmlFor="goal-30"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer"
                >
                  <span className="text-2xl font-bold">30</span>
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <span className="text-xs text-muted-foreground mt-1">Deep learning</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGoal} 
              className="bg-green-500 hover:bg-green-600"
              disabled={updateGoalMutation.isPending}
              data-testid="save-goal-btn"
            >
              {updateGoalMutation.isPending ? "Saving..." : "Save Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
