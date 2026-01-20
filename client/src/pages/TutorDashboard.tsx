import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  GraduationCap, 
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  Settings,
  Save
} from "lucide-react";
import { motion } from "framer-motion";

interface AssignedStudent {
  id: number;
  studentId: number;
  subjectId: number | null;
  status: string;
  student?: {
    id: number;
    grade: number | null;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  subject?: {
    name: string;
  };
  sessionsCount?: number;
  lastSession?: string;
}

interface TutorProfile {
  id: number;
  bio: string | null;
  qualifications: string | null;
  subjectExpertise: string[] | null;
  isAvailable: boolean;
}

export default function TutorDashboard() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, studentsRes] = await Promise.all([
        fetch("/api/tutor/profile"),
        fetch("/api/tutor/students")
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setBio(profileData.bio || "");
        setQualifications(profileData.qualifications || "");
      }
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch (error) {
      console.error("Failed to fetch tutor data:", error);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    try {
      const response = await fetch("/api/tutor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, qualifications })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Profile updated successfully" });
        setEditingProfile(false);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await fetch("/api/tutor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !profile?.isAvailable })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Availability updated" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      
      <main className="flex-1 md:ml-20 p-8 bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Tutor Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your profile and assigned students</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={profile?.isAvailable ? "default" : "outline"}
                onClick={toggleAvailability}
                data-testid="button-toggle-availability"
              >
                {profile?.isAvailable ? "Available" : "Set Available"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" /> Assigned Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.filter(s => s.status === "active").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile?.subjectExpertise?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={profile?.isAvailable ? "default" : "secondary"}>
                  {profile?.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Assigned Students</CardTitle>
                <CardDescription>Students you are currently tutoring</CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No students assigned yet</p>
                    <p className="text-sm mt-2">Admin will assign students to you</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map(assignment => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {assignment.student?.user?.firstName} {assignment.student?.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Year {assignment.student?.grade || "?"} 
                              {assignment.subject && ` • ${assignment.subject.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                            {assignment.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" /> Notes
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Your tutor information</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subjects</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile?.subjectExpertise?.map(subject => (
                      <Badge key={subject} variant="secondary">{subject}</Badge>
                    )) || <span className="text-muted-foreground text-sm">None set</span>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Qualifications</label>
                  {editingProfile ? (
                    <Textarea
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      className="mt-1"
                      placeholder="Your qualifications..."
                      data-testid="input-qualifications"
                    />
                  ) : (
                    <p className="text-sm mt-1 text-muted-foreground">
                      {profile?.qualifications || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  {editingProfile ? (
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="mt-1"
                      placeholder="Tell students about yourself..."
                      data-testid="input-bio"
                    />
                  ) : (
                    <p className="text-sm mt-1 text-muted-foreground">
                      {profile?.bio || "Not provided"}
                    </p>
                  )}
                </div>

                {editingProfile && (
                  <Button onClick={saveProfile} className="w-full gap-2" data-testid="button-save-profile">
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
