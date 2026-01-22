import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StudentMemoryData {
  lastSubject: string | null;
  lastTopicId: string | null;
  lastTopicName: string | null;
  streakCount: number;
  dailyGoalMinutes: number;
  todayMinutesCompleted: number;
}

interface DashboardData {
  memory: StudentMemoryData | null;
  hasWarmupQuestions: boolean;
  nextSession: { subject: string; topic: string; scheduledAt: string } | null;
}

export default function StudentToday() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [quickHelpInput, setQuickHelpInput] = useState("");
  const [quickHelpSubject, setQuickHelpSubject] = useState<"math" | "english">("math");
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoalMinutes, setNewGoalMinutes] = useState("15");

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/student/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    }
  });

  const memory = dashboardData?.memory;
  const streakCount = memory?.streakCount || 0;
  const dailyGoalMinutes = memory?.dailyGoalMinutes || 15;
  const todayMinutesCompleted = memory?.todayMinutesCompleted || 0;
  const progressPercent = Math.min((todayMinutesCompleted / dailyGoalMinutes) * 100, 100);
  const minutesRemaining = Math.max(dailyGoalMinutes - todayMinutesCompleted, 0);

  const handleStartWarmup = () => {
    const subject = memory?.lastSubject || "math";
    setLocation(`/student/session/${subject}/warmup`);
  };

  const handleContinueLearning = () => {
    const subject = memory?.lastSubject || "math";
    const topic = memory?.lastTopicId || "linear_equations";
    setLocation(`/student/session/${subject}/${topic}`);
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
    const subjectParam = `subject=${quickHelpSubject}`;
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
    setLocation("/student/classroom");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="student-today-page">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">
          {streakCount > 0 
            ? `You're on a ${streakCount}-day streak! Keep it going.`
            : "Ready to learn something new today?"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-amber-200 bg-amber-50/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartWarmup} data-testid="warmup-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Warm-up Quiz</CardTitle>
                <CardDescription>2-3 min</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Quick review of concepts from your last session
            </p>
            <Button className="w-full bg-amber-500 hover:bg-amber-600" data-testid="start-warmup-btn">
              <Zap className="mr-2 h-4 w-4" />
              Start Warm-up
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleContinueLearning} data-testid="continue-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Continue Learning</CardTitle>
                <CardDescription>
                  {memory?.lastTopicName || "Start a new topic"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground capitalize">
                {memory?.lastSubject || "Mathematics"}
              </span>
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" data-testid="continue-btn">
              <ArrowRight className="mr-2 h-4 w-4" />
              Resume Session
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50/50" data-testid="quick-help-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Quick Help</CardTitle>
                <CardDescription>Ask a question anytime</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={quickHelpSubject === "math" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickHelpSubject("math")}
                className={quickHelpSubject === "math" ? "bg-purple-500 hover:bg-purple-600" : ""}
                data-testid="quick-help-math-btn"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Maths
              </Button>
              <Button
                variant={quickHelpSubject === "english" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickHelpSubject("english")}
                className={quickHelpSubject === "english" ? "bg-purple-500 hover:bg-purple-600" : ""}
                data-testid="quick-help-english-btn"
              >
                <PenTool className="h-4 w-4 mr-1" />
                English
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Ask about ${quickHelpSubject === "math" ? "maths" : "English"}...`}
                value={quickHelpInput}
                onChange={(e) => setQuickHelpInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickHelp()}
                className="flex-1"
                data-testid="quick-help-input"
              />
              <Button onClick={handleQuickHelp} className="bg-purple-500 hover:bg-purple-600" data-testid="quick-help-btn">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50/50" data-testid="daily-goal-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Daily Goal</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Flame className={`h-4 w-4 ${streakCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                  {streakCount > 0 ? `${streakCount} day streak` : "Start your streak!"}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
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
                <span className="text-muted-foreground">{todayMinutesCompleted} / {dailyGoalMinutes} minutes</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              {minutesRemaining > 0 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {minutesRemaining} minutes away from today's goal
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

      <Card className="border border-slate-200" data-testid="next-session-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Next Scheduled Session</CardTitle>
              <CardDescription>
                {dashboardData?.nextSession 
                  ? `${dashboardData.nextSession.subject} - ${dashboardData.nextSession.topic}`
                  : "No session booked"}
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
            <Button variant="outline" onClick={handleBookSession} className="w-full" data-testid="book-session-btn">
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
