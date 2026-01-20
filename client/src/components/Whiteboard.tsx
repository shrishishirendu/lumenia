import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, BookOpen, Calculator, Sparkles } from "lucide-react";
import type { WhiteboardContent, WhiteboardBlock } from "@shared/whiteboard-types";

interface WhiteboardProps {
  content?: WhiteboardContent;
  sessionId?: number | null;
}

const defaultContent: WhiteboardContent = {
  subject: "math",
  title: "Ready to Learn",
  blocks: [{ type: "text", content: "Ask a question to get started!" }]
};

export function Whiteboard({ content = defaultContent, sessionId }: WhiteboardProps) {
  const safeContent = content || defaultContent;
  const SubjectIcon = safeContent.subject === "english" ? BookOpen : Calculator;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 h-full flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
        <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          Whiteboard
          <SubjectIcon className="w-4 h-4 text-muted-foreground ml-2" />
        </h3>
        {sessionId && (
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            Session #{sessionId}
          </span>
        )}
      </div>

      <div className="flex-1 p-8 overflow-y-auto z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(safeContent)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {safeContent.title && (
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {safeContent.title}
                </h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent origin-left"
                />
              </div>
            )}
            
            {safeContent.blocks.map((block, index) => (
              <WhiteboardBlockRenderer key={index} block={block} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    setDisplayText("");
    setIsComplete(false);
    
    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, 30);
      
      return () => clearInterval(interval);
    }, delay * 1000);
    
    return () => clearTimeout(startTimeout);
  }, [text, delay]);
  
  return (
    <span>
      {displayText}
      {!isComplete && <span className="animate-pulse text-primary">|</span>}
    </span>
  );
}

function WhiteboardBlockRenderer({ block, index }: { block: WhiteboardBlock; index: number }) {
  const baseDelay = index * 0.15;
  
  switch (block.type) {
    case "equation":
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: baseDelay, duration: 0.3 }}
          className={`text-3xl md:text-4xl font-mono font-medium text-center py-6 px-4 rounded-lg relative overflow-hidden ${
            block.highlight ? "bg-primary/10 border-2 border-primary" : "bg-slate-50"
          }`}
        >
          <TypewriterText text={block.content} delay={baseDelay + 0.3} />
          {block.highlight && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ delay: baseDelay + 0.5, duration: 0.8 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          )}
        </motion.div>
      );
      
    case "steps":
      const steps = block.content.split("\n").filter(s => s.trim());
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay }}
          className="space-y-3"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: baseDelay + i * 0.15 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-lg">{step}</span>
            </motion.div>
          ))}
        </motion.div>
      );
      
    case "text":
      return (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay }}
          className={`text-lg leading-relaxed ${
            block.highlight ? "bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-500" : ""
          }`}
        >
          {block.content}
        </motion.p>
      );
      
    case "example":
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: baseDelay }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Example</span>
          <p className="text-lg italic">{block.content}</p>
        </motion.div>
      );
      
    case "bullets":
      const bullets = block.content.split("\n").filter(b => b.trim());
      return (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay }}
          className="space-y-2 ml-4"
        >
          {bullets.map((bullet, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: baseDelay + i * 0.1 }}
              className="flex items-start gap-2 text-lg"
            >
              <span className="text-primary mt-1.5">•</span>
              <span>{bullet.replace(/^[-•]\s*/, "")}</span>
            </motion.li>
          ))}
        </motion.ul>
      );
      
    case "grammar":
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 block">Grammar Note</span>
          <p className="text-lg font-mono">{block.content}</p>
        </motion.div>
      );
      
    case "quote":
      return (
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay }}
          className="border-l-4 border-purple-400 pl-4 py-2 italic text-lg bg-purple-50 rounded-r-lg"
        >
          "{block.content}"
        </motion.blockquote>
      );
      
    case "diagram":
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay }}
          className="bg-slate-100 rounded-lg p-6 text-center text-muted-foreground"
        >
          <span className="text-sm">[Diagram: {block.content}]</span>
        </motion.div>
      );
      
    default:
      return null;
  }
}
