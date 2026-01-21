import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { 
    TrendingUp, 
    Target, 
    Zap, 
    Users, 
    MessageSquare, 
    MoreHorizontal, 
    CheckCircle2, 
    ArrowRight,
    RefreshCw,
    Sparkles,
    Bot,
    Send,
    Loader2
} from "lucide-react";
import adImage1 from "@assets/generated_images/social_media_ad_for_math_tutor.png";
import adImage2 from "@assets/generated_images/minimalist_ad_for_parent_peace_of_mind.png";

const CAMPAIGNS = [
    { id: 1, name: "Q3 Back-to-School", status: "active", budget: "$1,200/day", roas: "4.2x", leads: 145 },
    { id: 2, name: "Math Olympiad Niche", status: "optimizing", budget: "$400/day", roas: "3.1x", leads: 42 },
    { id: 3, name: "Homework Help Retargeting", status: "active", budget: "$800/day", roas: "5.8x", leads: 89 },
];

const LEADS = [
    { id: 1, name: "Sarah Miller", status: "Warm Lead", lastMsg: "Does this work for specialized curricula?", time: "2m ago" },
    { id: 2, name: "David Chen", status: "Demo Booked", lastMsg: "Tuesday at 4pm works perfectly.", time: "15m ago" },
    { id: 3, name: "Emily Johnson", status: "Cold Outreach", lastMsg: "Sent: Automated Intro Sequence V2", time: "1h ago" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Growth() {
    const { user, loading } = useAuth();
    const [, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState("marketing");
    const [salesMessages, setSalesMessages] = useState<ChatMessage[]>([
      { role: "user", content: "Hi, I saw your ad about the personalized math tutoring. My son has ADHD and struggles with standard Zoom classes. Does this work for him?" },
      { role: "assistant", content: "Hi! That's a great question. Because our avatars are AI-driven, they have infinite patience and adapt instantly to the student's pace. We actually have a specific \"Focus Mode\" designed for students with ADHD that breaks problems into smaller, gamified steps. Would you like to see a quick demo of how that works?" }
    ]);
    const [salesInput, setSalesInput] = useState("");
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [leadScore, setLeadScore] = useState(75);
    const [generatingAd, setGeneratingAd] = useState(false);
    const [generatedAdCopy, setGeneratedAdCopy] = useState<string | null>(null);

    const sendSalesMessage = async () => {
      if (!salesInput.trim() || isAiTyping) return;
      
      const userMessage = salesInput;
      setSalesInput("");
      setSalesMessages(prev => [...prev, { role: "user", content: userMessage }]);
      setIsAiTyping(true);

      try {
        const res = await fetch("/api/agents/sales/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage,
            leadContext: { name: "Sarah Miller", previousMessages: salesMessages }
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          setSalesMessages(prev => [...prev, { role: "assistant", content: data.response }]);
          setLeadScore(data.leadScore || leadScore);
        }
      } catch (e) {
        setSalesMessages(prev => [...prev, { role: "assistant", content: "I apologize, I'm having a brief technical issue. Let me get back to you shortly!" }]);
      } finally {
        setIsAiTyping(false);
      }
    };

    const generateNewAd = async () => {
      setGeneratingAd(true);
      try {
        const res = await fetch("/api/agents/marketing/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "ad_copy" })
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedAdCopy(data.content);
        }
      } catch (e) {
        console.error("Failed to generate ad");
      } finally {
        setGeneratingAd(false);
      }
    };
    
    const userRole = user?.role;
    const isAdmin = userRole === "owner" || userRole === "teacher";

    useEffect(() => {
      if (!loading && user && !isAdmin) {
        setLocation("/");
      }
    }, [loading, user, isAdmin, setLocation]);

    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (!user || !isAdmin) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>This page is only accessible to administrators.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
        <div className="min-h-screen bg-background flex font-sans">
            <Nav />
            
            <main className="flex-1 md:ml-20 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
                                Growth Engine
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 font-mono font-normal">
                                    <Sparkles className="w-3 h-3 mr-1" /> AUTO-PILOT
                                </Badge>
                            </h1>
                            <p className="text-muted-foreground mt-1">Manage automated marketing campaigns and sales pipelines.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline">Export Data</Button>
                            <Button className="gap-2"><Target className="w-4 h-4" /> Adjust Strategy</Button>
                        </div>
                    </div>

                    <Tabs defaultValue="marketing" onValueChange={setActiveTab} className="space-y-8">
                        <TabsList className="bg-muted/50 p-1 h-12">
                            <TabsTrigger value="marketing" className="h-10 px-6">Marketing & Ads</TabsTrigger>
                            <TabsTrigger value="sales" className="h-10 px-6">Sales Pipeline</TabsTrigger>
                            <TabsTrigger value="settings" className="h-10 px-6">Brand Voice</TabsTrigger>
                        </TabsList>

                        {/* MARKETING TAB */}
                        <TabsContent value="marketing" className="space-y-8">
                            
                            {/* Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="glass-card border-none bg-white/50">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Spend</CardTitle></CardHeader>
                                    <CardContent><div className="text-2xl font-bold">$12,450</div><div className="text-xs text-muted-foreground mt-1">Last 30 days</div></CardContent>
                                </Card>
                                <Card className="glass-card border-none bg-white/50">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cost Per Lead</CardTitle></CardHeader>
                                    <CardContent><div className="text-2xl font-bold">$24.15</div><div className="text-xs text-green-600 mt-1">-12% vs avg</div></CardContent>
                                </Card>
                                <Card className="glass-card border-none bg-white/50">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Generated Conversions</CardTitle></CardHeader>
                                    <CardContent><div className="text-2xl font-bold">514</div><div className="text-xs text-green-600 mt-1">Auto-enrolled</div></CardContent>
                                </Card>
                            </div>

                            {/* Active Campaigns */}
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Active Autonomous Campaigns</CardTitle>
                                    <CardDescription>The AI is currently optimizing these 3 strategies.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {CAMPAIGNS.map(campaign => (
                                            <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full ${campaign.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                                                    <div>
                                                        <div className="font-semibold">{campaign.name}</div>
                                                        <div className="text-xs text-muted-foreground flex gap-2">
                                                            <span className="uppercase">{campaign.status}</span>
                                                            <span>•</span>
                                                            <span>Target: Parents 30-45</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8 text-sm">
                                                    <div className="text-right">
                                                        <div className="text-muted-foreground text-xs">Budget</div>
                                                        <div className="font-mono">{campaign.budget}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-muted-foreground text-xs">ROAS</div>
                                                        <div className="font-bold text-green-600">{campaign.roas}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-muted-foreground text-xs">Leads</div>
                                                        <div className="font-bold">{campaign.leads}</div>
                                                    </div>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* AI Generated Content Preview */}
                            {generatedAdCopy && (
                              <Card className="border-green-500/30 bg-green-50/50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-green-600" /> AI-Generated Ad Copy
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm">{generatedAdCopy}</p>
                                </CardContent>
                              </Card>
                            )}

                            {/* Creative Generation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 
                                            Live Creative Testing
                                        </h3>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={generateNewAd}
                                          disabled={generatingAd}
                                          data-testid="button-generate-ad"
                                        >
                                          {generatingAd ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                          Generate New
                                        </Button>
                                    </div>
                                    <Card className="overflow-hidden border-none shadow-md group cursor-pointer relative">
                                        <div className="absolute top-3 left-3 z-20 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                                            Winner (CTR 3.4%)
                                        </div>
                                        <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                            <img src={adImage1} alt="Ad Creative 1" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                                <div className="text-white">
                                                    <p className="font-bold text-lg leading-tight">"Math superpowers unlocked."</p>
                                                    <p className="text-xs opacity-80 mt-1">Variant B • Bright/Optimistic</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                                <div className="space-y-4">
                                     <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 text-muted-foreground" /> 
                                            Challenger Variant
                                        </h3>
                                        <span className="text-xs text-muted-foreground">Generated 2m ago</span>
                                    </div>
                                    <Card className="overflow-hidden border-none shadow-md group cursor-pointer relative">
                                         <div className="absolute top-3 left-3 z-20 bg-white/90 text-black text-xs px-2 py-1 rounded backdrop-blur-md">
                                            Testing...
                                        </div>
                                        <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                            <img src={adImage2} alt="Ad Creative 2" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                                <div className="text-white">
                                                    <p className="font-bold text-lg leading-tight">"Zero homework stress."</p>
                                                    <p className="text-xs opacity-80 mt-1">Variant C • Emotional/Benefit</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                        </TabsContent>


                        {/* SALES TAB */}
                        <TabsContent value="sales" className="h-[600px] flex gap-6">
                            {/* Lead List */}
                            <Card className="w-1/3 flex flex-col border-none shadow-sm">
                                <CardHeader className="pb-2 border-b">
                                    <CardTitle className="text-base">Active Conversations</CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {LEADS.map(lead => (
                                        <div key={lead.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${lead.id === 1 ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-sm">{lead.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{lead.time}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{lead.lastMsg}</p>
                                            <Badge variant="outline" className="text-[10px] h-5">{lead.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Chat Interface */}
                            <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">SM</div>
                                        <div>
                                            <div className="font-semibold text-sm">Sarah Miller</div>
                                            <div className="text-xs text-muted-foreground">Lead Score: {leadScore}/100</div>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-500 hover:bg-green-600"><Bot className="w-3 h-3 mr-1" /> AI Handling</Badge>
                                </div>
                                <div className="flex-1 bg-muted/10 p-4 space-y-4 overflow-y-auto">
                                    {salesMessages.map((msg, i) => (
                                      <div key={i} className={`flex gap-3 ${msg.role === "assistant" ? "flex-row-reverse" : ""}`}>
                                        {msg.role === "user" ? (
                                          <div className="w-8 h-8 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-orange-600">SM</div>
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white"><Bot className="w-4 h-4" /></div>
                                        )}
                                        <div className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${
                                          msg.role === "user" 
                                            ? "bg-white border rounded-tl-none" 
                                            : "bg-primary text-primary-foreground rounded-tr-none"
                                        }`}>
                                          {msg.content}
                                        </div>
                                      </div>
                                    ))}
                                    {isAiTyping && (
                                      <div className="flex gap-3 flex-row-reverse opacity-50">
                                        <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white"><Bot className="w-4 h-4" /></div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            AI is typing response...
                                        </div>
                                      </div>
                                    )}
                                </div>
                                <div className="p-4 border-t bg-white">
                                    <div className="flex gap-2">
                                        <Input 
                                          value={salesInput}
                                          onChange={(e) => setSalesInput(e.target.value)}
                                          onKeyDown={(e) => e.key === "Enter" && sendSalesMessage()}
                                          className="flex-1 text-sm bg-muted/50 border-none rounded-full px-4" 
                                          placeholder="Type to simulate lead message..." 
                                          data-testid="input-sales-chat"
                                        />
                                        <Button 
                                          size="icon" 
                                          className="rounded-full w-8 h-8"
                                          onClick={sendSalesMessage}
                                          disabled={isAiTyping}
                                          data-testid="button-send-sales"
                                        >
                                          <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>
            </main>
        </div>
    );
}
