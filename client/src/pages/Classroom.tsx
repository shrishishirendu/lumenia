import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Whiteboard } from "@/components/Whiteboard";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { PreSessionQuiz } from "@/components/PreSessionQuiz";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, MessageSquare, Send, User, Loader2, BookOpen, Calculator, GraduationCap, HelpCircle, Volume2, Pencil, Target, Clock, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import type { WhiteboardContent, TeachingStyle } from "@shared/whiteboard-types";
import { DEFAULT_MATH_CONTENT, DEFAULT_ENGLISH_CONTENT } from "@shared/whiteboard-types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Classroom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentHint, setCurrentHint] = useState("Ready when you are! Take your time and let's explore together.");
  const [currentSpeechText, setCurrentSpeechText] = useState<string | undefined>(undefined);
  const [showHumanTutorDialog, setShowHumanTutorDialog] = useState(false);
  const [humanTutorReason, setHumanTutorReason] = useState("");
  const [humanTutorUrgency, setHumanTutorUrgency] = useState("normal");
  const [requestingHumanTutor, setRequestingHumanTutor] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<"math" | "english">("math");
  const [inputMode, setInputMode] = useState<"type" | "draw">("type");
  const [isAnalyzingDrawing, setIsAnalyzingDrawing] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [showPreSessionQuiz, setShowPreSessionQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("Linear Equations");
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>("socratic");
  const [whiteboardContent, setWhiteboardContent] = useState<WhiteboardContent>(DEFAULT_MATH_CONTENT);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>([]);
  
  const [learningMode, setLearningMode] = useState<"focus" | "quickhelp" | "workspace">("focus");
  
  const MATH_TOPICS = [
    "Linear Equations",
    "Quadratic Functions", 
    "Algebra",
    "Trigonometry",
    "Calculus",
    "Statistics & Probability",
    "Geometry"
  ];
  
  const ENGLISH_TOPICS = [
    "Grammar & Writing",
    "Essay Structure",
    "Reading Comprehension",
    "Literature Analysis",
    "Persuasive Writing",
    "Narrative Writing",
    "Text Analysis"
  ];

  // Read subject from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get("subject");
    if (subjectParam === "english") {
      setSelectedSubject("english");
      setWhiteboardContent(DEFAULT_ENGLISH_CONTENT);
    } else if (subjectParam === "math") {
      setSelectedSubject("math");
      setWhiteboardContent(DEFAULT_MATH_CONTENT);
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    const checkAuthAndQuiz = async () => {
      try {
        // First check if user has a profile
        const profileRes = await fetch("/api/profile");
        if (profileRes.status === 401) {
          window.location.replace("/api/login");
          return;
        }
        if (profileRes.status === 404 || !profileRes.ok) {
          window.location.href = "/onboarding";
          return;
        }

        // Check if there's a pre-session quiz available
        const quizRes = await fetch("/api/quiz/pre-session");
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          if (quizData.questions && quizData.questions.length > 0) {
            setShowPreSessionQuiz(true);
            return;
          }
        }

        // No quiz needed, start session directly
        await startNewSession();
      } catch (error) {
        console.error("Failed to initialize:", error);
        await startNewSession();
      }
    };

    checkAuthAndQuiz();
  }, []);

  const startNewSession = async () => {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject, topic: currentTopic })
      });
      
      if (!response.ok) throw new Error("Failed to create session");
      
      const session = await response.json();
      setSessionId(session.id);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      toast({
        title: "Connection Error",
        description: "Could not start tutoring session. Please refresh.",
        variant: "destructive"
      });
    }
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    setShowPreSessionQuiz(false);
    setQuizCompleted(true);
    toast({
      title: "Warm-up complete",
      description: passed 
        ? "You're ready to keep building on what you know!" 
        : "We'll explore these ideas together as we go."
    });
    startNewSession();
  };

  const handleQuizSkip = () => {
    setShowPreSessionQuiz(false);
    startNewSession();
  };

  // Parse tutor response into whiteboard content
  const parseResponseToWhiteboard = useCallback((response: string, userQuestion: string) => {
    const blocks: WhiteboardContent["blocks"] = [];
    
    // Extract equations (look for patterns like "x = 5" or "2x + 3 = 7")
    const equationMatch = response.match(/([a-zA-Z]\s*[=+\-*/^]\s*[\d\w\s+\-*/^()]+\s*=?\s*[\d\w]*)/g);
    if (equationMatch && equationMatch.length > 0) {
      equationMatch.slice(0, 2).forEach(eq => {
        blocks.push({ type: "equation", content: eq.trim(), highlight: true });
      });
    }
    
    // Extract numbered steps
    const stepsMatch = response.match(/(\d+[\.\)]\s+[^\n]+)/g);
    if (stepsMatch && stepsMatch.length > 1) {
      blocks.push({ 
        type: "steps", 
        content: stepsMatch.map(s => s.replace(/^\d+[\.\)]\s*/, '')).join("\n") 
      });
    }
    
    // For English, look for examples or quotes
    if (selectedSubject === "english") {
      const quoteMatch = response.match(/"([^"]+)"/);
      if (quoteMatch) {
        blocks.push({ type: "quote", content: quoteMatch[1] });
      }
      
      // Look for grammar examples
      if (response.toLowerCase().includes("example:") || response.toLowerCase().includes("for instance")) {
        const exampleMatch = response.match(/(?:example:|for instance[,:]*)\s*([^.!?]+[.!?])/i);
        if (exampleMatch) {
          blocks.push({ type: "example", content: exampleMatch[1].trim() });
        }
      }
    }
    
    // Add the user's question as context
    blocks.unshift({ type: "text", content: userQuestion, highlight: false });
    
    // If we found meaningful content, update whiteboard
    if (blocks.length > 1) {
      setWhiteboardContent({
        subject: selectedSubject,
        title: currentTopic,
        blocks
      });
    } else {
      // Just show the question with a simple response hint
      setWhiteboardContent({
        subject: selectedSubject,
        title: currentTopic,
        blocks: [
          { type: "text", content: userQuestion },
          { type: "text", content: response.slice(0, 200) + (response.length > 200 ? "..." : "") }
        ]
      });
    }
  }, [selectedSubject, currentTopic]);

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAndSend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMicActive(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMicActive(false);
    }
  }, [isRecording]);

  const transcribeAndSend = async (audioBlob: Blob) => {
    console.log("transcribeAndSend called, blob size:", audioBlob.size, "type:", audioBlob.type);
    
    try {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) {
        console.error("No session available");
        toast({
          title: "Session Error",
          description: "Please wait for the session to load and try again.",
          variant: "destructive"
        });
        return;
      }

      // Check if blob has data
      if (audioBlob.size === 0) {
        console.error("Empty audio blob");
        toast({
          title: "Recording Error",
          description: "No audio was captured. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      console.log("Sending audio for transcription, base64 length:", base64.length);
      
      const transcribeRes = await fetch("/api/tutor/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: audioBlob.type })
      });

      if (!transcribeRes.ok) {
        const errorText = await transcribeRes.text();
        console.error("Transcription failed:", transcribeRes.status, errorText);
        toast({
          title: "Transcription Error",
          description: "Could not transcribe your voice. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const { text } = await transcribeRes.json();
      console.log("Transcribed text:", text);
      
      if (text && text.trim()) {
        setShowChat(true);
        
        // Add user message
        const userMessage: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMessage]);

        // Send to AI and get response
        const chatRes = await fetch("/api/tutor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionId,
            message: text,
            history: messagesRef.current,
            teachingStyle
          })
        });

        if (chatRes.ok) {
          const data = await chatRes.json();
          const assistantMessage: Message = { role: "assistant", content: data.response };
          setMessages(prev => [...prev, assistantMessage]);
          setCurrentHint(data.response);
          parseResponseToWhiteboard(data.response, text);
          speakText(data.response);
        } else {
          console.error("Chat response failed:", chatRes.status);
          toast({
            title: "Response Error",
            description: "The tutor couldn't respond. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        console.log("No text transcribed from audio");
        toast({
          title: "No Speech Detected",
          description: "Couldn't hear what you said. Please try speaking again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendMessage = async (text: string, skipConfirmation = false) => {
    if (!sessionId || !text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setChatInput("");

    try {
      // First, confirm the student's doubt if not skipping
      if (!skipConfirmation && !awaitingConfirmation) {
        const confirmRes = await fetch("/api/tutor/confirm-doubt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, subject: selectedSubject })
        });
        
        if (confirmRes.ok) {
          const { confirmation } = await confirmRes.json();
          const confirmMessage: Message = { role: "assistant", content: confirmation };
          setMessages(prev => [...prev, confirmMessage]);
          setCurrentHint(confirmation);
          speakText(confirmation);
          setAwaitingConfirmation(true);
          setPendingQuestion(text);
          return;
        }
      }
      
      // Reset confirmation state and proceed with actual answer
      setAwaitingConfirmation(false);
      setPendingQuestion(null);

      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          history: messages,
          teachingStyle
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentHint(data.response);

      // Update whiteboard with parsed content
      parseResponseToWhiteboard(data.response, text);

      // Generate and play speech
      speakText(data.response);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (!pendingQuestion) return;
    
    if (confirmed) {
      // User confirmed - proceed with the answer
      const confirmMsg: Message = { role: "user", content: "Yes, that's right!" };
      setMessages(prev => [...prev, confirmMsg]);
      await sendMessage(pendingQuestion, true);
    } else {
      // User wants to clarify
      setAwaitingConfirmation(false);
      setPendingQuestion(null);
      const clarifyMsg: Message = { role: "assistant", content: "I see! Please help me understand better - what exactly would you like help with?" };
      setMessages(prev => [...prev, clarifyMsg]);
      setCurrentHint("Please help me understand better - what exactly would you like help with?");
      speakText("I see! Please help me understand better. What exactly would you like help with?");
    }
  };

  const handleDrawingSubmit = async (imageData: string) => {
    if (!sessionId) return;
    
    setIsAnalyzingDrawing(true);
    try {
      // Analyze the drawing
      const analysisRes = await fetch("/api/tutor/analyze-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          subject: selectedSubject,
          context: currentTopic
        })
      });

      if (!analysisRes.ok) throw new Error("Failed to analyze drawing");

      const { interpretation, workAnalysis } = await analysisRes.json();
      
      // Add as a user message with the interpretation
      const userMessage: Message = { 
        role: "user", 
        content: `[Student's work on whiteboard]\n${interpretation}`
      };
      setMessages(prev => [...prev, userMessage]);

      // Now get the tutor's response to the work
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: `The student has submitted their work on the whiteboard. Here's what they wrote/drew: ${interpretation}\n\nAnalysis of their work: ${workAnalysis}\n\nPlease provide helpful feedback on their work.`,
          history: messages,
          teachingStyle
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentHint(data.response);
      parseResponseToWhiteboard(data.response, interpretation);
      speakText(data.response);

      toast({
        title: "Work Received",
        description: "Your tutor is reviewing your work!"
      });
    } catch (error) {
      console.error("Drawing analysis error:", error);
      toast({
        title: "Error",
        description: "Failed to analyze your work. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingDrawing(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsAvatarSpeaking(true);
      setCurrentSpeechText(text);
      
      // Generate TTS audio directly
      const voice = selectedSubject === "english" ? "onyx" : "nova";
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice })
      });
      
      if (!response.ok) {
        throw new Error("TTS request failed");
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play audio directly
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsAvatarSpeaking(false);
          setCurrentSpeechText(undefined);
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = () => {
          setIsAvatarSpeaking(false);
          setCurrentSpeechText(undefined);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      } else {
        // Create new audio element if ref doesn't exist
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsAvatarSpeaking(false);
          setCurrentSpeechText(undefined);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsAvatarSpeaking(false);
          setCurrentSpeechText(undefined);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
      
    } catch (error) {
      console.error("Speech generation error:", error);
      setIsAvatarSpeaking(false);
      setCurrentSpeechText(undefined);
    }
  };

  const requestHumanTutor = async () => {
    if (!humanTutorReason.trim()) {
      toast({
        title: "Please provide a reason",
        description: "Tell us why you need help from a human tutor.",
        variant: "destructive"
      });
      return;
    }

    setRequestingHumanTutor(true);
    try {
      const response = await fetch("/api/tutor/request-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "Linear Equations",
          reason: humanTutorReason,
          urgency: humanTutorUrgency,
          sessionId
        })
      });

      if (response.ok) {
        toast({
          title: "Request Submitted",
          description: "A human tutor will be in touch with you soon!"
        });
        setShowHumanTutorDialog(false);
        setHumanTutorReason("");
        setHumanTutorUrgency("normal");
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRequestingHumanTutor(false);
    }
  };

  // Show pre-session quiz if needed
  if (showPreSessionQuiz) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <main className="p-4 md:p-6">
          <PreSessionQuiz 
            onComplete={handleQuizComplete}
            onSkip={handleQuizSkip}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <audio ref={audioRef} />
      
      <main className="p-4 md:p-6 h-screen flex flex-col gap-4">
        {/* Header - Simplified Action Bar */}
        <header className="flex flex-col gap-3 mb-2">
            {/* Top Row - Subject Selection & Mode Actions */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Select 
                        value={selectedSubject} 
                        onValueChange={(value: "math" | "english") => {
                            setSelectedSubject(value);
                            setCurrentTopic(value === "math" ? MATH_TOPICS[0] : ENGLISH_TOPICS[0]);
                            setMessages([]);
                            setWhiteboardContent(value === "math" ? DEFAULT_MATH_CONTENT : DEFAULT_ENGLISH_CONTENT);
                            setCurrentHint(value === "math" 
                                ? "Ready when you are! What would you like to explore today?"
                                : "Let's discover something new together. Where shall we begin?"
                            );
                        }}
                    >
                        <SelectTrigger className="w-[140px]" data-testid="select-subject">
                            <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="math">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4" /> Mathematics
                                </div>
                            </SelectItem>
                            <SelectItem value="english">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> English
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select 
                        value={currentTopic} 
                        onValueChange={(value) => {
                            setCurrentTopic(value);
                            setMessages([]);
                        }}
                    >
                        <SelectTrigger className="w-[180px]" data-testid="select-topic">
                            <SelectValue placeholder="Topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {(selectedSubject === "math" ? MATH_TOPICS : ENGLISH_TOPICS).map(topic => (
                                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Primary Action Buttons - Clear Student Intents */}
                <div className="flex items-center gap-2">
                    {/* Focus Session - Primary CTA */}
                    <Button
                        variant={learningMode === "focus" ? "default" : "outline"}
                        className="gap-2"
                        onClick={async () => {
                            setLearningMode("focus");
                            const response = await fetch("/api/sessions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ subject: selectedSubject, topic: currentTopic })
                            });
                            if (response.ok) {
                                const session = await response.json();
                                setSessionId(session.id);
                                setMessages([]);
                                setCurrentHint(`Let's focus on ${currentTopic}. Take your time - we'll work through this together.`);
                            }
                        }}
                        data-testid="button-focus-session"
                    >
                        <Target className="w-4 h-4" /> Focus Session
                    </Button>
                    
                    {/* Quick Help - Secondary CTA */}
                    <Button
                        variant={learningMode === "quickhelp" ? "default" : "secondary"}
                        className="gap-2"
                        onClick={() => {
                            setLearningMode("quickhelp");
                            setShowChat(true);
                            setCurrentHint("What's on your mind? Ask me anything - I'm here to help.");
                        }}
                        data-testid="button-quick-help"
                    >
                        <HelpCircle className="w-4 h-4" /> Quick Help
                    </Button>
                    
                    {/* Show My Work - Tertiary CTA */}
                    <Button
                        variant={learningMode === "workspace" ? "default" : "ghost"}
                        className="gap-2"
                        onClick={() => setLearningMode("workspace")}
                        data-testid="button-show-work"
                    >
                        <Pencil className="w-4 h-4" /> Show My Work
                    </Button>
                </div>
            </div>
        </header>

        {/* Main Workspace - Khan Academy Style */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            
            {/* Left Sidebar: Teacher Info + Chat */}
            <div className={`${showChat ? 'lg:col-span-3' : 'lg:col-span-3'} flex flex-col gap-4 min-h-0`}>
                
                {/* Session Compass - Today's Focus */}
                {learningMode === "focus" && (
                    <Card className="p-4 glass-card border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Today's Focus</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Skill</span>
                                <span className="font-medium">{currentTopic}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Time</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 25-40 min
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Goal</span>
                                <span className="font-medium text-primary">Build understanding</span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Teacher Info Panel - Compact */}
                <Card className="p-4 glass-card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                            selectedSubject === "math" ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
                        }`}>
                            {selectedSubject === "math" ? "EC" : "JM"}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm">
                                {selectedSubject === "english" ? "Mr. James Mitchell" : "Ms. Eleanor Chen"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Today's focus: {currentTopic}
                            </p>
                        </div>
                        <AnimatePresence>
                            {isAvatarSpeaking && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="flex items-center gap-1"
                                >
                                    <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Voice & Interaction Controls */}
                    <div className="flex items-center justify-between gap-2">
                        <VoiceVisualizer 
                            isActive={isAvatarSpeaking || (micActive && !isAvatarSpeaking)} 
                            mode={isAvatarSpeaking ? "speaking" : "listening"} 
                        />
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant={isRecording ? "destructive" : "secondary"}
                                className="gap-1"
                                onClick={toggleMic}
                                disabled={isAvatarSpeaking}
                                data-testid="button-toggle-mic"
                            >
                                {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1"
                                onClick={() => setShowHumanTutorDialog(true)}
                                data-testid="button-request-human"
                            >
                                <User className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Tutor Says Panel - Calm, Encouraging Tone */}
                <Card className="p-4 glass-card flex-shrink-0">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
                        {selectedSubject === "english" ? "Mr. Mitchell" : "Ms. Chen"}
                    </span>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentHint}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm font-medium leading-relaxed"
                            data-testid="text-current-hint"
                        >
                            {currentHint}
                        </motion.p>
                    </AnimatePresence>
                </Card>

                {/* Quick Chat Input (always visible) */}
                <Card className="p-4 glass-card flex-1 flex flex-col min-h-0">
                    <h3 className="font-semibold text-sm mb-3">
                        {learningMode === "quickhelp" ? "Quick Help" : "Ask a Question"}
                    </h3>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 min-h-[100px]" data-testid="chat-messages-container">
                        {messages.length === 0 ? (
                            <p className="text-muted-foreground text-xs text-center py-4">
                                {learningMode === "quickhelp" 
                                    ? "What would you like help with? I'm here whenever you need me."
                                    : "Take your time. Ask me anything when you're ready."
                                }
                            </p>
                        ) : (
                            messages.slice(-6).map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-2 rounded-lg text-xs ${
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground ml-4"
                                            : "bg-muted mr-4"
                                    }`}
                                    data-testid={`message-${msg.role}-${idx}`}
                                >
                                    {msg.content.length > 150 ? msg.content.slice(0, 150) + "..." : msg.content}
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Confirmation Buttons */}
                    {awaitingConfirmation && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 mb-3"
                        >
                            <Button 
                                onClick={() => handleConfirmation(true)}
                                className="flex-1"
                                data-testid="button-confirm-yes"
                            >
                                Yes, that's right!
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => handleConfirmation(false)}
                                className="flex-1"
                                data-testid="button-confirm-no"
                            >
                                Let me clarify
                            </Button>
                        </motion.div>
                    )}

                    {/* Input - Typing */}
                    {!awaitingConfirmation && (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type your question..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && chatInput.trim() && sessionId) {
                                    e.preventDefault();
                                    sendMessage(chatInput);
                                  }
                                }}
                                disabled={!sessionId || isAnalyzingDrawing}
                                className="text-sm"
                                data-testid="input-chat-message"
                            />
                            <Button
                                size="icon"
                                onClick={() => sendMessage(chatInput)}
                                disabled={!sessionId || !chatInput.trim() || isAnalyzingDrawing}
                                data-testid="button-send-message"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </Card>
            </div>

            {/* Main: Whiteboard - Primary Focus */}
            <div className={`${showChat ? 'lg:col-span-6' : 'lg:col-span-9'} h-full min-h-0 flex flex-col`}>
                <Tabs value={learningMode === "workspace" ? "draw" : "view"} onValueChange={(v) => setLearningMode(v === "draw" ? "workspace" : "focus")} className="flex-1 flex flex-col">
                    <TabsList className="mb-2 self-start">
                        <TabsTrigger value="view" className="gap-1">
                            <BookOpen className="w-4 h-4" /> Lesson
                        </TabsTrigger>
                        <TabsTrigger value="draw" className="gap-1">
                            <Pencil className="w-4 h-4" /> Your Work
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="view" className="flex-1 mt-0 min-h-0">
                        <Whiteboard content={whiteboardContent} sessionId={sessionId} />
                    </TabsContent>
                    <TabsContent value="draw" className="flex-1 mt-0 min-h-0">
                        <Card className="h-full p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">Your Workspace</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Try the problem here. I'll guide you if needed.
                                    </p>
                                </div>
                                {isAnalyzingDrawing && (
                                    <div className="flex items-center gap-2 text-primary">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Looking at your work...</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <DrawingCanvas 
                                    onSubmit={handleDrawingSubmit}
                                    disabled={isAnalyzingDrawing || !sessionId}
                                    width={800}
                                    height={400}
                                />
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Expanded Chat Panel (when showChat is true) */}
            {showChat && (
                <div className="lg:col-span-3 h-full min-h-0 flex flex-col">
                    <Card className="flex-1 flex flex-col p-4 gap-3">
                        <h3 className="font-semibold text-sm">Full Chat History</h3>
                        
                        {/* Full Messages */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-lg text-sm ${
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground ml-6"
                                            : "bg-muted mr-6"
                                    }`}
                                >
                                    <p>{msg.content}</p>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

        </div>
      </main>

      {/* Human Tutor Request Dialog */}
      <Dialog open={showHumanTutorDialog} onOpenChange={setShowHumanTutorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request a Human Tutor</DialogTitle>
            <DialogDescription>
              Need extra help? Request a live session with a human tutor. We'll match you with an expert who can provide personalized assistance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">What do you need help with?</Label>
              <Textarea 
                id="reason"
                placeholder="Describe what you're struggling with..."
                value={humanTutorReason}
                onChange={(e) => setHumanTutorReason(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-tutor-reason"
              />
            </div>
            
            <div className="space-y-2">
              <Label>How urgent is your request?</Label>
              <RadioGroup value={humanTutorUrgency} onValueChange={setHumanTutorUrgency}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="font-normal">Normal - within 24 hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="font-normal">Urgent - as soon as possible</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHumanTutorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={requestHumanTutor} disabled={requestingHumanTutor} data-testid="button-submit-tutor-request">
              {requestingHumanTutor ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
