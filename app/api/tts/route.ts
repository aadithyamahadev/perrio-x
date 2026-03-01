import { NextResponse } from "next/server";

const HF_TTS_MODEL = process.env.HF_TTS_MODEL;
const HF_TOKEN = process.env.HF_TOKEN;
const QWEN_TTS_URL = process.env.QWEN_TTS_URL;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, language } = (body as { text?: string; language?: string });

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "Field 'text' is required" },
      { status: 400 }
    );
  }

  // The route will attempt the following backends in order:
  // 1) Local Qwen3-TTS server when `QWEN_TTS_URL` is set (preferred local dev).
  // 2) Hugging Face Inference API when `HF_TTS_MODEL` and `HF_TOKEN` are set.
  // ElevenLabs integration has been removed in favor of the above backends.

  // 2) Fallback to local Qwen3-TTS server when configured.
  if (QWEN_TTS_URL) {
    try {
      const res = await fetch(QWEN_TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg, audio/wav, audio/*",
        },
        body: JSON.stringify({ text, language }),
      });

      if (res.ok) {
        const audioArrayBuffer = await res.arrayBuffer();
        const audioBuffer = Buffer.from(audioArrayBuffer);

        const contentType =
          res.headers.get("content-type") ?? "audio/mpeg";

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
          },
        });
      }
    } catch {
      // Local Qwen server unreachable; fall through to Hugging Face.
    }
  }

  // 2a) Try ElevenLabs when configured (preferred cloud TTS if available).
  if (ELEVENLABS_API_KEY) {
    const voiceId = ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
    const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    try {
      const res = await fetch(elevenUrl, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (res.ok) {
        const audioArrayBuffer = await res.arrayBuffer();
        const audioBuffer = Buffer.from(audioArrayBuffer);
        const contentType = res.headers.get("content-type") ?? "audio/mpeg";

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
          },
        });
      } else {
        const errText = await res.text().catch(() => res.statusText);
        // eslint-disable-next-line no-console
        console.warn(`ElevenLabs TTS non-OK: ${res.status} ${errText}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ElevenLabs TTS request failed:", err);
    }
  }

  // 3) Fallback to Hugging Face Router when configured.
  if (HF_TTS_MODEL && HF_TOKEN) {
    const apiUrl = `https://router.huggingface.co/models/${HF_TTS_MODEL}`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/octet-stream",
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        // Log but don't immediately return an error: allow client-side
        // SpeechSynthesis fallback or other backends to be used.
        // eslint-disable-next-line no-console
        console.warn(`Hugging Face TTS non-OK: ${res.status} ${errText}`);
      } else {
        const audioArrayBuffer = await res.arrayBuffer();
        const audioBuffer = Buffer.from(audioArrayBuffer);
        const contentType = res.headers.get("content-type") ?? "audio/mpeg";

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
          },
        });
      }
    } catch (err) {
      // Log and fall through so the client can use browser TTS fallback.
      // eslint-disable-next-line no-console
      console.warn("Hugging Face TTS request failed:", err);
    }
  }

  // 4) No TTS backend configured.
  return NextResponse.json(
    {
      error:
        "No TTS backend produced audio. Configure a backend via QWEN_TTS_URL or HF_TTS_MODEL/HF_TOKEN, or rely on browser SpeechSynthesis fallback.",
    },
    { status: 500 }
  );
}

