const DID_API_KEY = process.env.DID_API_KEY;
const DID_API_URL = "https://api.d-id.com";

interface TalkResponse {
  id: string;
  status: string;
  result_url?: string;
}

export async function createTalkingAvatar(
  text: string,
  imageUrl: string,
  subject: string = "math"
): Promise<{ videoUrl: string; id: string }> {
  if (!DID_API_KEY) {
    throw new Error("D-ID API key not configured");
  }

  // Use different voices for each teacher
  // Ms. Chen (Math): American female voice
  // Mr. Mitchell (English): British male voice
  const voiceId = subject === "english" 
    ? "en-GB-RyanNeural"  // British male for Mr. Mitchell
    : "en-US-JennyNeural"; // American female for Ms. Chen

  const response = await fetch(`${DID_API_URL}/talks`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${DID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: imageUrl,
      script: {
        type: "text",
        input: text,
        provider: {
          type: "microsoft",
          voice_id: voiceId,
        },
      },
      config: {
        fluent: true,
        pad_audio: 0,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("D-ID API error:", error);
    throw new Error(`D-ID API error: ${response.status}`);
  }

  const data = await response.json();
  const talkId = data.id;

  const videoUrl = await pollForResult(talkId);
  return { videoUrl, id: talkId };
}

async function pollForResult(talkId: string): Promise<string> {
  const maxAttempts = 30;
  const pollInterval = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
      headers: {
        "Authorization": `Basic ${process.env.DID_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll D-ID: ${response.status}`);
    }

    const data: TalkResponse = await response.json();

    if (data.status === "done" && data.result_url) {
      return data.result_url;
    }

    if (data.status === "error") {
      throw new Error("D-ID video generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("D-ID video generation timed out");
}

export async function createStreamingSession(imageUrl: string): Promise<{
  sessionId: string;
  streamUrl: string;
  iceServers: any[];
}> {
  if (!DID_API_KEY) {
    throw new Error("D-ID API key not configured");
  }

  const response = await fetch(`${DID_API_URL}/talks/streams`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${DID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("D-ID streaming error:", error);
    throw new Error(`D-ID streaming error: ${response.status}`);
  }

  const data = await response.json();
  return {
    sessionId: data.id,
    streamUrl: data.offer?.sdp || "",
    iceServers: data.ice_servers || [],
  };
}

export async function sendTextToStream(
  sessionId: string,
  text: string,
  subject: string = "math"
): Promise<void> {
  if (!DID_API_KEY) {
    throw new Error("D-ID API key not configured");
  }

  // Use different voices for each teacher
  const voiceId = subject === "english" 
    ? "en-GB-RyanNeural"  // British male for Mr. Mitchell
    : "en-US-JennyNeural"; // American female for Ms. Chen

  const response = await fetch(`${DID_API_URL}/talks/streams/${sessionId}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${DID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      script: {
        type: "text",
        input: text,
        provider: {
          type: "microsoft",
          voice_id: voiceId,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("D-ID stream text error:", error);
    throw new Error(`D-ID stream text error: ${response.status}`);
  }
}

export async function closeStream(sessionId: string): Promise<void> {
  if (!DID_API_KEY) {
    throw new Error("D-ID API key not configured");
  }

  await fetch(`${DID_API_URL}/talks/streams/${sessionId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Basic ${DID_API_KEY}`,
    },
  });
}
