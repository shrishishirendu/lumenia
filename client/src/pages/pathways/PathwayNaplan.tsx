import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  FileText,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Target,
  TrendingUp
} from "lucide-react";

export default function PathwayNaplan() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="pathway-naplan-page">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-serif font-bold text-foreground">Lumenia</span>
            </div>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" data-testid="header-login-btn">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="back-to-home-btn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </Link>

          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="pathway-title">
              NAPLAN Preparation
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              NAPLAN tests are a regular part of schooling in Australia, and we believe preparation 
              should be calm and supportive — not stressful. Lumenia helps students in Years 3, 5, 7, 
              and 9 build confidence in literacy and numeracy through consistent, low-pressure practice 
              that fits into their everyday learning.
            </p>
          </div>

          <Card className="border-2 mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                What students do here
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Practice reading comprehension, spelling, grammar, and punctuation with 
                    Australian-style questions.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Work through numeracy problems that match the format and difficulty of 
                    actual NAPLAN assessments.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Build familiarity with test formats so there are no surprises on the day, 
                    reducing anxiety and improving performance.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Our approach</h3>
                <p className="text-sm text-muted-foreground">
                  Short, regular sessions with Mentora help students build skills gradually. 
                  We focus on understanding, not just test-taking tricks — so the confidence 
                  they build lasts beyond NAPLAN.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/onboarding">
              <Button size="lg" className="px-8 h-14 text-lg rounded-full shadow-lg" data-testid="start-pathway-btn">
                <Target className="mr-2 h-5 w-5" />
                Start this pathway
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5" />
            <span className="font-serif font-bold">Lumenia</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Lumenia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
