import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { AvatarVideo } from "@/components/AvatarVideo";
import { Whiteboard } from "@/components/Whiteboard";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Classroom() {
  const [micActive, setMicActive] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  // Simulation of conversation loop
  useEffect(() => {
    if (!micActive) return;
    
    // Simulate user speaking -> Avatar listening
    const listenTimer = setTimeout(() => {
        setIsAvatarSpeaking(true);
        // Simulate Avatar speaking response
        setTimeout(() => {
            setIsAvatarSpeaking(false);
        }, 4000);
    }, 3000);

    return () => clearTimeout(listenTimer);
  }, [micActive, isAvatarSpeaking]);

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Nav />
      
      <main className="flex-1 md:ml-20 p-4 md:p-6 h-screen flex flex-col gap-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-2">
            <div>
                <h1 className="text-2xl font-serif font-semibold">Algebra I: Linear Equations</h1>
                <p className="text-muted-foreground text-sm">Unit 3 • Lesson 5</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                    <MessageSquare className="w-4 h-4" /> Chat
                </Button>
                <Button 
                    className={`gap-2 transition-all ${micActive ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                    onClick={() => setMicActive(!micActive)}
                >
                    {micActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {micActive ? "Mute Mic" : "Start Speaking"}
                </Button>
            </div>
        </header>

        {/* Main Workspace - Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            
            {/* Left: Avatar / Teacher View */}
            <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                <Card className="flex-1 relative overflow-hidden bg-black rounded-2xl border-0 shadow-2xl ring-1 ring-white/10">
                    <AvatarVideo 
                        isSpeaking={isAvatarSpeaking} 
                        isListening={micActive && !isAvatarSpeaking}
                    />
                    
                    {/* Floating Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pt-20 flex justify-between items-end">
                        <div className="text-white">
                            <h3 className="font-medium text-lg">Sarah (AI Tutor)</h3>
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                                <div className={`w-2 h-2 rounded-full ${micActive && !isAvatarSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                {micActive && !isAvatarSpeaking ? "Listening to you..." : isAvatarSpeaking ? "Speaking..." : "Ready"}
                            </div>
                        </div>
                        <VoiceVisualizer isActive={isAvatarSpeaking || (micActive && !isAvatarSpeaking)} mode={isAvatarSpeaking ? "speaking" : "listening"} />
                    </div>
                </Card>

                {/* Sub-card: Topic / Hints */}
                <Card className="h-40 p-6 glass-card flex flex-col justify-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Current Goal</span>
                    <p className="text-lg font-medium leading-snug">
                        "Let's try to get 'x' by itself on the left side of the equation. What's the first thing moving?"
                    </p>
                </Card>
            </div>

            {/* Right: Whiteboard / Work Area */}
            <div className="lg:col-span-7 h-full min-h-0">
                <Whiteboard />
            </div>

        </div>
      </main>
    </div>
  );
}
