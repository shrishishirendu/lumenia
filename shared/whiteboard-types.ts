export type WhiteboardBlockType = 
  | "equation" 
  | "steps" 
  | "text" 
  | "example" 
  | "bullets" 
  | "diagram" 
  | "grammar"
  | "quote";

export interface WhiteboardBlock {
  type: WhiteboardBlockType;
  content: string;
  highlight?: boolean;
}

export interface WhiteboardContent {
  subject: "math" | "english";
  title?: string;
  blocks: WhiteboardBlock[];
}

export type TeachingStyle = "socratic" | "direct";

export const DEFAULT_MATH_CONTENT: WhiteboardContent = {
  subject: "math",
  title: "Ready to Learn",
  blocks: [
    { type: "text", content: "Ask me a math question or select a topic to begin!" }
  ]
};

export const DEFAULT_ENGLISH_CONTENT: WhiteboardContent = {
  subject: "english",
  title: "Ready to Learn",
  blocks: [
    { type: "text", content: "Ask me about grammar, writing, or literature to begin!" }
  ]
};
