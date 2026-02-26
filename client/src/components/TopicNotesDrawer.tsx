import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Calculator } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";

interface TopicNotesData {
  id: number;
  topicId: number;
  summary: string;
  notesMarkdown: string;
  keyFormulas: string[] | null;
  commonMistakes: string[] | null;
}

interface TopicNotesDrawerProps {
  topicId: number;
  topicTitle?: string;
  triggerVariant?: "icon" | "button";
}

export default function TopicNotesDrawer({ topicId, topicTitle, triggerVariant = "button" }: TopicNotesDrawerProps) {
  const { data: notes, isLoading } = useQuery<TopicNotesData | null>({
    queryKey: ["/api/topics", topicId, "notes"],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/notes`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!topicId,
  });

  if (!notes && !isLoading) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {triggerVariant === "icon" ? (
          <Button variant="outline" size="icon" className="shrink-0" data-testid={`notes-trigger-${topicId}`} title="View Notes">
            <FileText className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5" data-testid={`notes-trigger-${topicId}`}>
            <FileText className="w-3.5 h-3.5" /> Notes
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" data-testid={`notes-panel-${topicId}`}>
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {topicTitle || "Topic Notes"}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : notes ? (
          <div className="space-y-6 pb-8">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4" data-testid="notes-summary">
              <p className="text-sm font-medium text-primary mb-1">Quick Summary</p>
              <p className="text-foreground/90">{notes.summary}</p>
            </div>

            <div data-testid="notes-content">
              <MarkdownContent content={notes.notesMarkdown} className="dark:prose-invert" />
            </div>

            {notes.keyFormulas && notes.keyFormulas.length > 0 && (
              <div className="space-y-2" data-testid="notes-formulas">
                <h3 className="font-semibold flex items-center gap-2 text-base">
                  <Calculator className="w-4 h-4 text-blue-500" /> Key Formulas
                </h3>
                <div className="space-y-1.5">
                  {notes.keyFormulas.map((formula, i) => (
                    <Badge key={i} variant="secondary" className="mr-2 mb-1 text-sm font-mono px-3 py-1">
                      {formula}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {notes.commonMistakes && notes.commonMistakes.length > 0 && (
              <div className="space-y-2" data-testid="notes-mistakes">
                <h3 className="font-semibold flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Common Mistakes
                </h3>
                <ul className="space-y-2">
                  {notes.commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
