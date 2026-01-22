import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Calculator, 
  PenTool, 
  ArrowRight,
  Clock,
  ChevronDown,
  GraduationCap
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  getCurriculum, 
  type YearLevel, 
  type Subject,
  type Unit,
  type Lesson 
} from "@shared/curriculum";

export default function Practice() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<Subject>("mathematics");
  const [selectedYear, setSelectedYear] = useState<YearLevel>(7);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const curriculum = getCurriculum(selectedSubject, selectedYear);
  const units = curriculum?.units || [];

  const handleStartLesson = (lesson: Lesson, unit: Unit) => {
    const subjectShort = selectedSubject === "mathematics" ? "math" : "english";
    setLocation(`/student/session/${subjectShort}/${lesson.id}?unit=${unit.id}&year=${selectedYear}`);
  };

  const yearLevels: YearLevel[] = [6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="practice-page">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Practice</h1>
        <p className="text-muted-foreground">
          Choose a topic to practice and build your skills
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={selectedSubject === "mathematics" ? "default" : "outline"}
            onClick={() => setSelectedSubject("mathematics")}
            className="gap-2"
            data-testid="subject-math-btn"
          >
            <Calculator className="h-4 w-4" />
            Mathematics
          </Button>
          <Button
            variant={selectedSubject === "english" ? "default" : "outline"}
            onClick={() => setSelectedSubject("english")}
            className="gap-2"
            data-testid="subject-english-btn"
          >
            <PenTool className="h-4 w-4" />
            English
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(val) => setSelectedYear(parseInt(val) as YearLevel)}
          >
            <SelectTrigger className="w-32" data-testid="year-selector">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearLevels.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  Year {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {curriculum && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">{curriculum.description}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {curriculum.australianCurriculumCodes.slice(0, 3).map((code) => (
              <Badge key={code} variant="secondary" className="text-xs">
                {code}
              </Badge>
            ))}
            {curriculum.australianCurriculumCodes.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{curriculum.australianCurriculumCodes.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      <Accordion type="single" collapsible className="space-y-4">
        {units.map((unit) => (
          <AccordionItem 
            key={unit.id} 
            value={unit.id}
            className="border rounded-lg overflow-hidden"
            data-testid={`unit-${unit.id}`}
          >
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{unit.title}</h3>
                  <p className="text-sm text-muted-foreground">{unit.description}</p>
                </div>
                <Badge variant="outline" className="ml-auto mr-4">
                  Term {unit.term}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-3 mt-4">
                {unit.lessons.map((lesson) => (
                  <Card 
                    key={lesson.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleStartLesson(lesson, unit)}
                    data-testid={`lesson-${lesson.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {lesson.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lesson.keyConcepts.slice(0, 3).map((concept) => (
                              <Badge key={concept} variant="secondary" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.duration} min</span>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="gap-1">
                            Start
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {unit.practiceSets.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Practice Sets</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {unit.practiceSets.map((practiceSet) => (
                      <Card 
                        key={practiceSet.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const subjectShort = selectedSubject === "mathematics" ? "math" : "english";
                          setLocation(`/student/session/${subjectShort}/${practiceSet.lessonId}?practice=${practiceSet.id}&year=${selectedYear}`);
                        }}
                        data-testid={`practice-set-${practiceSet.id}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-sm">{practiceSet.title}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={
                                    practiceSet.difficulty === "foundation" ? "secondary" :
                                    practiceSet.difficulty === "advanced" ? "destructive" : "default"
                                  }
                                  className="text-xs"
                                >
                                  {practiceSet.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {practiceSet.questionCount} questions
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {units.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No topics available for this subject yet.</p>
        </div>
      )}
    </div>
  );
}
