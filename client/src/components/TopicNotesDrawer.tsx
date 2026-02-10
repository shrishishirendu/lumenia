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

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>;
        }
        if (/^\d+\.\s/.test(line)) {
          const text = line.replace(/^\d+\.\s/, "");
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-muted-foreground font-medium shrink-0">{line.match(/^\d+/)?.[0]}.</span>
              <span className="text-foreground/90">{renderInline(text)}</span>
            </div>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="text-muted-foreground shrink-0">•</span>
              <span className="text-foreground/90">{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-foreground/90 leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
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
              <MarkdownRenderer content={notes.notesMarkdown} />
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
