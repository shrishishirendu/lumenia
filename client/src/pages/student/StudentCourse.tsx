import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
  Search,
  Zap,
  Timer,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
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

type FilterType = "all" | "available" | "coming_soon";

const subjectNameToId: Record<string, string> = { math: "1", mathematics: "1", english: "2" };

export default function StudentCourse() {
  const [, setLocation] = useLocation();
  const params = useParams<{ subject: string }>();
  const rawSubject = params.subject || "";
  const subjectId = subjectNameToId[rawSubject.toLowerCase()] || rawSubject;
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    const topicEntries = topics.map(t => ({ norm: normalize(t.title), topic: t }));

    for (const unit of data.curriculum.units) {
      const unitNorm = normalize(unit.title);
      const unitMatch = topicIndex.get(unitNorm);

      for (const lesson of unit.lessons) {
        const lessonNorm = normalize(lesson.title);
        const exactMatch = topicIndex.get(lessonNorm);
        if (exactMatch) {
          map.set(lesson.id, exactMatch);
        } else {
          const startsWith = topicEntries.find(e => e.norm.startsWith(lessonNorm) && lessonNorm.length >= 10);
          if (startsWith) {
            map.set(lesson.id, startsWith.topic);
          } else if (unitMatch) {
            map.set(lesson.id, unitMatch);
          }
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

  const stats = useMemo(() => {
    if (!data) return { total: 0, available: 0, comingSoon: 0 };
    const dbTopics = data.dbTopics || [];
    const curriculum = data.curriculum;

    if (!curriculum) {
      return { total: dbTopics.length, available: dbTopics.length, comingSoon: 0 };
    }

    let total = 0;
    let available = 0;
    for (const unit of curriculum.units) {
      for (const lesson of unit.lessons) {
        total++;
        if (curriculumMapping.has(lesson.id)) available++;
      }
    }
    return { total, available, comingSoon: total - available };
  }, [data, curriculumMapping]);

  const filteredUnits = useMemo(() => {
    if (!data?.curriculum) return [];
    const query = searchQuery.toLowerCase().trim();

    return data.curriculum.units.map((unit) => {
      const filteredLessons = unit.lessons.filter((lesson) => {
        if (query && !lesson.title.toLowerCase().includes(query)) return false;

        if (selectedFilter === "available") return curriculumMapping.has(lesson.id);
        if (selectedFilter === "coming_soon") return !curriculumMapping.has(lesson.id);
        return true;
      });
      return { ...unit, lessons: filteredLessons };
    }).filter((unit) => unit.lessons.length > 0);
  }, [data?.curriculum, searchQuery, selectedFilter, curriculumMapping]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
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
  const subjectIcon = isMath ? <Calculator className="w-7 h-7" /> : <PenTool className="w-7 h-7" />;

  const accentColor = isMath ? "blue" : "purple";
  const styles = {
    heroBg: isMath
      ? "bg-gradient-to-br from-blue-600 to-blue-700"
      : "bg-gradient-to-br from-purple-600 to-purple-700",
    heroLight: isMath ? "bg-blue-500/20" : "bg-purple-500/20",
    iconBg: isMath ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600",
    unitBadge: isMath ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700",
    topicAccent: isMath ? "border-blue-200 hover:border-blue-300" : "border-purple-200 hover:border-purple-300",
    topicBg: isMath ? "bg-blue-50/50" : "bg-purple-50/50",
    filterActive: isMath ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-purple-600 text-white hover:bg-purple-700",
    practiceCard: isMath ? "border-blue-200 bg-blue-50/30" : "border-purple-200 bg-purple-50/30",
    progressBar: isMath ? "bg-blue-600" : "bg-purple-600",
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0;

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All Topics", count: stats.total },
    { key: "available", label: "Available", count: stats.available },
    { key: "coming_soon", label: "Coming Soon", count: stats.comingSoon },
  ];

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6" data-testid="student-course-page">
        <Button
          variant="ghost"
          onClick={() => setLocation("/student/subjects")}
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="back-to-subjects"
        >
          <ArrowLeft className="w-4 h-4" /> My Subjects
        </Button>

        {/* A) Hero Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`${styles.heroBg} rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden`} data-testid="course-hero">
            <div className={`absolute top-0 right-0 w-64 h-64 ${styles.heroLight} rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className={`absolute bottom-0 left-0 w-40 h-40 ${styles.heroLight} rounded-full translate-y-1/2 -translate-x-1/2`} />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  {subjectIcon}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold" data-testid="course-title">
                    Year {grade} {subject.name}
                  </h1>
                  {subject.teacherName && (
                    <p className="text-white/80 text-sm">with {subject.teacherName}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {curriculum && (
                      <span className="text-white/70 text-sm flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {curriculum.units.length} units
                      </span>
                    )}
                    {curriculum && (
                      <span className="text-white/70 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {curriculum.totalHours}h total
                      </span>
                    )}
                    {stats.available > 0 && (
                      <span className="text-white/70 text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {stats.available} available
                      </span>
                    )}
                  </div>
                  {stats.total > 0 && (
                    <div className="mt-3 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                        <span>Content ready</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/90 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                          data-testid="progress-bar"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleResume}
                className="gap-2 bg-white text-gray-900 hover:bg-white/90 shadow-lg font-semibold shrink-0"
                data-testid="resume-course-btn"
              >
                <Play className="w-4 h-4" />
                Continue Learning
              </Button>
            </div>
          </div>
        </motion.div>

        {curriculum && curriculum.description && (
          <p className="text-muted-foreground text-sm" data-testid="course-description">
            {curriculum.description}
          </p>
        )}

        {/* B) Quick Practice Strip */}
        {dbTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-wrap gap-3" data-testid="quick-practice-strip">
              <Button
                variant="outline"
                className={`gap-2 ${styles.practiceCard} hover:shadow-sm`}
                onClick={() => setLocation(`/student/practice/${dbTopics[0].id}`)}
                data-testid="quick-practice-btn"
              >
                <Zap className="w-4 h-4" />
                Quick Practice (5)
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 opacity-60 cursor-not-allowed"
                    disabled
                    data-testid="trap-practice-btn"
                  >
                    <Target className="w-4 h-4" />
                    Trap Practice (5)
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 opacity-60 cursor-not-allowed"
                    disabled
                    data-testid="timed-challenge-btn"
                  >
                    <Timer className="w-4 h-4" />
                    Timed Challenge (10)
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        )}

        {/* Interactive Topics Section */}
        {dbTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="space-y-3" data-testid="db-topics-list">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Interactive Topics</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Full lesson content with worked examples, guided practice, and quiz questions.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dbTopics.map((topic, idx) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                  >
                    <Card
                      className={`${styles.topicAccent} ${styles.topicBg} hover:shadow-md transition-all cursor-pointer group h-full`}
                      onClick={() => handleStartDBTopic(topic)}
                      data-testid={`db-topic-card-${topic.id}`}
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base leading-snug" data-testid={`db-topic-title-${topic.id}`}>
                            {topic.title}
                          </h3>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                              {topic.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {topic.lessonCount} lessons
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                          <TopicNotesDrawer topicId={topic.id} topicTitle={topic.title} triggerVariant="icon" />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs flex-1"
                            onClick={(e) => { e.stopPropagation(); setLocation(`/student/practice/${topic.id}`); }}
                            data-testid={`practice-topic-${topic.id}`}
                          >
                            <Target className="w-3 h-3" /> Practice
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1 text-xs flex-1"
                            onClick={(e) => { e.stopPropagation(); handleStartDBTopic(topic); }}
                            data-testid={`start-topic-${topic.id}`}
                          >
                            <Play className="w-3 h-3" /> Start
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* C) Filter Chips + Search + D) Curriculum Lesson Cards */}
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
          <div className="space-y-4" data-testid="units-list">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold">Curriculum Overview</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="search-lessons-input"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2" data-testid="filter-chips">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSelectedFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedFilter === f.key
                      ? styles.filterActive
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-testid={`filter-chip-${f.key}`}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <span className={`ml-1.5 ${selectedFilter === f.key ? "text-white/70" : "text-muted-foreground/70"}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredUnits.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No lessons match your search or filter.
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => { setSearchQuery(""); setSelectedFilter("all"); }}
                    data-testid="clear-filters-btn"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredUnits.map((unit: Unit & { lessons: Lesson[] }, unitIndex: number) => {
                const isExpanded = expandedUnits.has(unit.id);
                const availableCount = unit.lessons.filter(l => curriculumMapping.has(l.id)).length;
                return (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: unitIndex * 0.04 }}
                  >
                    <Card className="overflow-hidden border shadow-sm" data-testid={`unit-card-${unit.id}`}>
                      <button
                        className="w-full text-left"
                        onClick={() => toggleUnit(unit.id)}
                        data-testid={`unit-toggle-${unit.id}`}
                      >
                        <div className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-9 h-9 rounded-lg ${styles.unitBadge} flex items-center justify-center text-sm font-bold shrink-0`}>
                                {unitIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold truncate">{unit.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                  <span>Term {unit.term}</span>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span>{unit.lessons.length} lessons</span>
                                  {availableCount > 0 && (
                                    <>
                                      <span className="text-muted-foreground/40">·</span>
                                      <span className="text-green-600 font-medium">{availableCount} ready</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>
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

                              {/* D) Lesson Cards Grid */}
                              <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid={`unit-lessons-grid-${unit.id}`}>
                                {unit.lessons.map((lesson: Lesson) => {
                                  const isAvailable = curriculumMapping.has(lesson.id);
                                  return (
                                    <Card
                                      key={lesson.id}
                                      className={`transition-all ${
                                        isAvailable
                                          ? "hover:shadow-md cursor-pointer border-border hover:border-primary/30"
                                          : "opacity-60 border-dashed"
                                      }`}
                                      onClick={() => isAvailable && handleStartLesson(lesson)}
                                      data-testid={`lesson-card-${lesson.id}`}
                                    >
                                      <CardContent className="p-4 flex flex-col h-full">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                            isAvailable
                                              ? `${styles.unitBadge}`
                                              : "bg-muted text-muted-foreground"
                                          }`}>
                                            {isAvailable ? (
                                              <Circle className="w-3.5 h-3.5" />
                                            ) : (
                                              <Lock className="w-3 h-3" />
                                            )}
                                          </div>
                                          {isAvailable ? (
                                            <Badge variant="secondary" className="text-[10px] font-medium bg-green-100 text-green-700 border-0">
                                              Available
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-[10px] font-normal">
                                              Coming Soon
                                            </Badge>
                                          )}
                                        </div>

                                        <h4 className="text-sm font-medium leading-snug flex-1" data-testid={`lesson-title-${lesson.id}`}>
                                          {lesson.title}
                                        </h4>

                                        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                                          {lesson.duration && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" /> {lesson.duration}m
                                            </span>
                                          )}
                                          {lesson.objectives && lesson.objectives.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Target className="w-3 h-3" /> {lesson.objectives.length} goals
                                            </span>
                                          )}
                                        </div>

                                        {isAvailable && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 text-xs mt-3 w-full justify-center hover:bg-primary/10"
                                            onClick={(e) => { e.stopPropagation(); handleStartLesson(lesson); }}
                                            data-testid={`start-lesson-${lesson.id}`}
                                          >
                                            <BookOpen className="w-3 h-3" />
                                            Open Lesson
                                          </Button>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
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
              })
            )}
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
