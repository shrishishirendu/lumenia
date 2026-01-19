import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Whiteboard() {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"neutral" | "correct" | "incorrect">("neutral");

  const problem = {
    question: "Solve for x:",
    equation: "2x + 5 = 15",
    steps: [
      { text: "Subtract 5 from both sides", result: "2x = 10" },
      { text: "Divide by 2", result: "x = 5" }
    ]
  };

  const handleCheck = () => {
    if (answer === "5") {
      setFeedback("correct");
      if (step < problem.steps.length) {
        setTimeout(() => {
            setStep(s => s + 1);
            setFeedback("neutral");
            setAnswer("");
        }, 1500);
      }
    } else {
      setFeedback("incorrect");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 h-full flex flex-col overflow-hidden relative">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

      <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
        <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
            <PenTool className="w-4 h-4 text-primary" />
            Whiteboard
        </h3>
        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Session ID: #8821</span>
      </div>

      <div className="flex-1 p-8 flex flex-col justify-center items-center z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-mono font-medium text-foreground mb-12"
        >
            {step === 0 ? problem.equation : problem.steps[step - 1].result}
        </motion.div>

        <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                    {step === 0 ? "Step 1: Isolate the variable term" : "Step 2: Solve for x"}
                </p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder={step === 0 ? "What is 2x?" : "x = ?"}
                        className="flex-1 text-2xl p-4 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors font-mono bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                    />
                    <Button 
                        size="icon" 
                        className={`h-auto w-16 rounded-lg transition-all ${
                            feedback === 'correct' ? 'bg-green-500 hover:bg-green-600' : 
                            feedback === 'incorrect' ? 'bg-red-500 hover:bg-red-600' : ''
                        }`}
                        onClick={handleCheck}
                    >
                        {feedback === 'correct' ? <Check className="w-6 h-6" /> : 
                         feedback === 'incorrect' ? <X className="w-6 h-6" /> : 
                         <span className="text-lg font-bold">→</span>}
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {feedback === 'correct' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-green-600 font-medium flex items-center gap-2"
                    >
                        <span className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3" /></span>
                        Great job! That's correct.
                    </motion.div>
                )}
                {feedback === 'incorrect' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-500 font-medium flex items-center gap-2"
                    >
                        <span className="bg-red-100 p-1 rounded-full"><RefreshCw className="w-3 h-3" /></span>
                        Not quite. Try thinking about the inverse operation.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
