import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GraduationCap, 
  Zap, 
  BookOpen, 
  ClipboardCheck, 
  Users, 
  Shield, 
  Heart,
  ChevronDown,
  CheckCircle,
  Loader2,
  ArrowRight,
  FileText,
  Brain,
  Target
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PublicLanding() {
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    childYearLevel: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const leadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/leads", {
        parentName: data.parentName,
        email: data.email,
        childYearLevel: parseInt(data.childYearLevel),
        message: data.message || null
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.parentName && formData.email && formData.childYearLevel) {
      leadMutation.mutate(formData);
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="public-landing">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold text-foreground">Lumenia</span>
          </div>
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              How it works
            </button>
            <button 
              onClick={() => scrollToSection("mentora")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Meet Mentora
            </button>
            <Link href="/login">
              <Button variant="outline" size="sm" data-testid="header-login-btn">
                Log in
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 pt-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6" data-testid="hero-title">
            Lumenia
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Guided learning for Years 6–12 — calm, personal, effective.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 h-14 rounded-full shadow-lg"
              onClick={() => scrollToSection("early-access")}
              data-testid="cta-early-access"
            >
              Request early access
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 h-14 rounded-full"
              onClick={() => scrollToSection("how-it-works")}
              data-testid="cta-how-it-works"
            >
              See how it works
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4">
            How Lumenia Works
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            A structured, supportive learning experience that builds real understanding.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Warm-up Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Start each session with a quick 2-minute review. This helps Mentora understand what to focus on today.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Micro-lesson + Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bite-sized explanations followed by guided practice problems. Mentora adapts to your child's pace.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <ClipboardCheck className="h-7 w-7 text-green-600" />
                </div>
                <CardTitle className="text-xl">Mentora's Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After each session, receive clear notes on what was covered, what's improving, and what to work on next.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mentora Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Meet Mentora
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Mentora is your child's personal learning guide within Lumenia. Using the Socratic method, 
            Mentora asks thoughtful questions to help students discover answers themselves — building 
            real understanding, not just quick fixes.
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Patient, encouraging, and always available. Mentora adjusts to your child's learning style 
            and pace, creating a calm space for genuine growth.
          </p>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-12">
            Subjects
          </h2>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-3 px-6 py-4 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-2xl">📐</span>
              <span className="font-semibold text-lg">Mathematics</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-purple-50 rounded-xl border border-purple-100">
              <span className="text-2xl">📚</span>
              <span className="font-semibold text-lg">English</span>
            </div>
          </div>
          
          <p className="text-muted-foreground">
            More subjects coming soon — Science, History, and more.
          </p>
        </div>
      </section>

      {/* Australian Learning Pathways */}
      <section id="pathways" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4">
            Australian Learning Pathways
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Structured support for key milestones in your child's education.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/30 transition-all hover:shadow-lg group" data-testid="pathway-card-naplan">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">NAPLAN (Years 3, 5, 7, 9)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Build strong literacy and numeracy with Australian-style practice.
                </p>
                <Link href="/pathways/naplan">
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" data-testid="pathway-btn-naplan">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/30 transition-all hover:shadow-lg group" data-testid="pathway-card-selective">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Selective Readiness (Years 4–6)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Reasoning, comprehension, and timed practice — guided, not pressured.
                </p>
                <Link href="/pathways/selective">
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" data-testid="pathway-btn-selective">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/30 transition-all hover:shadow-lg group" data-testid="pathway-card-atar">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Senior Years (Year 11–12, ATAR)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  ATAR-focused learning journey (more subjects coming).
                </p>
                <Link href="/pathways/atar">
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" data-testid="pathway-btn-atar">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Parent Reassurance */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-16">
            Built with Parents in Mind
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Human-in-the-Loop</h3>
              <p className="text-muted-foreground text-sm">
                Real tutors review progress and are available when your child needs extra support.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Weekly Progress Summaries</h3>
              <p className="text-muted-foreground text-sm">
                Stay informed with clear, jargon-free updates on what your child is learning.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Safe & Private</h3>
              <p className="text-muted-foreground text-sm">
                Strict guardrails, no ads, and privacy-first design. Your child's data is protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="early-access" className="py-24 px-6 bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4">
            Request Early Access
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-10">
            Be among the first families to experience Lumenia. We'll be in touch soon.
          </p>
          
          {submitted ? (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
                <p className="text-muted-foreground">
                  We'll contact you soon with early access details.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Your name</Label>
                    <Input 
                      id="parentName"
                      placeholder="Jane Smith"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      required
                      data-testid="input-parent-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearLevel">Child's year level</Label>
                    <Select 
                      value={formData.childYearLevel} 
                      onValueChange={(val) => setFormData({ ...formData, childYearLevel: val })}
                    >
                      <SelectTrigger id="yearLevel" data-testid="select-year-level">
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea 
                      id="message"
                      placeholder="Tell us about your child's learning goals..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="min-h-[80px]"
                      data-testid="input-message"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base" 
                    disabled={leadMutation.isPending}
                    data-testid="button-submit-lead"
                  >
                    {leadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Request Early Access"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <GraduationCap className="h-6 w-6" />
            <span className="font-serif font-bold text-xl">Lumenia</span>
          </div>
          
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms
            </Link>
          </div>
          
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Lumenia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
