import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, 
  ArrowLeft,
  School,
  Shield,
  Users,
  BarChart3,
  CheckCircle
} from "lucide-react";

export default function SchoolComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="school-coming-soon-page">
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
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="back-to-home-btn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </Link>

          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <School className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="page-title">
              Schools — Coming Soon
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              We're building safe, scalable features designed specifically for schools. 
              Lumenia will offer structured learning pathways with visibility for teachers, 
              administrators, and parents.
            </p>
          </div>

          <Card className="border-2 mb-8 text-left">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">What we're building for schools</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">
                    Privacy-first platform with strict guardrails and content moderation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">
                    Class management with teacher oversight and parent visibility
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">
                    Progress dashboards aligned with Australian Curriculum standards
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 bg-slate-50 mb-8">
            <CardContent className="pt-6">
              {submitted ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <p className="font-medium text-foreground">Thank you for your interest!</p>
                  <p className="text-sm text-muted-foreground">We'll be in touch when school features are ready.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Interested? Leave your email and we'll notify you when school features launch.
                  </p>
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="school@example.edu.au"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                      data-testid="school-email-input"
                    />
                    <Button type="submit" data-testid="school-notify-btn">
                      Notify me
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          <Link href="/">
            <Button variant="outline" size="lg" className="rounded-full" data-testid="go-back-btn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </Link>
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
