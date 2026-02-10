import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  RotateCcw,
  Trophy,
  Zap,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import TopicNotesDrawer from "@/components/TopicNotesDrawer";

interface PracticeQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: number;
  points: number;
}

interface QuestionsResponse {
  questions: PracticeQuestion[];
  total: number;
  distribution: Record<string, number>;
}

const DIFFICULTY_CONFIG: Record<number, { label: string; color: string; bg: string; icon: React.ElementType; description: string }> = {
  1: { label: "Level 1 — Easy", color: "text-green-600", bg: "bg-green-100", icon: Zap, description: "One-step equations" },
  2: { label: "Level 2 — Medium", color: "text-blue-600", bg: "bg-blue-100", icon: BookOpen, description: "Two-step equations" },
  3: { label: "Level 3 — Medium-Hard", color: "text-amber-600", bg: "bg-amber-100", icon: Target, description: "Brackets & negatives" },
  4: { label: "Level 4 — Hard", color: "text-orange-600", bg: "bg-orange-100", icon: Lightbulb, description: "Word problems" },
  5: { label: "Level 5 — Challenge", color: "text-red-600", bg: "bg-red-100", icon: Star, description: "Mixed challenge" },
};

export default function Practice() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<"browse" | "quiz" | "results">("browse");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<{ questionId: number; correct: boolean; userAnswer: string }[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<PracticeQuestion[]>([]);

  const topicId = 1;

  const { data: questionsData, isLoading } = useQuery<QuestionsResponse>({
    queryKey: ["/api/topics", topicId, "questions", selectedDifficulty],
    queryFn: async () => {
      const url = selectedDifficulty
        ? `/api/topics/${topicId}/questions?difficulty=${selectedDifficulty}`
        : `/api/topics/${topicId}/questions`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const distribution = questionsData?.distribution || {};
  const questions = questionsData?.questions || [];

  const shuffleQuestions = (qs: PracticeQuestion[], count: number) => {
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const startQuiz = (difficulty: number | null) => {
    const pool = difficulty ? questions.filter(q => q.difficulty === difficulty) : questions;
    const count = Math.min(pool.length, 10);
    if (count === 0) return;
    const selected = shuffleQuestions(pool, count);
    setQuizQuestions(selected);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowExplanation(false);
    setAnswered(false);
    setResults([]);
    setQuizState("quiz");
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    const current = quizQuestions[currentIndex];
    const normalise = (s: string) => s.replace(/\s+/g, "").replace(/^x=/i, "").toLowerCase();
    const isCorrect = normalise(userAnswer) === normalise(current.correctAnswer);
    setResults(prev => [...prev, { questionId: current.id, correct: isCorrect, userAnswer: userAnswer.trim() }]);
    setAnswered(true);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= quizQuestions.length) {
      setQuizState("results");
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setUserAnswer("");
    setShowExplanation(false);
    setAnswered(false);
  };

  const resetQuiz = () => {
    setQuizState("browse");
    setCurrentIndex(0);
    setResults([]);
    setQuizQuestions([]);
    setUserAnswer("");
    setShowExplanation(false);
    setAnswered(false);
  };

  const score = results.filter(r => r.correct).length;
  const totalPoints = results.reduce((sum, r, i) => sum + (r.correct ? quizQuestions[i]?.points || 1 : 0), 0);

  if (quizState === "results") {
    const percent = Math.round((score / quizQuestions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6" data-testid="practice-results">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center">
            <CardContent className="p-8 space-y-4">
              <Trophy className={`w-16 h-16 mx-auto ${percent >= 80 ? "text-yellow-500" : percent >= 50 ? "text-blue-500" : "text-muted-foreground"}`} />
              <h2 className="text-2xl font-bold" data-testid="results-title">Practice Complete!</h2>
              <div className="text-4xl font-bold text-primary" data-testid="results-score">{score}/{quizQuestions.length}</div>
              <p className="text-muted-foreground">{percent}% correct &middot; {totalPoints} points earned</p>
              <Progress value={percent} className="h-3 max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">
                {percent >= 80 ? "Excellent work! You've got a strong grasp of this level." :
                 percent >= 50 ? "Good effort! Review the explanations below to strengthen your understanding." :
                 "Keep practising! Review each explanation carefully and try again."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Review Answers</h3>
          {quizQuestions.map((q, i) => {
            const result = results[i];
            return (
              <Card key={q.id} className={`border-l-4 ${result?.correct ? "border-l-green-500" : "border-l-red-400"}`} data-testid={`review-question-${i}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {result?.correct ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="font-medium">{q.questionText}</p>
                      {!result?.correct && (
                        <p className="text-sm text-red-600 mt-1">Your answer: {result?.userAnswer}</p>
                      )}
                      <p className="text-sm text-green-700 mt-1">Correct: {q.correctAnswer}</p>
                      {q.explanation && <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded p-2">{q.explanation}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={resetQuiz} className="gap-2" data-testid="back-to-levels-btn">
            <ArrowLeft className="w-4 h-4" /> Back to Levels
          </Button>
          <Button onClick={() => startQuiz(selectedDifficulty)} className="gap-2" data-testid="try-again-btn">
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (quizState === "quiz" && quizQuestions.length > 0) {
    const current = quizQuestions[currentIndex];
    const diffConfig = DIFFICULTY_CONFIG[current.difficulty];
    const currentResult = results[currentIndex];

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6" data-testid="practice-quiz">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={resetQuiz} className="gap-1" data-testid="exit-quiz-btn">
            <ArrowLeft className="w-4 h-4" /> Exit
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={`${diffConfig.bg} ${diffConfig.color} border-0`}>{diffConfig.label}</Badge>
            <TopicNotesDrawer topicId={topicId} topicTitle="Linear Equations" triggerVariant="button" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {quizQuestions.length}</span>
            <span>{current.points} {current.points === 1 ? "point" : "points"}</span>
          </div>
          <Progress value={((currentIndex + 1) / quizQuestions.length) * 100} className="h-2" />
        </div>

        <motion.div key={current.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="text-xl font-semibold leading-relaxed" data-testid="question-text">{current.questionText}</h2>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Your answer:</label>
                <Input
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="e.g. x = 5"
                  disabled={answered}
                  onKeyDown={e => { if (e.key === "Enter" && !answered) checkAnswer(); }}
                  className="text-lg"
                  autoFocus
                  data-testid="answer-input"
                />
              </div>

              {!answered ? (
                <Button onClick={checkAnswer} disabled={!userAnswer.trim()} className="w-full gap-2" data-testid="check-answer-btn">
                  <CheckCircle className="w-4 h-4" /> Check Answer
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${currentResult?.correct ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`} data-testid="answer-feedback">
                      {currentResult?.correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      <span className="font-medium">{currentResult?.correct ? "Correct!" : `Not quite. The answer is ${current.correctAnswer}`}</span>
                    </div>

                    {showExplanation && current.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm" data-testid="explanation">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="text-blue-800">{current.explanation}</span>
                        </div>
                      </div>
                    )}

                    <Button onClick={nextQuestion} className="w-full gap-2" data-testid="next-question-btn">
                      {currentIndex + 1 >= quizQuestions.length ? "See Results" : "Next Question"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-center gap-1.5">
          {quizQuestions.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i < results.length
                  ? results[i]?.correct ? "bg-green-500" : "bg-red-400"
                  : i === currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="practice-page">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="practice-title">Practice Question Bank</h1>
        <p className="text-muted-foreground">
          Year 9 Mathematics &mdash; Linear Equations
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {questionsData?.total || 0} questions across 5 difficulty levels
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Choose a Difficulty Level</h2>
            <TopicNotesDrawer topicId={topicId} topicTitle="Linear Equations" triggerVariant="button" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map(level => {
              const config = DIFFICULTY_CONFIG[level];
              const Icon = config.icon;
              const count = distribution[level] || 0;
              return (
                <motion.div key={level} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: level * 0.05 }}>
                  <Card
                    className="hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => { setSelectedDifficulty(level); startQuiz(level); }}
                    data-testid={`difficulty-card-${level}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.bg} ${config.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{config.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{count} questions</Badge>
                            <Badge variant="outline" className="text-xs">{level} pts each</Badge>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card
                className="hover:shadow-md transition-all cursor-pointer group border-dashed border-2"
                onClick={() => { setSelectedDifficulty(null); startQuiz(null); }}
                data-testid="difficulty-card-all"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Mixed — All Levels</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Random questions from all levels</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{questionsData?.total || 0} questions</Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
