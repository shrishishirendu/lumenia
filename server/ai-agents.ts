import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
});

const AGENT_PERSONAS = {
  marketing: {
    name: "ContentMind",
    systemPrompt: `You are ContentMind, an AI marketing agent for Virtual Human Tutor, an AI-powered K-12 math tutoring platform with a photorealistic avatar teacher named Ms. Eleanor Chen.

Your responsibilities:
- Generate compelling ad copy and social media content
- Optimize campaign messaging for parents of students ages 14-18
- Create engaging headlines and CTAs
- Analyze and suggest improvements for marketing strategies

Always be creative, data-driven, and focused on conversion. Use emotional triggers that resonate with parents concerned about their children's education.`
  },
  
  sales: {
    name: "OutreachBot-Alpha",
    systemPrompt: `You are OutreachBot-Alpha, an AI sales agent for Virtual Human Tutor. You handle lead conversations with prospective parents and school administrators.

Your responsibilities:
- Respond to inquiries professionally and helpfully
- Qualify leads by understanding their needs
- Address objections about AI tutoring
- Schedule demos and trials
- Follow up with warm leads

Key selling points:
- Photorealistic AI avatar (Ms. Chen) with infinite patience
- Socratic method - guides students to discover answers
- 24/7 availability
- Personalized pacing for each student
- Progress tracking for parents

Be warm, professional, and consultative. Never be pushy.`
  },
  
  operations: {
    name: "OpsManager",
    systemPrompt: `You are OpsManager, an AI operations agent for Virtual Human Tutor. You handle scheduling, system monitoring, and operational tasks.

Your responsibilities:
- Generate operational status reports
- Suggest scheduling optimizations
- Monitor system health metrics
- Create weekly parent progress reports
- Handle payment processing summaries

Be efficient, precise, and data-focused.`
  },
  
  admissions: {
    name: "EnrollmentAI",
    systemPrompt: `You are EnrollmentAI, an AI admissions agent for Virtual Human Tutor. You handle new student enrollment and onboarding.

Your responsibilities:
- Guide families through the enrollment process
- Assess student readiness and recommend starting levels
- Answer curriculum and pricing questions
- Process trial sign-ups
- Send welcome sequences to new families

Be welcoming, helpful, and make the enrollment process feel easy and exciting.`
  }
};

type AgentType = keyof typeof AGENT_PERSONAS;

export async function generateAgentResponse(
  agentType: AgentType,
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const agent = AGENT_PERSONAS[agentType];
  
  const messages: any[] = [
    { role: "system", content: agent.systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 500,
    temperature: 0.8
  });

  return response.choices[0]?.message?.content || "I apologize, I'm having trouble responding right now.";
}

export async function generateMarketingContent(
  contentType: "ad_copy" | "social_post" | "email" | "headline",
  context?: string
): Promise<{ content: string; variant: string }> {
  const prompts: Record<string, string> = {
    ad_copy: `Generate a compelling Facebook/Instagram ad copy (max 125 characters) for Virtual Human Tutor. Focus on parent pain points and emotional benefits. ${context || ""}`,
    social_post: `Create an engaging LinkedIn post for Virtual Human Tutor targeting parents and educators. Include a hook, value proposition, and CTA. ${context || ""}`,
    email: `Write a nurture email subject line and preview text for parents who signed up for a trial but haven't started. ${context || ""}`,
    headline: `Generate 3 variations of a landing page headline for Virtual Human Tutor. Focus on transformation and results. ${context || ""}`
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: AGENT_PERSONAS.marketing.systemPrompt },
      { role: "user", content: prompts[contentType] }
    ],
    max_tokens: 300,
    temperature: 0.9
  });

  return {
    content: response.choices[0]?.message?.content || "",
    variant: `Variant ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`
  };
}

export async function generateAgentLog(agentType: AgentType): Promise<string> {
  const logTemplates: Record<AgentType, string[]> = {
    marketing: [
      "Analyzing campaign performance metrics...",
      "A/B testing new ad creative variant...",
      "Optimizing bid strategy for 'AI tutor' keyword...",
      "Generating social content for LinkedIn...",
      "Adjusting audience targeting based on conversions...",
      "Content published: engagement tracking active.",
      "Click-through rate improved by {n}%.",
      "New creative outperforming control by {n}%."
    ],
    sales: [
      "New lead identified: {school} District",
      "Sending personalized outreach sequence...",
      "Lead responded: Interested in demo.",
      "Scheduling demo for {day} at {time}.",
      "Following up with warm lead #{n}...",
      "Qualification complete: High intent detected.",
      "Demo completed: Proposal sent.",
      "Contract signed: New customer onboarded."
    ],
    operations: [
      "Processing payment batch #{n}...",
      "Generating weekly progress reports...",
      "Reports delivered to {n} parents.",
      "System health check: All services green.",
      "Session conflict resolved automatically.",
      "Backup completed successfully.",
      "Usage analytics compiled.",
      "Parent notification queue processed."
    ],
    admissions: [
      "New trial sign-up: {name} family",
      "Welcome sequence initiated...",
      "Readiness assessment completed.",
      "Student placed in Year {n} curriculum.",
      "Trial reminder sent: Day {n}.",
      "Trial conversion: Full enrollment processed.",
      "Onboarding call scheduled.",
      "Curriculum preferences saved."
    ]
  };

  const templates = logTemplates[agentType];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template
    .replace("{n}", String(Math.floor(Math.random() * 100) + 1))
    .replace("{school}", ["Westview", "Lincoln", "Oak Valley", "Riverside"][Math.floor(Math.random() * 4)])
    .replace("{day}", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][Math.floor(Math.random() * 5)])
    .replace("{time}", ["10am", "2pm", "3pm", "4pm"][Math.floor(Math.random() * 4)])
    .replace("{name}", ["Johnson", "Smith", "Williams", "Chen", "Garcia"][Math.floor(Math.random() * 5)]);
}

export async function handleSalesInquiry(
  leadMessage: string,
  leadContext?: { name?: string; source?: string; previousMessages?: any[] }
): Promise<{ response: string; suggestedActions: string[]; leadScore: number }> {
  const systemPrompt = `${AGENT_PERSONAS.sales.systemPrompt}

After your response, also provide:
1. A lead score from 0-100 based on interest level
2. 2-3 suggested follow-up actions

Format your internal analysis as JSON at the end: {"leadScore": X, "actions": ["action1", "action2"]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...(leadContext?.previousMessages || []),
      { role: "user", content: `Lead ${leadContext?.name || "Unknown"} says: "${leadMessage}"` }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  const fullResponse = response.choices[0]?.message?.content || "";
  
  // Extract JSON analysis if present
  const jsonMatch = fullResponse.match(/\{[^}]+\}/);
  let leadScore = 50;
  let suggestedActions: string[] = ["Schedule follow-up", "Send more info"];
  
  if (jsonMatch) {
    try {
      const analysis = JSON.parse(jsonMatch[0]);
      leadScore = analysis.leadScore || 50;
      suggestedActions = analysis.actions || suggestedActions;
    } catch (e) {
      // Use defaults
    }
  }

  // Remove JSON from response
  const cleanResponse = fullResponse.replace(/\{[^}]+\}/, "").trim();

  return {
    response: cleanResponse,
    suggestedActions,
    leadScore
  };
}

export async function processAdmission(
  studentInfo: {
    name: string;
    grade: number;
    parentName: string;
    concerns?: string;
  }
): Promise<{
  welcomeMessage: string;
  recommendedLevel: string;
  nextSteps: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: AGENT_PERSONAS.admissions.systemPrompt },
      { 
        role: "user", 
        content: `Process new admission for:
Student: ${studentInfo.name}, Grade ${studentInfo.grade}
Parent: ${studentInfo.parentName}
Concerns: ${studentInfo.concerns || "None specified"}

Generate a personalized welcome message, recommended starting level, and next steps.`
      }
    ],
    max_tokens: 400,
    temperature: 0.7
  });

  const content = response.choices[0]?.message?.content || "";
  
  return {
    welcomeMessage: content,
    recommendedLevel: `Year ${studentInfo.grade} - Foundation`,
    nextSteps: [
      "Complete diagnostic assessment",
      "Meet Ms. Chen in intro session",
      "Set learning schedule",
      "Connect parent portal"
    ]
  };
}
