import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import teacherAvatar from "@assets/generated_images/photorealistic_female_teacher_avatar.png";

interface AvatarVideoProps {
  isSpeaking: boolean;
  isListening: boolean;
  emotion?: "neutral" | "happy" | "thinking";
  audioElement?: HTMLAudioElement | null;
}

export function AvatarVideo({ isSpeaking, isListening, emotion = "neutral", audioElement }: AvatarVideoProps) {
  const [mouthState, setMouthState] = useState<0 | 1 | 2 | 3>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSpeaking || !audioElement) {
      setMouthState(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;
        
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        if (!sourceRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audioElement);
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        }

        const analyser = analyserRef.current;
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const analyze = () => {
          if (!isSpeaking) {
            setMouthState(0);
            return;
          }

          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          if (average < 20) {
            setMouthState(0);
          } else if (average < 50) {
            setMouthState(1);
          } else if (average < 100) {
            setMouthState(2);
          } else {
            setMouthState(3);
          }

          animationFrameRef.current = requestAnimationFrame(analyze);
        };

        analyze();
      } catch (error) {
        console.error("Audio analysis setup failed:", error);
        const interval = setInterval(() => {
          if (isSpeaking) {
            setMouthState(prev => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
          }
        }, 150);
        return () => clearInterval(interval);
      }
    };

    setupAudioAnalysis();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, audioElement]);

  useEffect(() => {
    if (isSpeaking && !audioElement) {
      const interval = setInterval(() => {
        setMouthState(prev => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
      }, 150);
      return () => clearInterval(interval);
    }
    if (!isSpeaking) {
      setMouthState(0);
    }
  }, [isSpeaking, audioElement]);

  useEffect(() => {
    if (isSpeaking) {
      const fallbackInterval = setInterval(() => {
        setMouthState(prev => {
          const next = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
          return next;
        });
      }, 100);
      return () => clearInterval(fallbackInterval);
    }
  }, [isSpeaking]);

  const mouthHeights = [0, 6, 12, 18];
  const mouthWidths = [24, 22, 20, 18];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border border-white/10 group">
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-0" />

      <motion.img 
        src={teacherAvatar} 
        alt="Ms. Chen - AI Tutor" 
        className="absolute inset-0 w-full h-full object-cover z-10"
        animate={{ 
          scale: isSpeaking ? 1.01 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {isSpeaking && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Mouth animation container - positioned over face */}
          <div 
            className="absolute"
            style={{ 
              bottom: '28%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {/* Upper lip */}
            <motion.div
              className="absolute"
              style={{
                width: 32,
                height: 8,
                backgroundColor: '#8B4557',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                top: 0,
              }}
            />
            
            {/* Mouth opening - the animated part */}
            <motion.div
              animate={{
                height: [4, 8 + mouthState * 6, 4],
                scaleX: [1, 0.9 + mouthState * 0.05, 1],
              }}
              transition={{ 
                duration: 0.12,
                ease: "easeInOut"
              }}
              style={{
                width: 28,
                backgroundColor: '#2D1518',
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                marginTop: 6,
                marginLeft: 2,
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.6)',
              }}
            />
            
            {/* Teeth hint */}
            {mouthState >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 4,
                  backgroundColor: '#F8F8F8',
                  borderRadius: 2,
                }}
              />
            )}
          </div>
          
          {/* Speaking indicator ring around face */}
          <motion.div
            className="absolute inset-8 rounded-full border-2 border-indigo-400/30"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      )}

      {isSpeaking && (
        <motion.div 
          className="absolute inset-0 z-15 rounded-2xl"
          animate={{ 
            boxShadow: [
              "inset 0 0 40px rgba(99, 102, 241, 0.05)",
              "inset 0 0 60px rgba(99, 102, 241, 0.1)",
              "inset 0 0 40px rgba(99, 102, 241, 0.05)"
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

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
          <span>{isSpeaking ? "Ms. Chen is speaking" : isListening ? "Listening to you" : "Ready to help"}</span>
        </motion.div>
      </div>

      <div className="absolute top-4 left-4 z-30">
        <div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-xl border border-white/10 text-white">
          <span className="font-serif font-semibold">Ms. Eleanor Chen</span>
          <span className="text-white/60 text-sm ml-2">AI Tutor</span>
        </div>
      </div>

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

      {isSpeaking && (
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
