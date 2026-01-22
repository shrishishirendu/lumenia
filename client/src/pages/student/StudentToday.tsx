import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Send
} from "lucide-react";

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
  const [quickHelpInput, setQuickHelpInput] = useState("");

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

  const handleQuickHelp = () => {
    if (quickHelpInput.trim()) {
      setLocation(`/student/classroom?question=${encodeURIComponent(quickHelpInput)}`);
    } else {
      setLocation("/student/classroom");
    }
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
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="What do you need help with?"
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
    </div>
  );
}
