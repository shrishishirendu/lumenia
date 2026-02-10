import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Zap, 
  BookOpen, 
  PenTool, 
  Brain, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  HelpCircle,
  Trophy,
  Clock,
  Star
} from "lucide-react";
import { TOPIC_CATALOG, getTopic } from "@shared/topicCatalog";
import { apiRequest } from "@/lib/queryClient";

type SessionStep = "warmup" | "lesson" | "practice" | "reflection" | "exit_ticket" | "next_step";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  questionType?: string;
}

interface DBSegment {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  content: string;
  whiteboardContent: string | null;
  tutorScript: string | null;
  orderIndex: number;
}

interface DBLesson {
  id: number;
  topicId: number;
  title: string;
  description: string | null;
  orderIndex: number;
  estimatedMinutes: number | null;
  objectives: string[] | null;
  segments: DBSegment[];
  questions: DBQuestion[];
}

interface DBQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: number;
  points: number;
}

interface TopicContent {
  topic: { id: number; title: string; description: string | null };
  lessons: DBLesson[];
  exitTicketQuestions: DBQuestion[];
}

interface SessionState {
  currentStep: SessionStep;
  sessionId: number | null;
  warmupResults: { questions: Question[]; answers: Record<string, string>; score: number };
  lessonCompleted: boolean;
  explanationStyle: string;
  practiceResults: { questions: Question[]; answers: Record<string, string>; hintsUsed: number };
  reflectionText: string;
  exitTicketResults: { questions: Question[]; answers: Record<string, string>; passed: boolean };
  hintsUsed: number;
  startTime: number;
  currentLessonIndex: number;
}

const STEPS: { id: SessionStep; label: string; icon: React.ElementType }[] = [
  { id: "warmup", label: "Warm-up", icon: Zap },
  { id: "lesson", label: "Lesson", icon: BookOpen },
  { id: "practice", label: "Practice", icon: PenTool },
  { id: "reflection", label: "Reflect", icon: Brain },
  { id: "exit_ticket", label: "Exit Ticket", icon: CheckCircle },
  { id: "next_step", label: "Next Steps", icon: ArrowRight }
];

const generateMockQuestions = (subject: string, topic: string, count: number, difficulty: number = 2): Question[] => {
  const mathQuestions: Question[] = [
    { id: "m1", text: "Solve for x: 2x + 5 = 13", options: ["x = 4", "x = 5", "x = 6", "x = 3"], correctAnswer: "x = 4", explanation: "Subtract 5 from both sides to get 2x = 8, then divide by 2 to get x = 4.", difficulty: 1 },
    { id: "m2", text: "What is 3/4 + 1/2?", options: ["5/4", "4/6", "1/4", "7/4"], correctAnswer: "5/4", explanation: "Convert 1/2 to 2/4, then add: 3/4 + 2/4 = 5/4", difficulty: 1 },
    { id: "m3", text: "Solve for y: 3y - 7 = 14", options: ["y = 7", "y = 6", "y = 8", "y = 5"], correctAnswer: "y = 7", explanation: "Add 7 to both sides: 3y = 21, then divide by 3: y = 7", difficulty: 2 },
    { id: "m4", text: "What is 25% of 80?", options: ["20", "15", "25", "30"], correctAnswer: "20", explanation: "25% = 1/4, so 80 ÷ 4 = 20", difficulty: 1 }
  ];
  
  const englishQuestions: Question[] = [
    { id: "e1", text: "Which sentence is correct?", options: ["She don't like pizza.", "She doesn't like pizza.", "She not like pizza.", "She doesn't likes pizza."], correctAnswer: "She doesn't like pizza.", explanation: "For third person singular, use 'doesn't' + base verb.", difficulty: 1 },
    { id: "e2", text: "What is the main idea of a paragraph called?", options: ["Topic sentence", "Conclusion", "Supporting detail", "Thesis"], correctAnswer: "Topic sentence", explanation: "The topic sentence introduces the main idea of a paragraph.", difficulty: 1 },
    { id: "e3", text: "Which is a compound sentence?", options: ["I went to the store.", "I went to the store, and I bought milk.", "Going to the store.", "The store where I went."], correctAnswer: "I went to the store, and I bought milk.", explanation: "A compound sentence joins two independent clauses with a conjunction.", difficulty: 2 }
  ];
  
  const questions = subject === "english" ? englishQuestions : mathQuestions;
  return questions.slice(0, count);
};

function dbQuestionToQuestion(q: DBQuestion): Question {
  if (q.questionType === "short_answer") {
    return {
      id: String(q.id),
      text: q.questionText,
      options: [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      difficulty: q.difficulty,
      questionType: "short_answer",
    };
  }
  return {
    id: String(q.id),
    text: q.questionText,
    options: q.options || [],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || "",
    difficulty: q.difficulty,
    questionType: q.questionType,
  };
}

export default function SessionFlow() {
  const params = useParams<{ subject: string; topic: string }>();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const subject = params.subject || "math";
  const rawTopicId = params.topic || "linear_equations";
  const isWarmupMode = rawTopicId === "warmup";
  const topicId = isWarmupMode ? "linear_equations" : rawTopicId;
  const yearParam = searchParams.get("year");
  const dbTopicIdParam = searchParams.get("topicId");

  const topicConfig = getTopic(subject, topicId);
  const fallbackTopicName = isWarmupMode ? "Quick Review" : (topicConfig?.name || decodeURIComponent(topicId));

  const { data: topicContent, isLoading: contentLoading } = useQuery<TopicContent>({
    queryKey: ["/api/topics/content", dbTopicIdParam],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${dbTopicIdParam}/content`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch topic content");
      return res.json();
    },
    enabled: !!dbTopicIdParam && !isWarmupMode,
  });

  const hasDBContent = !!topicContent &&
    topicContent.lessons.length > 0 &&
    topicContent.lessons.some((l) => l.segments && l.segments.length > 0);
  const topicName = hasDBContent ? topicContent.topic.title : fallbackTopicName;

  const warmupQuestions = hasDBContent
    ? topicContent.lessons[0]?.questions?.filter((q) => q.difficulty <= 1).slice(0, 3).map(dbQuestionToQuestion) || []
    : null;
  const practiceQuestions = hasDBContent
    ? topicContent.lessons.flatMap((l) => l.questions).filter((q) => q.difficulty >= 2 && q.difficulty <= 3).slice(0, 4).map(dbQuestionToQuestion)
    : null;
  const exitQuestions = hasDBContent
    ? topicContent.exitTicketQuestions.slice(0, 4).map(dbQuestionToQuestion)
    : null;

  const WARMUP_ONLY_STEPS: { id: SessionStep; label: string; icon: React.ElementType }[] = [
    { id: "warmup", label: "Review", icon: Zap },
    { id: "next_step", label: "Done", icon: CheckCircle }
  ];

  const activeSteps = isWarmupMode ? WARMUP_ONLY_STEPS : STEPS;

  const [state, setState] = useState<SessionState>({
    currentStep: "warmup",
    sessionId: null,
    warmupResults: { questions: warmupQuestions || generateMockQuestions(subject, topicId, 3, 1), answers: {}, score: 0 },
    lessonCompleted: false,
    explanationStyle: "step_by_step",
    practiceResults: { questions: practiceQuestions || generateMockQuestions(subject, topicId, 4, 2), answers: {}, hintsUsed: 0 },
    reflectionText: "",
    exitTicketResults: { questions: exitQuestions || generateMockQuestions(subject, topicId, 2, 2), answers: {}, passed: false },
    hintsUsed: 0,
    startTime: Date.now(),
    currentLessonIndex: 0,
  });

  useEffect(() => {
    if (hasDBContent) {
      const wu = warmupQuestions && warmupQuestions.length > 0 ? warmupQuestions : generateMockQuestions(subject, topicId, 3, 1);
      const pr = practiceQuestions && practiceQuestions.length > 0 ? practiceQuestions : generateMockQuestions(subject, topicId, 4, 2);
      const et = exitQuestions && exitQuestions.length > 0 ? exitQuestions : generateMockQuestions(subject, topicId, 2, 2);
      setState((prev) => ({
        ...prev,
        warmupResults: { ...prev.warmupResults, questions: wu },
        practiceResults: { ...prev.practiceResults, questions: pr },
        exitTicketResults: { ...prev.exitTicketResults, questions: et },
      }));
    }
  }, [hasDBContent]);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/student/sessions", { subject, topicId, topicName });
      return res.json();
    },
    onSuccess: (data) => {
      setState(prev => ({ ...prev, sessionId: data.id }));
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!state.sessionId) return;
      const res = await apiRequest("PATCH", `/api/student/sessions/${state.sessionId}`, updates);
      return res.json();
    }
  });

  useEffect(() => {
    createSessionMutation.mutate();
  }, []);

  const currentStepIndex = activeSteps.findIndex(s => s.id === state.currentStep);
  const progressPercent = ((currentStepIndex + 1) / activeSteps.length) * 100;

  const handleAnswer = (questionId: string, answer: string, section: "warmup" | "practice" | "exit_ticket") => {
    setState(prev => {
      if (section === "warmup") {
        return {
          ...prev,
          warmupResults: { 
            ...prev.warmupResults, 
            answers: { ...prev.warmupResults.answers, [questionId]: answer } 
          }
        };
      } else if (section === "practice") {
        return {
          ...prev,
          practiceResults: { 
            ...prev.practiceResults, 
            answers: { ...prev.practiceResults.answers, [questionId]: answer } 
          }
        };
      } else {
        return {
          ...prev,
          exitTicketResults: { 
            ...prev.exitTicketResults, 
            answers: { ...prev.exitTicketResults.answers, [questionId]: answer } 
          }
        };
      }
    });
  };

  const handleNextStep = () => {
    const stepOrder: SessionStep[] = isWarmupMode 
      ? ["warmup", "next_step"] 
      : ["warmup", "lesson", "practice", "reflection", "exit_ticket", "next_step"];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setState(prev => ({ ...prev, currentStep: nextStep }));
      
      if (state.sessionId) {
        const timeSpent = Math.floor((Date.now() - state.startTime) / 1000);
        updateSessionMutation.mutate({
          warmupResults: JSON.stringify(state.warmupResults),
          lessonCompleted: state.lessonCompleted,
          practiceResults: JSON.stringify(state.practiceResults),
          reflectionText: state.reflectionText,
          exitTicketResults: JSON.stringify(state.exitTicketResults),
          timeSpentSec: timeSpent,
          hintsUsed: state.hintsUsed
        });
      }
    }
  };

  const handlePrevStep = () => {
    const stepOrder: SessionStep[] = isWarmupMode 
      ? ["warmup", "next_step"] 
      : ["warmup", "lesson", "practice", "reflection", "exit_ticket", "next_step"];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, currentStep: stepOrder[currentIndex - 1] }));
    }
  };

  const handleFinish = async () => {
    try {
      if (state.sessionId) {
        const timeSpent = Math.floor((Date.now() - state.startTime) / 1000);
        const warmupScore = calculateScore(state.warmupResults.questions, state.warmupResults.answers);
        const exitPassed = calculateScore(state.exitTicketResults.questions, state.exitTicketResults.answers) >= 80;
        
        let outcomeStatus = "practicing";
        if (exitPassed && state.hintsUsed <= 2) {
          outcomeStatus = "mastered";
        } else if (!exitPassed || state.hintsUsed > 5) {
          outcomeStatus = "needs_help";
        }
        
        await updateSessionMutation.mutateAsync({
          endedAt: new Date().toISOString(),
          warmupResults: JSON.stringify(state.warmupResults),
          lessonCompleted: true,
          practiceResults: JSON.stringify(state.practiceResults),
          reflectionText: state.reflectionText,
          exitTicketResults: JSON.stringify({ ...state.exitTicketResults, passed: exitPassed }),
          timeSpentSec: timeSpent,
          hintsUsed: state.hintsUsed,
          outcomeStatus,
          sessionSummary: `Completed ${topicName} session. Score: ${warmupScore}%. Exit ticket: ${exitPassed ? "Passed" : "Needs review"}.`
        });
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }
    setLocation("/student");
  };

  const calculateScore = (questions: Question[], answers: Record<string, string>): number => {
    if (questions.length === 0) return 0;
    const correct = questions.filter(q => {
      const ans = answers[q.id];
      if (!ans) return false;
      return ans.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
    }).length;
    return Math.round((correct / questions.length) * 100);
  };

  const requestHint = () => {
    setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  };

  const renderQuestionInput = (q: Question, section: "warmup" | "practice" | "exit_ticket", answers: Record<string, string>) => {
    if (q.questionType === "short_answer" || q.options.length === 0) {
      const currentAnswer = answers[q.id] || "";
      const isSubmitted = !!currentAnswer;
      const isCorrect = isSubmitted && currentAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      return (
        <div>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Type your answer..."
              value={currentAnswer}
              onChange={(e) => handleAnswer(q.id, e.target.value, section)}
              className="max-w-xs"
              data-testid={`input-${q.id}`}
            />
          </div>
          {isSubmitted && section !== "exit_ticket" && (
            <div className={`mt-2 p-2 rounded text-sm ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {isCorrect ? "Correct!" : `The answer is ${q.correctAnswer}. ${q.explanation}`}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <RadioGroup
          value={answers[q.id] || ""}
          onValueChange={(value) => handleAnswer(q.id, value, section)}
        >
          {q.options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${section}-${q.id}-${option}`} />
              <Label htmlFor={`${section}-${q.id}-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        {answers[q.id] && section !== "exit_ticket" && (
          <div className={`mt-2 p-2 rounded text-sm ${answers[q.id] === q.correctAnswer ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {answers[q.id] === q.correctAnswer ? "Correct!" : `The answer is ${q.correctAnswer}. ${q.explanation}`}
          </div>
        )}
      </div>
    );
  };

  const renderWarmup = () => (
    <div className="space-y-6" data-testid="warmup-step">
      <div className="text-center mb-6">
        <Zap className="h-12 w-12 text-amber-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Quick Warm-up</h2>
        <p className="text-muted-foreground">Let's review some concepts from your last session</p>
      </div>
      
      {state.warmupResults.questions.map((q, idx) => (
        <Card key={q.id} className="p-4" data-testid={`warmup-question-${idx}`}>
          <p className="font-medium mb-3">Q{idx + 1}: {q.text}</p>
          {renderQuestionInput(q, "warmup", state.warmupResults.answers)}
        </Card>
      ))}
    </div>
  );

  const renderDBLesson = () => {
    if (!topicContent || !hasDBContent) return renderFallbackLesson();

    const allLessons = topicContent.lessons;
    const currentLesson = allLessons[state.currentLessonIndex] || allLessons[0];
    if (!currentLesson) return renderFallbackLesson();

    const explanationSegments = currentLesson.segments.filter((s) => s.type === "explanation");
    const exampleSegments = currentLesson.segments.filter((s) => s.type === "example");
    const practiceSegments = currentLesson.segments.filter((s) => s.type === "practice");

    return (
      <div className="space-y-6" data-testid="lesson-step">
        <div className="text-center mb-6">
          <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold" data-testid="lesson-title">{currentLesson.title}</h2>
          <p className="text-muted-foreground">{currentLesson.description}</p>
          {currentLesson.objectives && currentLesson.objectives.length > 0 && (
            <div className="mt-3 text-sm text-left max-w-md mx-auto">
              <p className="font-medium text-muted-foreground mb-1">Learning objectives:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                {currentLesson.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {explanationSegments.map((seg) => (
          <Card key={seg.id} className="p-6" data-testid={`segment-explanation-${seg.id}`}>
            <h3 className="text-lg font-semibold mb-4">{seg.title}</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {seg.content}
            </div>
            {seg.tutorScript && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><strong>Mentora says:</strong> {seg.tutorScript}</span>
                </p>
              </div>
            )}
          </Card>
        ))}

        {exampleSegments.map((seg) => (
          <Card key={seg.id} className="p-6 bg-blue-50" data-testid={`segment-example-${seg.id}`}>
            <h3 className="text-lg font-semibold mb-3">{seg.title}</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {seg.content}
            </div>
            {seg.whiteboardContent && (() => {
              try {
                const wb = JSON.parse(seg.whiteboardContent);
                if (wb.steps) {
                  return (
                    <div className="mt-4 space-y-2">
                      {wb.steps.map((step: { label: string; work: string }, i: number) => (
                        <div key={i} className="p-2 bg-white rounded border text-sm">
                          <span className="font-medium text-blue-700">{step.label}:</span>{" "}
                          <code>{step.work}</code>
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}
            {seg.tutorScript && (
              <div className="mt-4 p-3 bg-white/70 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><strong>Mentora says:</strong> {seg.tutorScript}</span>
                </p>
              </div>
            )}
          </Card>
        ))}

        {practiceSegments.map((seg) => (
          <Card key={seg.id} className="p-6 bg-green-50" data-testid={`segment-practice-${seg.id}`}>
            <h3 className="text-lg font-semibold mb-3">{seg.title}</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {seg.content}
            </div>
            {seg.tutorScript && (
              <div className="mt-4 p-3 bg-white/70 rounded-lg border border-green-100">
                <p className="text-sm text-green-800 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><strong>Mentora says:</strong> {seg.tutorScript}</span>
                </p>
              </div>
            )}
          </Card>
        ))}

        {allLessons.length > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={state.currentLessonIndex === 0}
              onClick={() => setState((prev) => ({ ...prev, currentLessonIndex: prev.currentLessonIndex - 1 }))}
              data-testid="prev-lesson-btn"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous Lesson
            </Button>
            <span className="text-sm text-muted-foreground">
              Lesson {state.currentLessonIndex + 1} of {allLessons.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={state.currentLessonIndex === allLessons.length - 1}
              onClick={() => setState((prev) => ({ ...prev, currentLessonIndex: prev.currentLessonIndex + 1 }))}
              data-testid="next-lesson-btn"
            >
              Next Lesson <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderFallbackLesson = () => (
    <div className="space-y-6" data-testid="lesson-step">
      <div className="text-center mb-6">
        <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">{topicName}</h2>
        <p className="text-muted-foreground">Let's learn the key concept</p>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Concept</h3>
        <div className="prose prose-sm max-w-none">
          {subject === "math" ? (
            <>
              <p>A <strong>linear equation</strong> is an equation where the highest power of the variable is 1.</p>
              <p className="mt-2">For example: <code>2x + 5 = 13</code></p>
              <h4 className="mt-4">Steps to Solve:</h4>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Identify the variable (x)</li>
                <li>Move constants to one side</li>
                <li>Divide both sides by the coefficient</li>
              </ol>
            </>
          ) : (
            <>
              <p>A <strong>paragraph</strong> is a group of sentences about one main idea.</p>
              <h4 className="mt-4">Structure:</h4>
              <ol className="list-decimal pl-4 space-y-1">
                <li><strong>Topic Sentence</strong> - introduces the main idea</li>
                <li><strong>Supporting Details</strong> - examples and evidence</li>
                <li><strong>Conclusion</strong> - wraps up the paragraph</li>
              </ol>
            </>
          )}
        </div>
        
        <div className="mt-6 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setState(prev => ({ ...prev, explanationStyle: "visual" }))}>
            <Lightbulb className="h-4 w-4 mr-1" /> Visual
          </Button>
          <Button variant="outline" size="sm" onClick={() => setState(prev => ({ ...prev, explanationStyle: "analogy" }))}>
            <Brain className="h-4 w-4 mr-1" /> Analogy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setState(prev => ({ ...prev, explanationStyle: "step_by_step" }))}>
            <ArrowRight className="h-4 w-4 mr-1" /> Step-by-step
          </Button>
        </div>
      </Card>
      
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3">Worked Example</h3>
        <p className="mb-2">Solve: <code>3x - 4 = 11</code></p>
        <div className="space-y-2 text-sm">
          <p>Step 1: Add 4 to both sides: <code>3x = 15</code></p>
          <p>Step 2: Divide by 3: <code>x = 5</code></p>
          <p className="text-green-600 font-medium">Answer: x = 5</p>
        </div>
      </Card>
    </div>
  );

  const renderLesson = () => {
    if (hasDBContent) return renderDBLesson();
    return renderFallbackLesson();
  };

  const renderPractice = () => (
    <div className="space-y-6" data-testid="practice-step">
      <div className="text-center mb-6">
        <PenTool className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Practice Time</h2>
        <p className="text-muted-foreground">Try these problems on your own</p>
      </div>
      
      {state.practiceResults.questions.map((q, idx) => (
        <Card key={q.id} className="p-4" data-testid={`practice-question-${idx}`}>
          <div className="flex justify-between items-start mb-3">
            <p className="font-medium">Q{idx + 1}: {q.text}</p>
            <Button variant="ghost" size="sm" onClick={requestHint}>
              <HelpCircle className="h-4 w-4 mr-1" /> Hint
            </Button>
          </div>
          {renderQuestionInput(q, "practice", state.practiceResults.answers)}
        </Card>
      ))}
      
      <div className="text-sm text-muted-foreground text-center">
        Hints used: {state.hintsUsed}
      </div>
    </div>
  );

  const renderReflection = () => (
    <div className="space-y-6" data-testid="reflection-step">
      <div className="text-center mb-6">
        <Brain className="h-12 w-12 text-purple-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Reflect on Your Learning</h2>
        <p className="text-muted-foreground">Take a moment to think about what you learned</p>
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">What was the key idea from today's lesson?</Label>
            <Textarea
              className="mt-2"
              placeholder="In my own words, the main concept was..."
              value={state.reflectionText}
              onChange={(e) => setState(prev => ({ ...prev, reflectionText: e.target.value }))}
              rows={3}
              data-testid="reflection-textarea"
            />
          </div>
          <div>
            <Label className="text-base font-medium">Where did you feel stuck or confused?</Label>
            <Textarea
              className="mt-2"
              placeholder="I found it challenging when..."
              rows={3}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderExitTicket = () => (
    <div className="space-y-6" data-testid="exit-ticket-step">
      <div className="text-center mb-6">
        <CheckCircle className="h-12 w-12 text-teal-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Exit Ticket</h2>
        <p className="text-muted-foreground">Show what you've learned</p>
      </div>
      
      {state.exitTicketResults.questions.map((q, idx) => (
        <Card key={q.id} className="p-4" data-testid={`exit-question-${idx}`}>
          <p className="font-medium mb-3">Q{idx + 1}: {q.text}</p>
          {renderQuestionInput(q, "exit_ticket", state.exitTicketResults.answers)}
        </Card>
      ))}
    </div>
  );

  const renderNextStep = () => {
    const warmupScore = calculateScore(state.warmupResults.questions, state.warmupResults.answers);
    const practiceScore = calculateScore(state.practiceResults.questions, state.practiceResults.answers);
    const exitScore = calculateScore(state.exitTicketResults.questions, state.exitTicketResults.answers);
    const timeSpent = Math.floor((Date.now() - state.startTime) / 60000);
    
    if (isWarmupMode) {
      return (
        <div className="space-y-6" data-testid="next-step-step">
          <div className="text-center mb-6">
            <Zap className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Review Complete!</h2>
            <p className="text-muted-foreground">Nice warm-up</p>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Review Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <Star className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold">{warmupScore}%</p>
                <p className="text-xs text-muted-foreground">Review Score</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <CheckCircle className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold">{Object.keys(state.warmupResults.answers).length}/{state.warmupResults.questions.length}</p>
                <p className="text-xs text-muted-foreground">Answered</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-amber-50 border-amber-200">
            <h3 className="text-lg font-semibold mb-2 text-amber-800">Ready to Learn?</h3>
            <p className="text-amber-700 mb-4">
              {warmupScore >= 80 
                ? "Great recall! You're warmed up and ready to continue."
                : "Good effort! Consider reviewing these topics during your next session."}
            </p>
            <Button onClick={handleFinish} className="w-full bg-amber-500 hover:bg-amber-600" data-testid="finish-review-btn">
              Back to Today
            </Button>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6" data-testid="next-step-step">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold">Session Complete!</h2>
          <p className="text-muted-foreground">Great work today</p>
        </div>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mentora's Notes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{timeSpent}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <Star className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{practiceScore}%</p>
              <p className="text-xs text-muted-foreground">Practice Score</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <HelpCircle className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{state.hintsUsed}</p>
              <p className="text-xs text-muted-foreground">Hints Used</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{exitScore >= 80 ? "Pass" : "Review"}</p>
              <p className="text-xs text-muted-foreground">Exit Ticket</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold mb-2 text-green-800">What's Next?</h3>
          <p className="text-green-700 mb-4">
            {exitScore >= 80 
              ? "You've demonstrated good understanding! Ready to move on."
              : "Consider reviewing this topic again before moving on."}
          </p>
          <Button onClick={handleFinish} className="w-full bg-green-600 hover:bg-green-700" data-testid="finish-session-btn">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case "warmup": return renderWarmup();
      case "lesson": return renderLesson();
      case "practice": return renderPractice();
      case "reflection": return renderReflection();
      case "exit_ticket": return renderExitTicket();
      case "next_step": return renderNextStep();
      default: return null;
    }
  };

  if (contentLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6" data-testid="session-flow-page">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground capitalize">{subject} &bull; {topicName}</span>
          <span className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {activeSteps.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2 mb-4" />
        
        <div className="flex justify-between">
          {activeSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === state.currentStep;
            const isComplete = idx < currentStepIndex;
            
            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center ${isActive ? "text-primary" : isComplete ? "text-green-600" : "text-muted-foreground"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isActive ? "bg-primary text-white" : isComplete ? "bg-green-100" : "bg-slate-100"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs hidden md:block">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {renderCurrentStep()}

      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={handlePrevStep}
          disabled={state.currentStep === "warmup"}
          data-testid="prev-step-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {state.currentStep !== "next_step" && (
          <Button onClick={handleNextStep} data-testid="next-step-btn">
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
