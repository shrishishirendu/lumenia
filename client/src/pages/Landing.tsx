import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import heroBg from "@assets/generated_images/abstract_education_tech_background.png";
import teacherAvatar from "@assets/generated_images/photorealistic_female_teacher_avatar.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="font-serif text-2xl font-bold tracking-tight">Virtual Human.</div>
        <div className="flex gap-4">
            <Link href="/dashboard">
                <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/classroom">
                <Button className="rounded-full px-6">Start Learning</Button>
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
                    Live AI Tutors Available 24/7
                </div>
                <h1 className="text-6xl md:text-7xl font-serif font-medium leading-[1.1] mb-6">
                    A Tutor with a <br/>
                    <span className="text-primary italic">Human Heart</span>.
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                    Experience the Socratic method with a photorealistic AI avatar. 
                    Real-time voice interaction, emotional intelligence, and 100% accurate math guidance.
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
