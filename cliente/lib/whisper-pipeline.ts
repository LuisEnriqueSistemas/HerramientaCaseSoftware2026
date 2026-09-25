export const WHISPER_MODEL_ID = "Xenova/whisper-tiny";
export const WHISPER_SAMPLE_RATE = 16000;
export const WHISPER_LANGUAGE = "es";

export type TranscriberFn = (
  audio: Float32Array,
  options?: Record<string, unknown>,
) => Promise<unknown>;

let cached: Promise<TranscriberFn> | null = null;

export function resetTranscriberCache(): void {
  cached = null;
}

export async function loadTranscriber(
  onProgress?: (progress: number) => void,
): Promise<TranscriberFn> {
  if (!cached) {
    cached = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        WHISPER_MODEL_ID,
        {
          dtype: "q8",
          device: "wasm",
          progress_callback: onProgress
            ? (info: unknown) => {
                const progress =
                  typeof info === "object" && info !== null && "progress" in info
                    ? (info as { progress?: unknown }).progress
                    : undefined;
                onProgress(typeof progress === "number" ? progress : 0);
              }
            : undefined,
        },
      );
      return transcriber as unknown as TranscriberFn;
    })().catch((error: unknown) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

export async function transcribeWaveform(
  transcriber: TranscriberFn,
  waveform: Float32Array,
): Promise<string> {
  const output = await transcriber(waveform, {
    language: WHISPER_LANGUAGE,
    task: "transcribe",
  });
  if (typeof output === "string") {
    return output.trim();
  }
  if (Array.isArray(output)) {
    return output
      .map((chunk) =>
        typeof chunk === "object" && chunk !== null
          ? String((chunk as { text?: unknown }).text ?? "")
          : "",
      )
      .join(" ")
      .trim();
  }
  if (typeof output === "object" && output !== null) {
    return String((output as { text?: unknown }).text ?? "").trim();
  }
  return "";
}
