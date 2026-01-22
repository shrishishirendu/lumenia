import { AvatarVideo } from "@/components/AvatarVideo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Calendar, TrendingUp, MessageCircle } from "lucide-react";

export default function ParentPortal() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
            
            <header>
                <h1 className="text-3xl font-serif font-bold text-foreground">Parent Portal</h1>
                <p className="text-muted-foreground mt-1">Updates on Leo's progress.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Main Feature: Video Update from Tutor */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl ring-1 ring-black/5">
                        <div className="aspect-video relative bg-black">
                            {/* Reusing the avatar component but in 'speaking' mode for the report */}
                            <AvatarVideo isSpeaking={true} isListening={false} emotion="happy" />
                            
                            <div className="absolute bottom-4 left-4 right-4 z-40">
                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm">Today's Session Recap</h3>
                                        <p className="text-xs text-muted-foreground">Generated 2 hours ago • 45s summary</p>
                                    </div>
                                    <Button size="icon" className="rounded-full w-10 h-10 shrink-0">
                                        <Play className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-6 bg-white">
                            <h3 className="font-serif font-semibold text-xl mb-2">"Leo crushed Linear Equations today!"</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                "Hi Mrs. Chen! Just wanted to share that Leo made a breakthrough with isolating variables today. 
                                He was struggling with the concept of inverse operations initially, but we worked through it using 
                                the balance scale analogy, and he solved the last 5 problems completely on his own. He's ready for 
                                the Unit 3 quiz next week!"
                            </p>
                            
                            <div className="mt-6 flex gap-3">
                                <Button className="gap-2">
                                    <MessageCircle className="w-4 h-4" /> Reply to Sarah
                                </Button>
                                <Button variant="outline">View Full Transcript</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card className="glass-card border-none bg-white/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" /> Mastery Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Algebra I</span>
                                        <span className="font-bold">82%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full w-[82%] bg-primary rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Geometry Prep</span>
                                        <span className="font-bold">45%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full w-[45%] bg-secondary rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none bg-white/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Upcoming
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white rounded-lg border border-border/50 text-sm">
                                <div className="font-bold text-foreground">Thursday, Jan 22</div>
                                <div className="text-muted-foreground">4:00 PM - 5:00 PM</div>
                                <div className="mt-1 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-0.5 rounded">Unit 3 Quiz Prep</div>
                            </div>
                             <div className="p-3 bg-white rounded-lg border border-border/50 text-sm opacity-60">
                                <div className="font-bold text-foreground">Monday, Jan 26</div>
                                <div className="text-muted-foreground">4:00 PM - 5:00 PM</div>
                            </div>
                            <Button variant="ghost" className="w-full text-xs h-8">View Full Schedule</Button>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
}
