import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { AvatarVideo } from "@/components/AvatarVideo";
import { Whiteboard } from "@/components/Whiteboard";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageSquare, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>([]);

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
          body: JSON.stringify({ topic: "Linear Equations" })
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

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const transcribeRes = await fetch("/api/tutor/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64 })
      });

      if (transcribeRes.ok) {
        const { text } = await transcribeRes.json();
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
              history: messagesRef.current
            })
          });

          if (chatRes.ok) {
            const data = await chatRes.json();
            const assistantMessage: Message = { role: "assistant", content: data.response };
            setMessages(prev => [...prev, assistantMessage]);
            setCurrentHint(data.response);
            speakText(data.response);
          }
        }
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
          history: messages
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentHint(data.response);

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
      
      const response = await fetch("/api/tutor/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => {
          setIsAvatarSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (error) {
      console.error("Speech generation error:", error);
      setIsAvatarSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      <audio ref={audioRef} />
      
      <main className="flex-1 md:ml-20 p-4 md:p-6 h-screen flex flex-col gap-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-2">
            <div>
                <h1 className="text-2xl font-serif font-semibold">Algebra I: Linear Equations</h1>
                <p className="text-muted-foreground text-sm">Unit 3 • Lesson 5</p>
            </div>
            <div className="flex gap-2">
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
                    {isRecording ? "Stop Recording" : "Speak to Ms. Chen"}
                </Button>
            </div>
        </header>

        {/* Main Workspace - Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            
            {/* Left: Avatar / Teacher View */}
            <div className={`${showChat ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col gap-4 min-h-0`}>
                <Card className="flex-1 relative overflow-hidden bg-black rounded-2xl border-0 shadow-2xl ring-1 ring-white/10">
                    <AvatarVideo 
                        isSpeaking={isAvatarSpeaking} 
                        isListening={micActive && !isAvatarSpeaking}
                    />
                    
                    {/* Floating Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pt-20 flex justify-between items-end">
                        <div className="text-white">
                            <h3 className="font-medium text-lg">Ms. Chen</h3>
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                                <div className={`w-2 h-2 rounded-full ${micActive && !isAvatarSpeaking ? 'bg-green-500 animate-pulse' : isAvatarSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
                                {micActive && !isAvatarSpeaking ? "Listening to you..." : isAvatarSpeaking ? "Speaking..." : "Ready"}
                            </div>
                        </div>
                        <VoiceVisualizer isActive={isAvatarSpeaking || (micActive && !isAvatarSpeaking)} mode={isAvatarSpeaking ? "speaking" : "listening"} />
                    </div>
                </Card>

                {/* Sub-card: Topic / Hints */}
                <Card className="h-40 p-6 glass-card flex flex-col justify-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Ms. Chen Says</span>
                    <p className="text-lg font-medium leading-snug" data-testid="text-current-hint">
                        {currentHint}
                    </p>
                </Card>
            </div>

            {/* Middle/Right: Whiteboard / Work Area */}
            <div className={`${showChat ? 'lg:col-span-5' : 'lg:col-span-7'} h-full min-h-0`}>
                <Whiteboard />
            </div>

            {/* Chat Panel (Conditional) */}
            {showChat && (
                <div className="lg:col-span-3 h-full min-h-0 flex flex-col">
                    <Card className="flex-1 flex flex-col p-4 gap-4">
                        <h3 className="font-serif font-semibold text-lg">Chat with Ms. Chen</h3>
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2" data-testid="chat-messages-container">
                            {messages.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center mt-8">
                                    Start chatting with your tutor! She'll guide you through the problem step-by-step.
                                </p>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg ${
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground ml-8"
                                                : "bg-muted mr-8"
                                        }`}
                                        data-testid={`message-${msg.role}-${idx}`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ask a question or share your work..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && chatInput.trim() && sessionId) {
                                    e.preventDefault();
                                    sendMessage(chatInput);
                                  }
                                }}
                                disabled={!sessionId}
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
            )}

        </div>
      </main>
    </div>
  );
}
