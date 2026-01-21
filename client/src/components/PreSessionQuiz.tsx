import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestion {
  id?: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

interface QuizResult {
  questionId: number;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}

interface PreSessionQuizProps {
  onComplete: (passed: boolean, score: number) => void;
  onSkip: () => void;
}

export function PreSessionQuiz({ onComplete, onSkip }: PreSessionQuizProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    results: QuizResult[];
  } | null>(null);
  const [noQuiz, setNoQuiz] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const response = await fetch("/api/quiz/pre-session");
      if (!response.ok) throw new Error("Failed to fetch quiz");
      
      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        setNoQuiz(true);
        setLoading(false);
        return;
      }
      
      setQuestions(data.questions);
      setLessonTitle(data.lessonTitle || "Previous Lesson");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setNoQuiz(true);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    
    try {
      const answersArray = questions.map((q, idx) => ({
        questionId: q.id || idx,
        answer: answers[idx] || ""
      }));

      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizType: "pre_session",
          answers: answersArray
        })
      });

      if (response.ok) {
        const resultData = await response.json();
        setResults(resultData);
      } else {
        const simpleScore = Object.values(answers).filter(Boolean).length;
        const passed = simpleScore >= Math.ceil(questions.length * 0.7);
        setResults({
          score: simpleScore,
          totalPoints: questions.length,
          percentage: Math.round((simpleScore / questions.length) * 100),
          passed,
          results: []
        });
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      const simpleScore = Object.values(answers).filter(Boolean).length;
      setResults({
        score: simpleScore,
        totalPoints: questions.length,
        percentage: Math.round((simpleScore / questions.length) * 100),
        passed: simpleScore >= Math.ceil(questions.length * 0.7),
        results: []
      });
    }
  };

  const handleContinue = () => {
    if (results) {
      onComplete(results.passed, results.percentage);
    } else {
      onComplete(true, 100);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading review quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (noQuiz) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <BookOpen className="w-12 h-12 text-primary" />
          <h2 className="text-xl font-semibold">Ready to Learn!</h2>
          <p className="text-muted-foreground text-center">
            No review quiz today - let's dive right into your lesson!
          </p>
          <Button onClick={() => onSkip()} className="mt-4" data-testid="button-skip-quiz">
            Start Lesson <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (results) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            Ready to Continue
          </CardTitle>
          <CardDescription>
            Warm-up complete: {lessonTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <p className="text-lg font-medium text-foreground">
              {results.passed 
                ? "You've got a good handle on this material. Let's build on what you know!" 
                : "You're making progress. We'll revisit these ideas as we go."}
            </p>
          </div>
          
          <Button 
            onClick={handleContinue} 
            className="w-full"
            data-testid="button-continue-lesson"
          >
            Continue Learning <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = Object.keys(answers).length === questions.length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Quick Warm-up
        </CardTitle>
        <CardDescription>
          Let's revisit: {lessonTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{currentQuestionIndex + 1} of {questions.length}</span>
          <Button variant="ghost" size="sm" onClick={onSkip} data-testid="button-skip-quiz">
            Skip for now
          </Button>
        </div>

        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 flex-1 rounded-full transition-colors ${
                idx < currentQuestionIndex ? 'bg-primary' :
                idx === currentQuestionIndex ? 'bg-primary/60' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-lg font-medium" data-testid="text-question">
              {currentQuestion.questionText}
            </p>

            <RadioGroup
              value={answers[currentQuestionIndex] || ""}
              onValueChange={handleAnswerSelect}
              className="space-y-3"
            >
              {currentQuestion.options?.map((option, idx) => (
                <div 
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${idx}`}
                    data-testid={`radio-option-${idx}`}
                  />
                  <Label 
                    htmlFor={`option-${idx}`} 
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 pt-4">
          {isLastQuestion ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!answers[currentQuestionIndex] || submitted}
              className="flex-1"
              data-testid="button-submit-quiz"
            >
              {submitted ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!answers[currentQuestionIndex]}
              className="flex-1"
              data-testid="button-next-question"
            >
              Next Question <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
