import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Nav } from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

interface TeachingPlan {
  id: number;
  subjectId: number;
  status: string;
  currentTopic?: {
    title: string;
  };
  subject?: {
    name: string;
    icon: string;
  };
  progress?: number;
}

interface SessionSummary {
  id: number;
  subject: string;
  topic: string;
  status: string;
  startedAt: string;
  problemsSolved: number;
}

interface ProgressData {
  id: number;
  subject: string;
  topic: string;
  masteryLevel: number;
  problemsAttempted: number;
  problemsCorrect: number;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [teachingPlans, setTeachingPlans] = useState<TeachingPlan[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, sessionsRes, progressRes] = await Promise.all([
        fetch("/api/student/teaching-plans"),
        fetch("/api/student/sessions"),
        fetch("/api/student/progress")
      ]);

      if (plansRes.ok) setTeachingPlans(await plansRes.json());
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
      if (progressRes.ok) setProgress(await progressRes.json());
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    }
    setLoading(false);
  };

  const totalProblemsAttempted = progress.reduce((sum, p) => sum + (p.problemsAttempted || 0), 0);
  const totalProblemsCorrect = progress.reduce((sum, p) => sum + (p.problemsCorrect || 0), 0);
  const overallAccuracy = totalProblemsAttempted > 0 
    ? Math.round((totalProblemsCorrect / totalProblemsAttempted) * 100) 
    : 0;

  const startLesson = (subject: string) => {
    setLocation(`/classroom?subject=${subject}`);
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      
      <main className="flex-1 md:ml-20 p-8 bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">My Learning</h1>
              <p className="text-muted-foreground mt-1">Pick up where you left off, or explore something new</p>
            </div>
            <Button onClick={() => startLesson("math")} className="gap-2" data-testid="button-start-lesson">
              <PlayCircle className="w-4 h-4" /> Focus Session
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-xs text-muted-foreground">Learning sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Practice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProblemsAttempted}</div>
                <p className="text-xs text-muted-foreground">Problems explored</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallAccuracy}%</div>
                <Progress value={overallAccuracy} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4" /> Skills Growing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {progress.filter(p => p.masteryLevel >= 80).length}
                </div>
                <p className="text-xs text-muted-foreground">Getting stronger</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Your active subjects and current topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => startLesson("math")}
                    data-testid="card-subject-math"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-xl">🔢</span>
                        </div>
                        <div>
                          <h3 className="font-medium">Mathematics</h3>
                          <p className="text-sm text-muted-foreground">Ms. Eleanor Chen</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Topic</span>
                        <span className="font-medium">Linear Equations</span>
                      </div>
                      <Progress value={65} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => startLesson("english")}
                    data-testid="card-subject-english"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <span className="text-xl">📚</span>
                        </div>
                        <div>
                          <h3 className="font-medium">English</h3>
                          <p className="text-sm text-muted-foreground">Mr. James Mitchell</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Topic</span>
                        <span className="font-medium">Essay Writing</span>
                      </div>
                      <Progress value={40} />
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your learning history</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sessions yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => startLesson("math")}
                    >
                      Start First Lesson
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map(session => (
                      <div key={session.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className={`w-2 h-2 rounded-full ${
                          session.subject === "math" ? "bg-blue-500" : "bg-emerald-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.startedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {session.problemsSolved} solved
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Journey</CardTitle>
              <CardDescription>Skills you're building</CardDescription>
            </CardHeader>
            <CardContent>
              {progress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start exploring to see your journey unfold</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress.map(p => (
                    <div key={p.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{p.topic}</span>
                        <Badge variant={p.masteryLevel >= 80 ? "default" : "secondary"}>
                          {p.masteryLevel >= 80 ? "Strong" : "Growing"}
                        </Badge>
                      </div>
                      <Progress value={p.masteryLevel} />
                      <p className="text-xs text-muted-foreground mt-2">
                        {p.problemsAttempted} problems explored
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
