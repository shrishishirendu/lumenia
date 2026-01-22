import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Calculator, 
  PenTool, 
  ArrowRight,
  Star,
  Clock
} from "lucide-react";
import { TOPIC_CATALOG, TopicConfig } from "@shared/topicCatalog";

export default function Practice() {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<"math" | "english">("math");

  const subjectConfig = TOPIC_CATALOG[selectedSubject];
  const topics: TopicConfig[] = subjectConfig?.topics || [];

  const handleStartPractice = (topicId: string) => {
    setLocation(`/student/session/${selectedSubject}/${topicId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="practice-page">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Practice</h1>
        <p className="text-muted-foreground">
          Choose a topic to practice and build your skills
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        <Button
          variant={selectedSubject === "math" ? "default" : "outline"}
          onClick={() => setSelectedSubject("math")}
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

      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <Card 
            key={topic.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleStartPractice(topic.id)}
            data-testid={`topic-card-${topic.id}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                    <CardDescription>
                      Years {topic.gradeRange[0]}-{topic.gradeRange[1]}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{topic.estimatedMinutes}m</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>~15 min</span>
                </div>
                <Button size="sm" variant="ghost" className="gap-1">
                  Start
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No topics available for this subject yet.</p>
        </div>
      )}
    </div>
  );
}
