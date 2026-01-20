import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  GraduationCap, 
  UserPlus, 
  Activity, 
  MessageSquare, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  MoreVertical,
  Mail,
  BookOpen
} from "lucide-react";
import { motion } from "framer-motion";

interface TutorProfile {
  id: number;
  profileId: number;
  bio: string | null;
  qualifications: string | null;
  subjectExpertise: string[] | null;
  isAvailable: boolean;
  profile?: {
    id: number;
    userId: string;
    role: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface StudentProfile {
  id: number;
  userId: string;
  role: string;
  grade: number | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  sessionsCount?: number;
  lastActivity?: string;
}

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  submitter?: {
    firstName: string;
    lastName: string;
  };
}

interface ActivityLog {
  id: number;
  action: string;
  entityType: string | null;
  createdAt: string;
  profile?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tutors");
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTutorDialog, setShowCreateTutorDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newTutor, setNewTutor] = useState({
    email: "",
    firstName: "",
    lastName: "",
    bio: "",
    qualifications: "",
    subjects: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tutorsRes, studentsRes, ticketsRes, activitiesRes] = await Promise.all([
        fetch("/api/admin/tutors"),
        fetch("/api/admin/students"),
        fetch("/api/admin/tickets"),
        fetch("/api/admin/activities")
      ]);

      if (tutorsRes.ok) setTutors(await tutorsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
    setLoading(false);
  };

  const createTutor = async () => {
    try {
      const response = await fetch("/api/admin/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTutor)
      });

      if (response.ok) {
        toast({ title: "Success", description: "Tutor account created successfully" });
        setShowCreateTutorDialog(false);
        setNewTutor({ email: "", firstName: "", lastName: "", bio: "", qualifications: "", subjects: [] });
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message || "Failed to create tutor", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create tutor", variant: "destructive" });
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Ticket updated" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update ticket", variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(s => 
    searchQuery === "" || 
    s.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      
      <main className="flex-1 md:ml-20 p-8 bg-muted/20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground mt-1">Manage tutors, students, and support requests</p>
            </div>
            <Button onClick={() => setShowCreateTutorDialog(true)} className="gap-2" data-testid="button-add-tutor">
              <UserPlus className="w-4 h-4" /> Add Tutor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Active Tutors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tutors.filter(t => t.isAvailable).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" /> Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Open Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.filter(t => t.status === "open").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activities.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-xl">
              <TabsTrigger value="tutors" data-testid="tab-tutors">Tutors</TabsTrigger>
              <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
              <TabsTrigger value="tickets" data-testid="tab-tickets">Support</TabsTrigger>
              <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="tutors" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Human Tutors</CardTitle>
                  <CardDescription>Manage tutor profiles and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  {tutors.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tutors registered yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => setShowCreateTutorDialog(true)}>
                        Add First Tutor
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tutors.map(tutor => (
                        <motion.div
                          key={tutor.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {tutor.user?.firstName} {tutor.user?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{tutor.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {tutor.subjectExpertise?.map(subject => (
                                <Badge key={subject} variant="secondary">{subject}</Badge>
                              ))}
                            </div>
                            <Badge variant={tutor.isAvailable ? "default" : "outline"}>
                              {tutor.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>View all registered students and their activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-students"
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No students found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {student.user?.firstName} {student.user?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Year {student.grade || "?"} • {student.user?.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.sessionsCount || 0} sessions
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Manage parent and student inquiries</CardDescription>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No support tickets</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map(ticket => (
                        <div key={ticket.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{ticket.subject}</h4>
                              <p className="text-sm text-muted-foreground">
                                From: {ticket.submitter?.firstName} {ticket.submitter?.lastName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                ticket.priority === "urgent" ? "destructive" :
                                ticket.priority === "high" ? "default" : "secondary"
                              }>
                                {ticket.priority}
                              </Badge>
                              <Select
                                value={ticket.status}
                                onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="text-sm">{ticket.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>System-wide activity log</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 20).map(activity => (
                        <div key={activity.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {activity.profile?.user?.firstName} {activity.profile?.user?.lastName}
                              </span>
                              {" "}{activity.action}
                              {activity.entityType && <span className="text-muted-foreground"> ({activity.entityType})</span>}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showCreateTutorDialog} onOpenChange={setShowCreateTutorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Tutor</DialogTitle>
            <DialogDescription>
              Create a tutor account. They will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newTutor.firstName}
                  onChange={(e) => setNewTutor({ ...newTutor, firstName: e.target.value })}
                  data-testid="input-tutor-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newTutor.lastName}
                  onChange={(e) => setNewTutor({ ...newTutor, lastName: e.target.value })}
                  data-testid="input-tutor-lastname"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newTutor.email}
                onChange={(e) => setNewTutor({ ...newTutor, email: e.target.value })}
                data-testid="input-tutor-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                placeholder="e.g., BSc Mathematics, Teaching Certificate"
                value={newTutor.qualifications}
                onChange={(e) => setNewTutor({ ...newTutor, qualifications: e.target.value })}
                data-testid="input-tutor-qualifications"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief description of teaching experience..."
                value={newTutor.bio}
                onChange={(e) => setNewTutor({ ...newTutor, bio: e.target.value })}
                data-testid="input-tutor-bio"
              />
            </div>

            <div className="space-y-2">
              <Label>Subject Expertise</Label>
              <div className="flex flex-wrap gap-2">
                {["Mathematics", "English", "Science", "History"].map(subject => (
                  <Button
                    key={subject}
                    type="button"
                    variant={newTutor.subjects.includes(subject) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setNewTutor({
                        ...newTutor,
                        subjects: newTutor.subjects.includes(subject)
                          ? newTutor.subjects.filter(s => s !== subject)
                          : [...newTutor.subjects, subject]
                      });
                    }}
                    data-testid={`button-subject-${subject.toLowerCase()}`}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTutorDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createTutor}
              disabled={!newTutor.email || !newTutor.firstName || !newTutor.lastName}
              data-testid="button-create-tutor"
            >
              <Mail className="w-4 h-4 mr-2" /> Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
