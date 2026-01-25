import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Brain,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Target,
  Clock
} from "lucide-react";

export default function PathwaySelective() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="pathway-selective-page">
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
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="pathway-title">
              Selective School Readiness
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Preparing for selective school tests can feel overwhelming for families. Lumenia 
              offers a thoughtful, pressure-free approach for students in Years 4–6. We focus 
              on building genuine reasoning and comprehension skills — not cramming or high-pressure 
              drilling.
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
                    Develop abstract reasoning and problem-solving skills through carefully 
                    designed exercises that make thinking visible.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Practice reading comprehension with passages and questions that build 
                    inference and critical thinking abilities.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Build comfort with timed conditions gradually — at their own pace, 
                    with Mentora's encouragement along the way.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Guided, not pressured</h3>
                <p className="text-sm text-muted-foreground">
                  We believe that real preparation happens over time, not in last-minute cramming. 
                  Mentora works with students at a sustainable pace, building confidence alongside 
                  skills.
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
