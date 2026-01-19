import { motion } from "framer-motion";

interface VoiceVisualizerProps {
  isActive: boolean;
  mode: "listening" | "speaking";
}

export function VoiceVisualizer({ isActive, mode }: VoiceVisualizerProps) {
  const bars = 5;
  const color = mode === "speaking" ? "bg-primary" : "bg-secondary";

  return (
    <div className="flex items-center justify-center gap-1 h-12 w-24">
      {[...Array(bars)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full ${color}`}
          animate={{
            height: isActive ? ["20%", "100%", "20%"] : "20%",
          }}
          transition={{
            duration: 0.5,
            repeat: isActive ? Infinity : 0,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.1, // Stagger effect
          }}
          style={{ height: "20%" }}
        />
      ))}
    </div>
  );
}
