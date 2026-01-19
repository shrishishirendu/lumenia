import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [grade, setGrade] = useState("9");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    fetch("/api/auth/check")
      .then(res => res.json())
      .then(data => {
        if (!data.loggedIn) {
          window.location.replace("/api/login");
        }
      })
      .catch(() => {
        window.location.replace("/api/login");
      });
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          grade: parseInt(grade), 
          role 
        })
      });

      if (!response.ok) throw new Error("Failed to create profile");

      toast({
        title: "Welcome!",
        description: "Your profile is ready. Let's start learning!"
      });

      setLocation("/classroom");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Welcome to Virtual Human</CardTitle>
          <p className="text-muted-foreground">Tell us a bit about yourself</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">I am a...</Label>
            <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-3">
              <Label 
                className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${role === 'student' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                data-testid="radio-role-student"
              >
                <RadioGroupItem value="student" className="sr-only" />
                <span>Student</span>
              </Label>
              <Label 
                className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${role === 'parent' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                data-testid="radio-role-parent"
              >
                <RadioGroupItem value="parent" className="sr-only" />
                <span>Parent</span>
              </Label>
            </RadioGroup>
          </div>

          {role === "student" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">What year are you in?</Label>
              <RadioGroup value={grade} onValueChange={setGrade} className="grid grid-cols-4 gap-2">
                {["9", "10", "11", "12"].map((g) => (
                  <Label 
                    key={g}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${grade === g ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                    data-testid={`radio-grade-${g}`}
                  >
                    <RadioGroupItem value={g} className="sr-only" />
                    <span>Year {g}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleSubmit}
            disabled={loading}
            data-testid="button-complete-onboarding"
          >
            {loading ? "Setting up..." : "Start Learning"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
