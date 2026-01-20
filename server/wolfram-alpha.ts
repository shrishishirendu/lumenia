import WolframAlphaAPI from "@wolfram-alpha/wolfram-alpha-api";

const WOLFRAM_APP_ID = process.env.WOLFRAM_APP_ID;

interface WolframResult {
  success: boolean;
  answer?: string;
  error?: string;
}

export async function queryWolframAlpha(query: string): Promise<WolframResult> {
  if (!WOLFRAM_APP_ID) {
    return {
      success: false,
      error: "WolframAlpha API key not configured"
    };
  }

  try {
    const waApi = WolframAlphaAPI(WOLFRAM_APP_ID);
    
    const result = await waApi.getShort(query);
    
    if (result && typeof result === 'string' && result.length > 0) {
      return {
        success: true,
        answer: result
      };
    }
    
    return {
      success: false,
      error: "No result from WolframAlpha"
    };
  } catch (error: any) {
    console.error("WolframAlpha error:", error);
    return {
      success: false,
      error: error.message || "Failed to query WolframAlpha"
    };
  }
}

export async function queryWolframAlphaFull(query: string): Promise<WolframResult> {
  if (!WOLFRAM_APP_ID) {
    return {
      success: false,
      error: "WolframAlpha API key not configured"
    };
  }

  try {
    const waApi = WolframAlphaAPI(WOLFRAM_APP_ID);
    
    const result = await waApi.getFull({
      input: query,
      format: 'plaintext'
    });
    
    if (result && result.success) {
      const pods = result.pods || [];
      const resultPod = pods.find((pod: any) => 
        pod.title === 'Result' || 
        pod.title === 'Solution' || 
        pod.title === 'Exact result' ||
        pod.title === 'Decimal approximation'
      );
      
      if (resultPod && resultPod.subpods && resultPod.subpods[0]) {
        return {
          success: true,
          answer: resultPod.subpods[0].plaintext
        };
      }
      
      const inputPod = pods.find((pod: any) => pod.title === 'Input');
      const anyResultPod = pods.find((pod: any) => 
        pod.title !== 'Input' && pod.subpods && pod.subpods[0]?.plaintext
      );
      
      if (anyResultPod && anyResultPod.subpods && anyResultPod.subpods[0]) {
        return {
          success: true,
          answer: anyResultPod.subpods[0].plaintext
        };
      }
    }
    
    return {
      success: false,
      error: "Could not extract result from WolframAlpha response"
    };
  } catch (error: any) {
    console.error("WolframAlpha error:", error);
    return {
      success: false,
      error: error.message || "Failed to query WolframAlpha"
    };
  }
}

export function isMathQuestion(message: string): boolean {
  const mathPatterns = [
    /what\s+is\s+\d/i,
    /solve\s+(for)?/i,
    /calculate/i,
    /compute/i,
    /evaluate/i,
    /simplify/i,
    /factor(ize)?/i,
    /derivative\s+of/i,
    /integral\s+of/i,
    /\d+\s*[\+\-\*\/\^]\s*\d+/,
    /\d+\s*=\s*\d+/,
    /x\s*[\+\-\*\/\^=]/i,
    /y\s*[\+\-\*\/\^=]/i,
    /\(\s*\d+\s*[\+\-\*\/]\s*\d+\s*\)/,
    /sqrt|sin|cos|tan|log|ln/i,
    /equation/i,
    /algebra/i,
    /quadratic/i,
    /linear\s+equation/i,
    /polynomial/i,
    /fraction/i,
    /percentage/i,
    /percent\s+of/i,
    /ratio/i,
    /proportion/i,
  ];
  
  return mathPatterns.some(pattern => pattern.test(message));
}

export function extractMathExpression(message: string): string | null {
  const directMathMatch = message.match(/\d+\s*[\+\-\*\/\^]\s*[\d\(\)x\s\+\-\*\/\^]+/);
  if (directMathMatch) {
    return directMathMatch[0];
  }
  
  const equationMatch = message.match(/\d*x\s*[\+\-]\s*\d+\s*=\s*\d+/i);
  if (equationMatch) {
    return "solve " + equationMatch[0];
  }
  
  if (message.toLowerCase().includes("solve") || 
      message.toLowerCase().includes("calculate") ||
      message.toLowerCase().includes("what is")) {
    return message;
  }
  
  return null;
}
