import { useRoute, Link } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, User, GraduationCap, Calendar, Clock, 
  TrendingUp, AlertTriangle, MessageSquare, CreditCard,
  BookOpen, Target, Activity
} from "lucide-react";

const mockStudent = {
  id: "1",
  name: "Emma Wilson",
  email: "emma.wilson@example.com",
  grade: 10,
  enrolledSubjects: ["Mathematics", "English"],
  parentEmail: "parent.wilson@example.com",
  joinedAt: "2024-09-15",
  totalSessions: 47,
  totalHours: 23.5,
  avgMastery: 72,
  status: "active",
};

const mockActivity = [
  { id: "1", type: "session", title: "Linear Equations Practice", subject: "Mathematics", date: "Today, 3:45 PM", duration: "35 min" },
  { id: "2", type: "quiz", title: "Algebra Quiz - Score: 85%", subject: "Mathematics", date: "Yesterday", duration: "20 min" },
  { id: "3", type: "session", title: "Essay Writing Workshop", subject: "English", date: "2 days ago", duration: "45 min" },
  { id: "4", type: "stuck", title: "Needed help with Quadratic Formulas", subject: "Mathematics", date: "3 days ago", duration: "Handoff to tutor" },
  { id: "5", type: "session", title: "Reading Comprehension", subject: "English", date: "4 days ago", duration: "30 min" },
];

const mockLearningSignals = [
  { id: "1", type: "stuck", message: "Struggled with factorization 3 times", severity: "medium", date: "2 days ago" },
  { id: "2", type: "progress", message: "Mastered linear equations", severity: "success", date: "1 week ago" },
  { id: "3", type: "handoff", message: "Requested tutor help for essay structure", severity: "info", date: "1 week ago" },
];

const mockNotes = [
  { id: "1", author: "Ms. Chen (Tutor)", content: "Emma is making great progress with algebra. Suggest focusing on word problems next.", date: "Yesterday" },
  { id: "2", author: "Parent", content: "Please encourage her to practice more regularly on weekends.", date: "3 days ago" },
];

export default function Student360() {
  const [, params] = useRoute("/admin/students/:id");
  const studentId = params?.id;

  return (
    <AdminLayout>
      <div className="p-8" data-testid="student-360-view">
        <Link href="/admin/students">
          <Button variant="ghost" className="mb-4" data-testid="back-to-students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {mockStudent.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{mockStudent.name}</h1>
              <p className="text-muted-foreground">Grade {mockStudent.grade} • {mockStudent.email}</p>
              <div className="flex gap-2 mt-2">
                {mockStudent.enrolledSubjects.map(subject => (
                  <Badge key={subject} variant="secondary">{subject}</Badge>
                ))}
                <Badge variant={mockStudent.status === "active" ? "default" : "outline"}>
                  {mockStudent.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="message-parent">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Parent
            </Button>
            <Button data-testid="schedule-session">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{mockStudent.totalSessions}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{mockStudent.totalHours}h</p>
                  <p className="text-sm text-muted-foreground">Learning Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{mockStudent.avgMastery}%</p>
                  <p className="text-sm text-muted-foreground">Avg Mastery</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">Sep 2024</p>
                  <p className="text-sm text-muted-foreground">Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity Timeline</TabsTrigger>
            <TabsTrigger value="signals" data-testid="tab-signals">Learning Signals</TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Recent sessions, quizzes, and learning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {mockActivity.map(item => (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30" data-testid={`activity-${item.id}`}>
                        <div className={`mt-1 p-2 rounded-full ${
                          item.type === "session" ? "bg-blue-100 text-blue-600" :
                          item.type === "quiz" ? "bg-green-100 text-green-600" :
                          "bg-amber-100 text-amber-600"
                        }`}>
                          {item.type === "session" ? <BookOpen className="h-4 w-4" /> :
                           item.type === "quiz" ? <Target className="h-4 w-4" /> :
                           <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{item.subject}</Badge>
                            <span>{item.date}</span>
                            <span>•</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals">
            <Card>
              <CardHeader>
                <CardTitle>Learning Signals</CardTitle>
                <CardDescription>Patterns detected by the AI tutor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLearningSignals.map(signal => (
                    <div key={signal.id} className="flex items-start gap-4 p-4 rounded-lg border" data-testid={`signal-${signal.id}`}>
                      <div className={`mt-1 ${
                        signal.severity === "medium" ? "text-amber-500" :
                        signal.severity === "success" ? "text-green-500" :
                        "text-blue-500"
                      }`}>
                        {signal.type === "stuck" ? <AlertTriangle className="h-5 w-5" /> :
                         signal.type === "progress" ? <TrendingUp className="h-5 w-5" /> :
                         <User className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{signal.message}</p>
                        <p className="text-sm text-muted-foreground">{signal.date}</p>
                      </div>
                      <Badge variant={
                        signal.severity === "medium" ? "destructive" :
                        signal.severity === "success" ? "default" :
                        "secondary"
                      }>
                        {signal.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Notes from tutors and parents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockNotes.map(note => (
                    <div key={note.id} className="p-4 rounded-lg border" data-testid={`note-${note.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{note.author}</p>
                        <p className="text-sm text-muted-foreground">{note.date}</p>
                      </div>
                      <p className="text-muted-foreground">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Summary</CardTitle>
                <CardDescription>Subscription and payment information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Premium Plan</p>
                    <p className="text-sm text-muted-foreground">$49/month • Next billing: Feb 15, 2026</p>
                  </div>
                  <Badge className="ml-auto">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Parent contact for billing: {mockStudent.parentEmail}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
