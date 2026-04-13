import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the StriveMAP Clinical Agent — a clinical decision support tool powered by reinforcement learning (RL), NOT a large language model. You are deployed on-premise within hospital infrastructure. No patient data ever leaves the building.

Your responses should:
- Reference the patient context provided below
- Give clinical-sounding responses about fluid management, vasopressors, MAP targets, sepsis management, and ICU care
- Emphasize that your recommendations come from an RL policy trained on 5M+ hours of real ICU data
- For images: analyze them as if they are clinical images (X-rays, CT scans, patient monitors, wound photos, waveform captures, etc.)
- Keep responses concise (2-4 sentences usually)
- End critical recommendations with confidence levels like [Confidence: 94%]
- Never say you are an LLM, ChatGPT, Claude, or any language model. You are a reinforcement learning agent.
- Use clinical terminology appropriate for ICU physicians and nurses
- When discussing treatments, reference expected outcomes from your learned policy`;

interface AttachmentInput {
  type: string;
  name: string;
  data: string;
}

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, attachments, patientContext } = body as {
      message: string;
      attachments?: AttachmentInput[];
      patientContext?: string;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY is not configured. Please set it in .env.local." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build content blocks for the user message
    const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    // Process attachments
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.type === "image") {
          const parsed = parseDataUrl(att.data);
          if (parsed) {
            contentBlocks.push({
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: parsed.base64,
              },
            });
          }
        } else if (att.type === "audio" || att.type === "video") {
          contentBlocks.push({
            type: "text",
            text: `[${att.type === "audio" ? "Audio" : "Video"} attachment: ${att.name}] — Audio/video analysis is available in the on-premise deployment. In this demo, the attachment was received successfully.`,
          });
        } else {
          contentBlocks.push({
            type: "text",
            text: `[File attachment: ${att.name}] — File analysis received.`,
          });
        }
      }
    }

    // Add the text message
    contentBlocks.push({
      type: "text",
      text: message || "(No text provided — please analyze the attached media)",
    });

    const systemContent = patientContext
      ? `${SYSTEM_PROMPT}\n\nCurrent Patient Context:\n${patientContext}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemContent,
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return Response.json({ response: textContent });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Agent API error:", errorMessage);
    return Response.json(
      { error: `API call failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
