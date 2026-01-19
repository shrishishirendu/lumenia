import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import teacherAvatar from "@assets/generated_images/photorealistic_female_teacher_avatar.png";

interface AvatarVideoProps {
  isSpeaking: boolean;
  isListening: boolean;
  emotion?: "neutral" | "happy" | "thinking";
}

export function AvatarVideo({ isSpeaking, isListening, emotion = "neutral" }: AvatarVideoProps) {
  const [mouthOpen, setMouthOpen] = useState(0);
  
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }
    
    const interval = setInterval(() => {
      setMouthOpen(Math.random() * 0.8 + 0.2);
    }, 120);
    
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border border-white/10 group">
      {/* Ambient lighting effect */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-0" />

      {/* The Avatar Image */}
      <motion.img 
        src={teacherAvatar} 
        alt="Ms. Chen - AI Tutor" 
        className="absolute inset-0 w-full h-full object-cover z-10"
        animate={{ 
          scale: isSpeaking ? 1.01 : 1,
          y: isSpeaking ? [0, -2, 0] : 0
        }}
        transition={{ 
          scale: { duration: 0.3 },
          y: { duration: 0.4, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }
        }}
      />

      {/* Lip-sync overlay - animated mouth area */}
      {isSpeaking && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Mouth animation overlay positioned on lower face area */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-16 h-8"
            style={{ bottom: "32%", left: "50%" }}
            animate={{
              scaleY: [1, 1 + mouthOpen * 0.5, 1],
              scaleX: [1, 1 - mouthOpen * 0.15, 1]
            }}
            transition={{ duration: 0.1 }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-b from-transparent via-black/10 to-black/20 blur-sm" />
          </motion.div>
          
          {/* Subtle jaw movement shadow */}
          <motion.div
            className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-24 h-6"
            animate={{
              y: mouthOpen * 3,
              opacity: mouthOpen * 0.3
            }}
            transition={{ duration: 0.08 }}
          >
            <div className="w-full h-full bg-black/10 rounded-full blur-md" />
          </motion.div>
        </div>
      )}

      {/* Speaking glow effect */}
      {isSpeaking && (
        <motion.div 
          className="absolute inset-0 z-15"
          animate={{ 
            boxShadow: [
              "inset 0 0 60px rgba(var(--primary-rgb), 0.05)",
              "inset 0 0 80px rgba(var(--primary-rgb), 0.1)",
              "inset 0 0 60px rgba(var(--primary-rgb), 0.05)"
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Listening indicator - ear glow */}
      {isListening && !isSpeaking && (
        <motion.div 
          className="absolute top-[30%] right-[15%] w-8 h-8 rounded-full bg-green-400/30 blur-lg z-20"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Status Badge */}
      <div className="absolute bottom-4 left-4 z-30">
        <motion.div 
          className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl flex items-center gap-2 ${
            isSpeaking 
              ? "bg-primary/30 border border-primary/40 text-white shadow-lg shadow-primary/20" 
              : isListening 
                ? "bg-green-500/30 border border-green-500/40 text-white shadow-lg shadow-green-500/20"
                : "bg-white/10 border border-white/20 text-white/80"
          }`}
          animate={{ 
            scale: isSpeaking || isListening ? [1, 1.02, 1] : 1 
          }}
          transition={{ duration: 1, repeat: isSpeaking || isListening ? Infinity : 0 }}
        >
          <motion.div 
            className={`w-2 h-2 rounded-full ${
              isSpeaking ? "bg-primary" : isListening ? "bg-green-400" : "bg-white/50"
            }`}
            animate={{ 
              scale: isSpeaking || isListening ? [1, 1.5, 1] : 1,
              opacity: isSpeaking || isListening ? [1, 0.5, 1] : 0.5
            }}
            transition={{ duration: 0.6, repeat: isSpeaking || isListening ? Infinity : 0 }}
          />
          <span>{isSpeaking ? "Ms. Chen is speaking" : isListening ? "Listening to you" : "Ready to help"}</span>
        </motion.div>
      </div>

      {/* Name tag */}
      <div className="absolute top-4 left-4 z-30">
        <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10 text-white">
          <span className="font-serif font-semibold">Ms. Eleanor Chen</span>
          <span className="text-white/60 text-sm ml-2">AI Tutor</span>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 z-30">
        <motion.div 
          className="px-2 py-1 rounded-md bg-red-500/80 text-white text-xs font-bold flex items-center gap-1"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          LIVE
        </motion.div>
      </div>
    </div>
  );
}
