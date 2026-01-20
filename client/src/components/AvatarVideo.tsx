import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import teacherAvatar from "@assets/generated_images/photorealistic_female_teacher_avatar.png";

interface AvatarVideoProps {
  isSpeaking: boolean;
  isListening: boolean;
  emotion?: "neutral" | "happy" | "thinking";
  textToSpeak?: string;
  onSpeakingComplete?: () => void;
}

export function AvatarVideo({ 
  isSpeaking, 
  isListening, 
  emotion = "neutral",
  textToSpeak,
  onSpeakingComplete
}: AvatarVideoProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useDidAvatar, setUseDidAvatar] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (textToSpeak && isSpeaking && useDidAvatar) {
      generateAvatarVideo(textToSpeak);
    }
  }, [textToSpeak, isSpeaking, useDidAvatar]);

  const generateAvatarVideo = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/avatar/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideoUrl(data.videoUrl);
      } else {
        console.error("Failed to generate avatar video");
        setUseDidAvatar(false);
      }
    } catch (error) {
      console.error("Avatar video error:", error);
      setUseDidAvatar(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnded = () => {
    setVideoUrl(null);
    onSpeakingComplete?.();
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border border-white/10 group">
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-0" />

      {/* Video avatar when available */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          onEnded={handleVideoEnded}
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
      )}

      {/* Static image fallback */}
      {!videoUrl && (
        <motion.img 
          src={teacherAvatar} 
          alt="Ms. Chen - AI Tutor" 
          className="absolute inset-0 w-full h-full object-cover z-10"
          animate={{ 
            scale: isSpeaking ? 1.01 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Speaking animations when no video */}
      {isSpeaking && !videoUrl && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Voice wave animation at bottom */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-end gap-1 h-12">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full"
                animate={{
                  height: [8, 20 + Math.random() * 20, 8],
                }}
                transition={{
                  duration: 0.15 + (i % 3) * 0.05,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ opacity: 0.8 + (i % 2) * 0.2 }}
              />
            ))}
          </div>

          {/* Speech bubble indicator */}
          <motion.div
            className="absolute top-1/4 right-8 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-xl"
            animate={{
              scale: [1, 1.05, 1],
              y: [0, -3, 0],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-2 h-2 rounded-full bg-indigo-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-indigo-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-indigo-300"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
              />
            </div>
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white/95 rotate-45" />
          </motion.div>

          {/* Pulsing glow around avatar */}
          <motion.div
            className="absolute inset-4 rounded-2xl"
            animate={{
              boxShadow: [
                "0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(99, 102, 241, 0.1)",
                "0 0 40px rgba(99, 102, 241, 0.5), inset 0 0 30px rgba(99, 102, 241, 0.2)",
                "0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(99, 102, 241, 0.1)",
              ],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Listening indicator */}
      {isListening && !isSpeaking && (
        <motion.div 
          className="absolute top-[30%] right-[18%] w-6 h-6 rounded-full bg-green-400/40 blur-md z-20"
          animate={{ 
            scale: [1, 1.8, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Status Badge */}
      <div className="absolute bottom-4 left-4 z-30">
        <motion.div 
          className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl flex items-center gap-2 ${
            isSpeaking 
              ? "bg-indigo-500/30 border border-indigo-400/40 text-white shadow-lg shadow-indigo-500/20" 
              : isListening 
                ? "bg-green-500/30 border border-green-400/40 text-white shadow-lg shadow-green-500/20"
                : "bg-white/10 border border-white/20 text-white/80"
          }`}
        >
          <motion.div 
            className={`w-2.5 h-2.5 rounded-full ${
              isSpeaking ? "bg-indigo-400" : isListening ? "bg-green-400" : "bg-white/50"
            }`}
            animate={{ 
              scale: isSpeaking || isListening ? [1, 1.4, 1] : 1,
            }}
            transition={{ duration: 0.5, repeat: isSpeaking || isListening ? Infinity : 0 }}
          />
          <span>
            {isLoading ? "Generating video..." : isSpeaking ? "Ms. Chen is speaking" : isListening ? "Listening to you" : "Ready to help"}
          </span>
        </motion.div>
      </div>

      {/* Name tag */}
      <div className="absolute top-4 left-4 z-30">
        <div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-xl border border-white/10 text-white">
          <span className="font-serif font-semibold">Ms. Eleanor Chen</span>
          <span className="text-white/60 text-sm ml-2">AI Tutor</span>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 z-30">
        <motion.div 
          className="px-2.5 py-1 rounded-md bg-red-500/90 text-white text-xs font-bold flex items-center gap-1.5"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div 
            className="w-2 h-2 rounded-full bg-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          LIVE
        </motion.div>
      </div>

      {/* Audio waveform for speaking */}
      {isSpeaking && !videoUrl && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-indigo-400 rounded-full"
              animate={{
                height: [8, 16 + Math.random() * 16, 8],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
