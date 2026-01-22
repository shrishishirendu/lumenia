import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function Privacy() {
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
        <h1 className="text-4xl font-serif font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">Our Commitment to Privacy</h2>
            <p className="text-muted-foreground">
              At Lumenia, we take the privacy of students and families seriously. 
              This policy explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Account information (name, email, year level)</li>
              <li>Learning progress and session data</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide personalized learning experiences</li>
              <li>To track progress and generate reports for parents</li>
              <li>To improve our educational content and platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Protection</h2>
            <p className="text-muted-foreground">
              We use industry-standard security measures to protect your data. 
              We never sell personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about our privacy practices, please contact us at privacy@lumenia.au
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
