import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Whiteboard } from "@/components/Whiteboard";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageSquare, Send, User, Loader2, BookOpen, Calculator, GraduationCap, HelpCircle, Volume2 } from "lucide-react";
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
  const [currentHint, setCurrentHint] = useState("Let's start with a simple problem. Are you ready?");
  const [currentSpeechText, setCurrentSpeechText] = useState<string | undefined>(undefined);
  const [showHumanTutorDialog, setShowHumanTutorDialog] = useState(false);
  const [humanTutorReason, setHumanTutorReason] = useState("");
  const [humanTutorUrgency, setHumanTutorUrgency] = useState("normal");
  const [requestingHumanTutor, setRequestingHumanTutor] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<"math" | "english">("math");
  const [currentTopic, setCurrentTopic] = useState("Linear Equations");
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>("socratic");
  const [whiteboardContent, setWhiteboardContent] = useState<WhiteboardContent>(DEFAULT_MATH_CONTENT);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>([]);
  
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

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // First check if user has a profile
        const profileRes = await fetch("/api/profile");
        if (profileRes.status === 401) {
          // Not logged in - redirect to login
          window.location.replace("/api/login");
          return;
        }
        if (profileRes.status === 404 || !profileRes.ok) {
          // No profile - redirect to onboarding
          window.location.href = "/onboarding";
          return;
        }

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

    initSession();
  }, []);

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

  const sendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setChatInput("");

    try {
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

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      <audio ref={audioRef} />
      
      <main className="flex-1 md:ml-20 p-4 md:p-6 h-screen flex flex-col gap-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-semibold">
                        {selectedSubject === "math" ? "Mathematics" : "English"}: {currentTopic}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {selectedSubject === "math" ? "Australian Curriculum • Years 6-12" : "Language, Literature & Literacy • Years 6-12"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select 
                        value={selectedSubject} 
                        onValueChange={(value: "math" | "english") => {
                            setSelectedSubject(value);
                            setCurrentTopic(value === "math" ? MATH_TOPICS[0] : ENGLISH_TOPICS[0]);
                            setMessages([]);
                            setWhiteboardContent(value === "math" ? DEFAULT_MATH_CONTENT : DEFAULT_ENGLISH_CONTENT);
                            setCurrentHint(value === "math" 
                                ? "Let's work through some math problems together. What would you like to practice?"
                                : "Let's explore the English language together. What would you like to work on?"
                            );
                        }}
                    >
                        <SelectTrigger className="w-[140px]" data-testid="select-subject">
                            <SelectValue placeholder="Select subject" />
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
                            <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {(selectedSubject === "math" ? MATH_TOPICS : ENGLISH_TOPICS).map(topic => (
                                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                            const response = await fetch("/api/sessions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ subject: selectedSubject, topic: currentTopic })
                            });
                            if (response.ok) {
                                const session = await response.json();
                                setSessionId(session.id);
                                setMessages([]);
                                toast({
                                    title: "New Session Started",
                                    description: `Ready to learn ${currentTopic}!`
                                });
                            }
                        }}
                        data-testid="button-start-session"
                    >
                        Start Session
                    </Button>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button 
                        variant={teachingStyle === "socratic" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1"
                        onClick={() => setTeachingStyle("socratic")}
                        data-testid="button-style-socratic"
                    >
                        <HelpCircle className="w-3 h-3" /> Q&A
                    </Button>
                    <Button 
                        variant={teachingStyle === "direct" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1"
                        onClick={() => setTeachingStyle("direct")}
                        data-testid="button-style-direct"
                    >
                        <GraduationCap className="w-3 h-3" /> Direct
                    </Button>
                </div>
                <Button 
                    variant={showChat ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setShowChat(!showChat)}
                    data-testid="button-toggle-chat"
                >
                    <MessageSquare className="w-4 h-4" /> Chat
                </Button>
                <Button 
                    className={`gap-2 transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`}
                    onClick={toggleMic}
                    disabled={isAvatarSpeaking}
                    data-testid="button-toggle-mic"
                >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording ? "Stop Recording" : `Speak to ${selectedSubject === "english" ? "Mr. Mitchell" : "Ms. Chen"}`}
                </Button>
                <Button 
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowHumanTutorDialog(true)}
                    data-testid="button-request-human"
                >
                    <User className="w-4 h-4" /> Human Tutor
                </Button>
            </div>
        </header>

        {/* Main Workspace - Khan Academy Style */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            
            {/* Left Sidebar: Teacher Info + Chat */}
            <div className={`${showChat ? 'lg:col-span-3' : 'lg:col-span-3'} flex flex-col gap-4 min-h-0`}>
                
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
                                {selectedSubject === "math" ? "Mathematics Tutor" : "English Tutor"}
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
                    
                    {/* Voice Visualizer */}
                    <div className="flex justify-center py-2">
                        <VoiceVisualizer 
                            isActive={isAvatarSpeaking || (micActive && !isAvatarSpeaking)} 
                            mode={isAvatarSpeaking ? "speaking" : "listening"} 
                        />
                    </div>
                </Card>

                {/* Teacher Says Panel */}
                <Card className="p-4 glass-card flex-shrink-0">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
                        {selectedSubject === "english" ? "Mr. Mitchell" : "Ms. Chen"} Says
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
                    <h3 className="font-semibold text-sm mb-3">Ask a Question</h3>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1" data-testid="chat-messages-container">
                        {messages.length === 0 ? (
                            <p className="text-muted-foreground text-xs text-center py-4">
                                Type a question or use voice input to interact with your tutor.
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

                    {/* Input */}
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
                            disabled={!sessionId}
                            className="text-sm"
                            data-testid="input-chat-message"
                        />
                        <Button
                            size="icon"
                            onClick={() => sendMessage(chatInput)}
                            disabled={!sessionId || !chatInput.trim()}
                            data-testid="button-send-message"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Main: Whiteboard - Primary Focus */}
            <div className={`${showChat ? 'lg:col-span-6' : 'lg:col-span-9'} h-full min-h-0`}>
                <Whiteboard content={whiteboardContent} sessionId={sessionId} />
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
