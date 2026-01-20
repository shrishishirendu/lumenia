import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedAvatarProps {
  subject: "math" | "english";
  textToSpeak: string | null;
  isSpeaking: boolean;
  onSpeakingComplete?: () => void;
}

export default function AnimatedAvatar({
  subject,
  textToSpeak,
  isSpeaking,
  onSpeakingComplete,
}: AnimatedAvatarProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTextRef = useRef<string | null>(null);

  const teacherName = subject === "english" ? "Mr. Mitchell" : "Ms. Chen";
  const teacherSubject = subject === "english" ? "English" : "Mathematics";

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAnimating(false);
    setMouthOpen(false);
  }, []);

  const analyzeLipSync = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setMouthOpen(average > 30);

    if (isAnimating) {
      animationFrameRef.current = requestAnimationFrame(analyzeLipSync);
    }
  }, [isAnimating]);

  const playTTS = useCallback(async (text: string) => {
    setIsLoading(true);
    stopAudio();

    try {
      const response = await fetch("/api/tutor/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, subject }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const source = audioContextRef.current.createMediaElementSource(audio);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);

      audio.onplay = () => {
        setIsAnimating(true);
        analyzeLipSync();
      };

      audio.onended = () => {
        setIsAnimating(false);
        setMouthOpen(false);
        URL.revokeObjectURL(audioUrl);
        onSpeakingComplete?.();
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsAnimating(false);
      onSpeakingComplete?.();
    } finally {
      setIsLoading(false);
    }
  }, [subject, stopAudio, analyzeLipSync, onSpeakingComplete]);

  useEffect(() => {
    if (isSpeaking && textToSpeak && textToSpeak !== lastTextRef.current) {
      lastTextRef.current = textToSpeak;
      playTTS(textToSpeak);
    } else if (!isSpeaking) {
      stopAudio();
      lastTextRef.current = null;
    }
  }, [isSpeaking, textToSpeak, playTTS, stopAudio]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={subject}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {subject === "math" ? (
            <MsChenAvatar mouthOpen={mouthOpen} isAnimating={isAnimating} />
          ) : (
            <MrMitchellAvatar mouthOpen={mouthOpen} isAnimating={isAnimating} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAnimating ? "bg-green-500 animate-pulse" : isLoading ? "bg-yellow-500 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-white text-sm font-medium">{teacherName}</span>
            <span className="text-white/60 text-xs">| {teacherSubject} Tutor</span>
          </div>
          {isLoading && (
            <p className="text-white/80 text-xs mt-1">Preparing response...</p>
          )}
          {isAnimating && (
            <p className="text-white/80 text-xs mt-1">Speaking...</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MsChenAvatar({ mouthOpen, isAnimating }: { mouthOpen: boolean; isAnimating: boolean }) {
  return (
    <svg viewBox="0 0 200 250" className="w-48 h-60">
      <defs>
        <linearGradient id="chenSkin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5d0c5" />
          <stop offset="100%" stopColor="#e8b8a8" />
        </linearGradient>
        <linearGradient id="chenHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0f0f1a" />
        </linearGradient>
        <linearGradient id="chenBlouse" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a90a4" />
          <stop offset="100%" stopColor="#2d5a6a" />
        </linearGradient>
      </defs>
      
      <ellipse cx="100" cy="220" rx="55" ry="35" fill="url(#chenBlouse)" />
      <ellipse cx="100" cy="195" rx="25" ry="12" fill="url(#chenSkin)" />
      
      <ellipse cx="100" cy="110" rx="55" ry="65" fill="url(#chenSkin)" />
      
      <path d="M45 90 Q50 30, 100 25 Q150 30, 155 90 Q155 75, 145 65 Q130 55, 100 55 Q70 55, 55 65 Q45 75, 45 90" fill="url(#chenHair)" />
      <ellipse cx="55" cy="100" rx="12" ry="25" fill="url(#chenHair)" />
      <ellipse cx="145" cy="100" rx="12" ry="25" fill="url(#chenHair)" />
      
      <g>
        <ellipse cx="75" cy="100" rx="12" ry="8" fill="white" />
        <ellipse cx="125" cy="100" rx="12" ry="8" fill="white" />
        <motion.ellipse
          cx="75"
          cy="100"
          rx="5"
          ry="5"
          fill="#3d2314"
          animate={isAnimating ? { cx: [74, 76, 74] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.ellipse
          cx="125"
          cy="100"
          rx="5"
          ry="5"
          fill="#3d2314"
          animate={isAnimating ? { cx: [124, 126, 124] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle cx="76" cy="98" r="2" fill="white" opacity="0.8" />
        <circle cx="126" cy="98" r="2" fill="white" opacity="0.8" />
      </g>
      
      <path d="M70 85 Q75 82, 85 85" stroke="#5a3825" strokeWidth="2" fill="none" />
      <path d="M115 85 Q125 82, 130 85" stroke="#5a3825" strokeWidth="2" fill="none" />
      
      <ellipse cx="100" cy="120" rx="6" ry="5" fill="#d4a088" />
      
      <motion.ellipse
        cx="100"
        cy="145"
        rx={mouthOpen ? 12 : 15}
        ry={mouthOpen ? 8 : 3}
        fill={mouthOpen ? "#8b4553" : "#c27070"}
        animate={{ ry: mouthOpen ? 8 : 3 }}
        transition={{ duration: 0.1 }}
      />
      {mouthOpen && (
        <ellipse cx="100" cy="143" rx="8" ry="3" fill="#5a2a35" />
      )}
      
      <ellipse cx="65" cy="125" rx="12" ry="8" fill="#ffb3b3" opacity="0.3" />
      <ellipse cx="135" cy="125" rx="12" ry="8" fill="#ffb3b3" opacity="0.3" />
      
      <rect x="62" y="95" width="20" height="2" rx="1" fill="#c4a484" opacity="0.6" />
      <rect x="118" y="95" width="20" height="2" rx="1" fill="#c4a484" opacity="0.6" />
    </svg>
  );
}

function MrMitchellAvatar({ mouthOpen, isAnimating }: { mouthOpen: boolean; isAnimating: boolean }) {
  return (
    <svg viewBox="0 0 200 250" className="w-48 h-60">
      <defs>
        <linearGradient id="mitchellSkin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8c4a8" />
          <stop offset="100%" stopColor="#d4a882" />
        </linearGradient>
        <linearGradient id="mitchellHair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a3728" />
          <stop offset="100%" stopColor="#2d1f15" />
        </linearGradient>
        <linearGradient id="mitchellSuit" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c3e50" />
          <stop offset="100%" stopColor="#1a252f" />
        </linearGradient>
        <linearGradient id="mitchellTie" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b0000" />
          <stop offset="100%" stopColor="#5c0000" />
        </linearGradient>
      </defs>
      
      <ellipse cx="100" cy="220" rx="55" ry="35" fill="url(#mitchellSuit)" />
      <polygon points="100,185 90,220 110,220" fill="white" />
      <polygon points="100,190 95,220 105,220" fill="url(#mitchellTie)" />
      <ellipse cx="100" cy="195" rx="28" ry="14" fill="url(#mitchellSkin)" />
      
      <ellipse cx="100" cy="105" rx="50" ry="60" fill="url(#mitchellSkin)" />
      
      <path d="M55 85 Q60 45, 100 40 Q140 45, 145 85 Q145 65, 130 55 Q115 50, 100 50 Q85 50, 70 55 Q55 65, 55 85" fill="url(#mitchellHair)" />
      <ellipse cx="58" cy="95" rx="8" ry="18" fill="url(#mitchellHair)" />
      <ellipse cx="142" cy="95" rx="8" ry="18" fill="url(#mitchellHair)" />
      
      <g>
        <ellipse cx="78" cy="95" rx="10" ry="7" fill="white" />
        <ellipse cx="122" cy="95" rx="10" ry="7" fill="white" />
        <motion.ellipse
          cx="78"
          cy="95"
          rx="4"
          ry="4"
          fill="#2d4a3e"
          animate={isAnimating ? { cx: [77, 79, 77] } : {}}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.ellipse
          cx="122"
          cy="95"
          rx="4"
          ry="4"
          fill="#2d4a3e"
          animate={isAnimating ? { cx: [121, 123, 121] } : {}}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <circle cx="79" cy="93" r="1.5" fill="white" opacity="0.8" />
        <circle cx="123" cy="93" r="1.5" fill="white" opacity="0.8" />
      </g>
      
      <path d="M68 82 Q78 78, 88 82" stroke="#4a3728" strokeWidth="2.5" fill="none" />
      <path d="M112 82 Q122 78, 132 82" stroke="#4a3728" strokeWidth="2.5" fill="none" />
      
      <ellipse cx="100" cy="115" rx="7" ry="6" fill="#c4946e" />
      
      <motion.ellipse
        cx="100"
        cy="138"
        rx={mouthOpen ? 10 : 12}
        ry={mouthOpen ? 7 : 2}
        fill={mouthOpen ? "#6b3a3a" : "#a86060"}
        animate={{ ry: mouthOpen ? 7 : 2 }}
        transition={{ duration: 0.1 }}
      />
      {mouthOpen && (
        <ellipse cx="100" cy="136" rx="6" ry="2.5" fill="#4a2525" />
      )}
      
      <path d="M70 148 Q85 155, 100 155 Q115 155, 130 148 Q120 160, 100 162 Q80 160, 70 148" fill="#8b7355" opacity="0.6" />
      <path d="M90 155 L100 168 L110 155" fill="url(#mitchellSkin)" />
    </svg>
  );
}
