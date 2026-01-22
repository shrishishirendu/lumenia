import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import heroBg from "@assets/generated_images/abstract_education_tech_background.png";
import teacherAvatar from "@assets/generated_images/photorealistic_female_teacher_avatar.png";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

export default function Landing() {
  const { user, login } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="font-serif text-2xl font-bold tracking-tight">Lumenia</div>
        <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/classroom">
                  <Button className="rounded-full px-6">My Classroom</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs text-muted-foreground">Sign in with:</span>
                  <a href="/api/login" className="p-2 rounded-full hover:bg-muted transition-colors" title="Google">
                    <GoogleIcon />
                  </a>
                  <a href="/api/login" className="p-2 rounded-full hover:bg-muted transition-colors" title="GitHub">
                    <GitHubIcon />
                  </a>
                  <a href="/api/login" className="p-2 rounded-full hover:bg-muted transition-colors" title="Apple">
                    <AppleIcon />
                  </a>
                </div>
                <a href="/api/login">
                  <Button className="rounded-full px-6" data-testid="button-start-learning">Start Learning</Button>
                </a>
              </>
            )}
            <Link href="/parent">
                <Button variant="ghost" className="rounded-full px-6">Parents</Button>
            </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 pt-12 pb-20 flex flex-col md:flex-row items-center gap-12">
        
        {/* Text Content */}
        <div className="flex-1 space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Mentora Available 24/7
                </div>
                <h1 className="text-6xl md:text-7xl font-serif font-medium leading-[1.1] mb-6">
                    Guided Learning,<br/>
                    <span className="text-primary italic">Done Right</span>.
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                    Meet Mentora, your child's personal learning guide. 
                    Real-time voice interaction, patient guidance, and curriculum-aligned support for Years 6-12.
                </p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <Link href="/classroom">
                    <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                        Start Demo Session <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg bg-white/50 backdrop-blur-sm hover:bg-white/80 border-white/40">
                    <Play className="mr-2 w-4 h-4" /> Watch Video
                </Button>
            </motion.div>

            <div className="pt-8 flex items-center gap-8 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    WolframAlpha Certified
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    K-12 Curriculum
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Multimodal Voice
                </div>
            </div>
        </div>

        {/* Visual Hero */}
        <div className="flex-1 w-full max-w-lg md:max-w-xl relative">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/20 aspect-[4/5]"
            >
                <img src={teacherAvatar} alt="Virtual Tutor" className="w-full h-full object-cover" />
                
                {/* Floating UI Elements */}
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute top-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 max-w-[200px]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Analysis</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">"That's a great start! Try isolating x next."</p>
                </motion.div>

                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/10 flex items-center gap-4 text-white"
                >
                   <div className="flex gap-1 h-4 items-end">
                        {[1,2,3,4,3,2].map((h, i) => (
                            <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: h * 4 }} />
                        ))}
                   </div>
                   <span className="text-sm font-medium">Listening...</span>
                </motion.div>
            </motion.div>

            {/* Decor elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/30 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
        </div>

      </main>
    </div>
  );
}
