import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, PenTool, ArrowRight, Play, BookOpen, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

interface SubjectWithPlan {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  teacherName: string | null;
  isActive: boolean;
  hasTeachingPlan: boolean;
  teachingPlanId: number | null;
  currentTopicId: number | null;
}

interface SubjectsResponse {
  subjects: SubjectWithPlan[];
  grade: number | null;
}

const SUBJECT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Mathematics: {
    icon: <Calculator className="w-6 h-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  English: {
    icon: <PenTool className="w-6 h-6" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
};

function getSubjectConfig(name: string) {
  return SUBJECT_CONFIG[name] || {
    icon: <BookOpen className="w-6 h-6" />,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };
}

export default function StudentSubjects() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<SubjectsResponse>({
    queryKey: ["/api/student/subjects"],
    queryFn: async () => {
      const res = await fetch("/api/student/subjects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subjects = data?.subjects || [];
  const grade = data?.grade;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6" data-testid="student-subjects-page">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground" data-testid="subjects-title">
            My Subjects
          </h1>
        </div>
        {grade && (
          <p className="text-muted-foreground ml-9" data-testid="subjects-year-level">
            Year {grade} curriculum
          </p>
        )}
      </motion.div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No subjects are available yet. Check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((subject, index) => {
            const config = getSubjectConfig(subject.name);
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`${config.border} hover:shadow-md transition-shadow cursor-pointer group`}
                  onClick={() => setLocation(`/student/course/${subject.id}`)}
                  data-testid={`subject-card-${subject.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center ${config.color}`}>
                            {config.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground" data-testid={`subject-name-${subject.id}`}>
                              {subject.name}
                            </h3>
                            {subject.teacherName && (
                              <p className="text-sm text-muted-foreground">with {subject.teacherName}</p>
                            )}
                          </div>
                        </div>

                        {subject.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {subject.description}
                          </p>
                        )}
                      </div>

                      <Button
                        className="gap-2 group-hover:shadow-sm transition-shadow"
                        variant={subject.hasTeachingPlan ? "default" : "outline"}
                        data-testid={`subject-action-${subject.id}`}
                      >
                        {subject.hasTeachingPlan ? (
                          <>
                            <Play className="w-4 h-4" />
                            Continue
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
