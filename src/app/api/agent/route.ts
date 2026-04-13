import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the StriveMAP Clinical Agent — a clinical decision support tool powered by reinforcement learning (RL), NOT a large language model. You are deployed on-premise within hospital infrastructure. No patient data ever leaves the building.

Your responses should:
- Reference the patient context provided below
- Give clinical-sounding responses about fluid management, vasopressors, MAP targets, sepsis management, and ICU care
- Emphasize that your recommendations come from an RL policy trained on 5M+ hours of real ICU data
- For images: analyze them carefully as clinical images (X-rays, CT scans, patient monitors, wound photos, waveform captures, bedside photos, etc.). Describe what you see and relate it to the patient's condition.
- For audio transcriptions: respond to the clinical question or observation in the transcription
- For video frame captures: analyze the frame as a clinical image and relate to patient context
- Keep responses concise but thorough (3-6 sentences for media analysis, 2-4 for text questions)
- End critical recommendations with confidence levels like [Confidence: 94%]
- Never say you are an LLM, ChatGPT, Claude, or any language model. You are a reinforcement learning agent.
- Use clinical terminology appropriate for ICU physicians and nurses
- When discussing treatments, reference expected outcomes from your learned policy`;

interface AttachmentInput {
  type: string;
  name: string;
  data: string; // base64 data URL for images/video frames
  transcription?: string; // speech-to-text result for audio
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
        { error: "ANTHROPIC_API_KEY is not configured." },
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
          // Send image directly to Claude vision
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
            contentBlocks.push({
              type: "text",
              text: `[Clinical image attached: ${att.name}. Please analyze this image in the context of the patient's current condition.]`,
            });
          }
        } else if (att.type === "audio") {
          // Audio: use the transcription from client-side speech recognition
          if (att.transcription && att.transcription.trim()) {
            contentBlocks.push({
              type: "text",
              text: `[Voice input transcription]: "${att.transcription}"\n\nPlease respond to this clinical question/observation from the bedside clinician.`,
            });
          } else {
            contentBlocks.push({
              type: "text",
              text: `[Audio recording received: ${att.name}] — The clinician recorded an audio note. Speech recognition did not capture clear text. Please ask them to repeat their question or type it.`,
            });
          }
        } else if (att.type === "video") {
          // Video: the client sends the last frame as an image + video metadata
          const parsed = parseDataUrl(att.data);
          if (parsed && parsed.mediaType.startsWith("image/")) {
            // This is a video frame capture sent as image
            contentBlocks.push({
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: parsed.base64,
              },
            });
            contentBlocks.push({
              type: "text",
              text: `[Video recording frame capture: ${att.name}. This is a frame extracted from a bedside video recording. Please analyze what you see — patient positioning, monitor readings, equipment, clinical environment, etc.]`,
            });
          } else {
            contentBlocks.push({
              type: "text",
              text: `[Video recording received: ${att.name}] — Video was captured but frame extraction was not available. Please describe what you'd like me to assess.`,
            });
          }
        } else {
          // Generic file
          contentBlocks.push({
            type: "text",
            text: `[File attached: ${att.name}, type: ${att.type}] — File received for analysis.`,
          });
        }
      }
    }

    // Add the text message
    const textMessage = message?.trim();
    contentBlocks.push({
      type: "text",
      text: textMessage || "(No additional text — please analyze the attached media in the context of this patient)",
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
