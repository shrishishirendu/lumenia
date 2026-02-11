import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Lock,
  Play,
  Target,
  Calculator,
  PenTool,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { YearCurriculum, Unit, Lesson } from "@shared/curriculum";
import TopicNotesDrawer from "@/components/TopicNotesDrawer";

interface DBTopic {
  id: number;
  title: string;
  description: string | null;
  gradeLevel: number;
  orderIndex: number;
  lessonCount: number;
}

interface CourseResponse {
  subject: { id: number; name: string; description: string | null; teacherName: string | null };
  plan: { id: number; currentTopicId: number | null; status: string };
  curriculum: YearCurriculum | null;
  grade: number;
  dbTopics?: DBTopic[];
}

export default function StudentCourse() {
  const [, setLocation] = useLocation();
  const params = useParams<{ subject: string }>();
  const subjectId = params.subject;
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<CourseResponse>({
    queryKey: ["/api/student/course", subjectId],
    queryFn: async () => {
      const res = await fetch(`/api/student/course/${subjectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: !!subjectId,
  });

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const getSubjectSlug = () => {
    const name = data?.subject.name.toLowerCase() || "";
    if (name.includes("math")) return "math";
    return "english";
  };

  const curriculumMapping = useMemo(() => {
    const map = new Map<string, DBTopic>();
    const topics = data?.dbTopics || [];
    if (!data?.curriculum || topics.length === 0) return map;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const topicIndex = new Map(topics.map(t => [normalize(t.title), t]));

    for (const unit of data.curriculum.units) {
      const unitNorm = normalize(unit.title);
      const unitMatch = topicIndex.get(unitNorm);

      for (const lesson of unit.lessons) {
        const lessonNorm = normalize(lesson.title);
        const exactMatch = topicIndex.get(lessonNorm);
        if (exactMatch) {
          map.set(lesson.id, exactMatch);
        } else if (unitMatch) {
          map.set(lesson.id, unitMatch);
        }
      }
    }
    return map;
  }, [data?.curriculum, data?.dbTopics]);

  const handleStartLesson = (lesson: Lesson) => {
    const mapped = curriculumMapping.get(lesson.id);
    if (!mapped) return;
    const slug = getSubjectSlug();
    const topicParam = encodeURIComponent(mapped.title);
    setLocation(`/student/session/${slug}/${topicParam}?year=${data?.grade}&topicId=${mapped.id}`);
  };

  const handleStartDBTopic = (topic: DBTopic) => {
    const slug = getSubjectSlug();
    const topicParam = encodeURIComponent(topic.title);
    setLocation(`/student/session/${slug}/${topicParam}?year=${data?.grade}&topicId=${topic.id}`);
  };

  const handleResume = () => {
    if (!data) return;
    const slug = getSubjectSlug();

    const dbTopics = data.dbTopics || [];
    if (dbTopics.length > 0) {
      const firstTopic = dbTopics[0];
      const topicParam = encodeURIComponent(firstTopic.title);
      setLocation(`/student/session/${slug}/${topicParam}?year=${data.grade}&topicId=${firstTopic.id}`);
      return;
    }

    setLocation(`/student/session/${slug}/warmup?year=${data.grade}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Button variant="ghost" onClick={() => setLocation("/student/subjects")} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to subjects
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Could not load this course. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subject, curriculum, grade } = data;
  const dbTopics = data.dbTopics || [];
  const isMath = subject.name.toLowerCase() === "mathematics";
  const subjectIcon = isMath ? <Calculator className="w-6 h-6" /> : <PenTool className="w-6 h-6" />;
  const styles = isMath
    ? { header: "bg-gradient-to-br from-blue-50 to-transparent border border-blue-200", iconBg: "bg-blue-100 text-blue-600", unitBadge: "bg-blue-100 text-blue-600", topicAccent: "border-blue-200 bg-blue-50" }
    : { header: "bg-gradient-to-br from-purple-50 to-transparent border border-purple-200", iconBg: "bg-purple-100 text-purple-600", unitBadge: "bg-purple-100 text-purple-600", topicAccent: "border-purple-200 bg-purple-50" };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6" data-testid="student-course-page">
      <Button
        variant="ghost"
        onClick={() => setLocation("/student/subjects")}
        className="gap-2 text-muted-foreground hover:text-foreground"
        data-testid="back-to-subjects"
      >
        <ArrowLeft className="w-4 h-4" /> My Subjects
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className={`${styles.header} rounded-2xl p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
                {subjectIcon}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground" data-testid="course-title">
                  Year {grade} {subject.name}
                </h1>
                {subject.teacherName && (
                  <p className="text-muted-foreground">with {subject.teacherName}</p>
                )}
                {curriculum && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {curriculum.units.length} units &middot; {curriculum.totalHours} hours
                  </p>
                )}
              </div>
            </div>

            <Button size="lg" onClick={handleResume} className="gap-2 shadow-md" data-testid="resume-course-btn">
              <Play className="w-4 h-4" />
              Resume
            </Button>
          </div>
        </div>
      </motion.div>

      {curriculum && curriculum.description && (
        <p className="text-muted-foreground" data-testid="course-description">
          {curriculum.description}
        </p>
      )}

      {dbTopics.length > 0 && (
        <div className="space-y-3" data-testid="db-topics-list">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Interactive Topics
          </h2>
          <p className="text-sm text-muted-foreground">
            These topics have full lesson content with worked examples, guided practice, and quiz questions.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {dbTopics.map((topic, idx) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={`${styles.topicAccent} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => handleStartDBTopic(topic)}
                  data-testid={`db-topic-card-${topic.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base" data-testid={`db-topic-title-${topic.id}`}>
                          {topic.title}
                        </h3>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {topic.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {topic.lessonCount} lessons
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <TopicNotesDrawer topicId={topic.id} topicTitle={topic.title} triggerVariant="icon" />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => { e.stopPropagation(); setLocation(`/student/practice/${topic.id}`); }}
                          data-testid={`practice-topic-${topic.id}`}
                        >
                          <Target className="w-3 h-3" /> Practice
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          data-testid={`start-topic-${topic.id}`}
                        >
                          <Play className="w-3 h-3" /> Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!curriculum && dbTopics.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Curriculum content for Year {grade} {subject.name} is not available yet.
            </p>
          </CardContent>
        </Card>
      ) : curriculum ? (
        <div className="space-y-3" data-testid="units-list">
          <h2 className="text-lg font-semibold">Curriculum Overview</h2>
          {curriculum.units.map((unit: Unit, unitIndex: number) => {
            const isExpanded = expandedUnits.has(unit.id);
            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: unitIndex * 0.05 }}
              >
                <Card className="overflow-hidden" data-testid={`unit-card-${unit.id}`}>
                  <button
                    className="w-full text-left"
                    onClick={() => toggleUnit(unit.id)}
                    data-testid={`unit-toggle-${unit.id}`}
                  >
                    <CardHeader className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-lg ${styles.unitBadge} flex items-center justify-center text-sm font-semibold`}>
                            {unitIndex + 1}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{unit.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Term {unit.term} &middot; {unit.lessons.length} lessons
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {unit.description && (
                            <p className="text-sm text-muted-foreground px-4 pb-3 border-b">
                              {unit.description}
                            </p>
                          )}

                          <div className="divide-y">
                            {unit.lessons.map((lesson: Lesson, lessonIndex: number) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                                data-testid={`lesson-row-${lesson.id}`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                                    {lessonIndex + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {lesson.duration} min
                                      </span>
                                      {lesson.objectives.length > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Target className="w-3 h-3" /> {lesson.objectives.length} objectives
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {curriculumMapping.has(lesson.id) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartLesson(lesson)}
                                  className="gap-1 text-xs shrink-0"
                                  data-testid={`start-lesson-${lesson.id}`}
                                >
                                  <BookOpen className="w-3 h-3" />
                                  Open
                                </Button>
                              ) : (
                                <Badge variant="secondary" className="gap-1 text-xs font-normal" data-testid={`coming-soon-${lesson.id}`}>
                                  <Lock className="w-3 h-3" />
                                  Coming Soon
                                </Badge>
                              )}
                              </div>
                            ))}
                          </div>

                          {unit.practiceSets.length > 0 && (
                            <div className="border-t bg-muted/10 px-4 py-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                Practice Sets
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {unit.practiceSets.map((ps) => (
                                  <span
                                    key={ps.id}
                                    className="text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground"
                                    data-testid={`practice-set-${ps.id}`}
                                  >
                                    {ps.title} &middot; {ps.questionCount}q
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
