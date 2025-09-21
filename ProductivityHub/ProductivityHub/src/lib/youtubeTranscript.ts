// src/lib/youtubeTranscript.ts
import { YoutubeTranscript } from "youtube-transcript";

function extractYouTubeId(input: string): string {
  // Supports full URLs, shorts, youtu.be links, and direct IDs
  try {
    // Direct ID case (no protocol, no domain)
    if (!/^https?:\/\//i.test(input) && /^[\w-]{10,}$/.test(input)) {
      return input;
    }
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        if (id) return id;
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2];
      }
      // /live/VIDEO_ID pattern
      if (url.pathname.startsWith("/live/")) {
        return url.pathname.split("/")[2];
      }
    }

    if (host === "youtu.be") {
      return url.pathname.slice(1);
    }
  } catch {
    // If URL parsing fails, fall back to original string (might be an ID)
  }
  return input;
}

export async function getYouTubeTranscriptSafe(urlOrId: string): Promise<string> {
  const id = extractYouTubeId(urlOrId);
  try {
    const segments = await YoutubeTranscript.fetchTranscript(id);
    // segments: [{ text: string; offset: number; duration: number }]
    const text = segments.map((s: any) => s.text.trim()).join(" ").replace(/\s+/g, " ").trim();
    if (!text) {
      throw new Error("Empty transcript.");
    }
    return text;
  } catch (err: any) {
    // Provide detailed error messages for different scenarios
    if (err?.message?.includes("disabled")) {
      throw new Error("This video has transcripts/captions disabled by the creator. Please try a different video or use the text input method instead.");
    } else if (err?.message?.includes("not available")) {
      throw new Error("No transcript is available for this video. This could be because the video doesn't have captions or they're in a language not supported by the transcript service.");
    } else if (err?.message?.includes("private") || err?.message?.includes("unavailable")) {
      throw new Error("This video is private, unlisted, or has been removed. Please check the URL and try again.");
    } else if (err?.message?.includes("restricted")) {
      throw new Error("This video has geographic or age restrictions that prevent transcript access.");
    } else {
      const reason = err?.message || "Unknown error";
      throw new Error(`Unable to fetch transcript: ${reason}. You can try using the text input method instead or check if the video has captions enabled.`);
    }
  }
}
