import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-serif font-bold text-xl">Lumenia</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-serif font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">Welcome to Lumenia</h2>
            <p className="text-muted-foreground">
              By using Lumenia, you agree to these terms. Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Use of Service</h2>
            <p className="text-muted-foreground">
              Lumenia provides educational tutoring services for students in Years 6-12. 
              Our platform is designed to supplement, not replace, classroom education.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">User Accounts</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You must provide accurate information when creating an account</li>
              <li>Parents/guardians must create accounts for students under 18</li>
              <li>You are responsible for maintaining the security of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Educational Content</h2>
            <p className="text-muted-foreground">
              All educational content on Lumenia is aligned with the Australian Curriculum. 
              Content is for personal educational use only and may not be redistributed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
            <p className="text-muted-foreground">
              Users must use Lumenia respectfully and in accordance with Australian law. 
              Any misuse may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-muted-foreground">
              For questions about these terms, please contact us at support@lumenia.au
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 px-6 border-t bg-white">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lumenia. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
