import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import teacherAvatar from "@assets/generated_images/photorealistic_female_teacher_avatar.png";

interface AvatarVideoProps {
  isSpeaking: boolean;
  isListening: boolean;
  emotion?: "neutral" | "happy" | "thinking";
}

export function AvatarVideo({ isSpeaking, isListening, emotion = "neutral" }: AvatarVideoProps) {
  // Simulate subtle "alive" movements
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black/5 shadow-2xl border border-white/10 group">
      {/* Background Blur Effect for depth */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-0" />

      {/* The Avatar Image */}
      <motion.img 
        src={teacherAvatar} 
        alt="AI Teacher" 
        className="absolute inset-0 w-full h-full object-cover z-10"
        animate={{ 
          scale: isSpeaking ? [1, 1.02, 1] : 1,
          filter: isListening ? "brightness(0.95)" : "brightness(1)"
        }}
        transition={{ 
          scale: { duration: 0.5, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" },
          filter: { duration: 0.3 }
        }}
      />

      {/* Speaking Overlay - subtle light pulse on face area */}
      {isSpeaking && (
        <motion.div 
          className="absolute inset-0 bg-white/5 z-20 mix-blend-overlay"
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Status Indicators */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
          isSpeaking 
            ? "bg-primary/20 border-primary/30 text-primary-foreground" 
            : isListening 
              ? "bg-secondary/20 border-secondary/30 text-secondary-foreground"
              : "bg-white/10 border-white/20 text-white"
        }`}>
          {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Ready"}
        </div>
      </div>

      {/* Video Call Controls overlay (simulated) */}
      <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/></svg>
        </div>
      </div>
    </div>
  );
}
