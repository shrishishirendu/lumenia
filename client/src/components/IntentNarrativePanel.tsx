import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, AlertTriangle, CheckCircle, Info, StopCircle } from "lucide-react";
import type { IntentNarrative } from "@/lib/marketingAgentModels";

interface IntentNarrativePanelProps {
  narrative: IntentNarrative | null;
  isLoading?: boolean;
}

export function IntentNarrativePanel({ narrative, isLoading }: IntentNarrativePanelProps) {
  if (isLoading) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Generating intent narrative...</div>
        </CardContent>
      </Card>
    );
  }

  if (!narrative) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-8 text-center">
          <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No current intent. Click "Analyze Situation" to generate.</p>
        </CardContent>
      </Card>
    );
  }

  const isStabilization = narrative.headline.toLowerCase().includes("stabilize");
  const isMaintenance = narrative.headline.toLowerCase().includes("maintain");

  return (
    <Card className={`border-2 ${isStabilization ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" : isMaintenance ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-green-500 bg-green-50/50 dark:bg-green-950/20"}`} data-testid="intent-narrative-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Marketing Intent
          </div>
          <Badge variant={isStabilization ? "destructive" : isMaintenance ? "secondary" : "default"}>
            {isStabilization ? "Stabilization Mode" : isMaintenance ? "Maintenance Mode" : "Growth Mode"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-background/80 rounded-lg border">
          <p className="text-lg font-medium leading-relaxed" data-testid="intent-headline">
            {narrative.headline}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-500" /> Why Now
            </h4>
            <ul className="space-y-1 text-sm">
              {narrative.whyNow.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-1 text-green-500 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Assumptions
            </h4>
            <ul className="space-y-1 text-sm">
              {narrative.assumptions.map((assumption, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <StopCircle className="h-4 w-4 text-red-500" /> Stop Conditions
            </h4>
            <ul className="space-y-1 text-sm">
              {narrative.stopConditions.map((condition, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500">⚠</span>
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
