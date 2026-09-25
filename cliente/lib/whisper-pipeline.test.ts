import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  loadTranscriber,
  resetTranscriberCache,
  transcribeWaveform,
} from "@/lib/whisper-pipeline";

vi.mock("@huggingface/transformers", () => ({
  pipeline: vi.fn(),
  env: {} as Record<string, unknown>,
}));

import { env, pipeline } from "@huggingface/transformers";

describe("whisper-pipeline", () => {
  beforeEach(() => {
    resetTranscriberCache();
    vi.clearAllMocks();
  });

  it("carga el pipeline whisper-tiny una sola vez", async () => {
    const fake = vi.fn().mockResolvedValue("hola");
    vi.mocked(pipeline).mockResolvedValue(fake as never);

    const first = await loadTranscriber();
    const second = await loadTranscriber();

    expect(first).toBe(second);
    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline).toHaveBeenCalledWith(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny",
      expect.objectContaining({ dtype: "q8", device: "wasm" }),
    );
    expect(env.allowLocalModels).toBe(false);
  });

  it("reinicia la caché ante un fallo de carga", async () => {
    resetTranscriberCache();
    vi.mocked(pipeline).mockRejectedValueOnce(new Error("sin red"));
    await expect(loadTranscriber()).rejects.toThrow("sin red");

    const fake = vi.fn().mockResolvedValue("hola");
    vi.mocked(pipeline).mockResolvedValue(fake as never);
    await expect(loadTranscriber()).resolves.toBe(fake);
    expect(pipeline).toHaveBeenCalledTimes(2);
  });

  it("transcribe con idioma español y recorta el texto", async () => {
    const fake = vi
      .fn()
      .mockResolvedValue([{ text: "  Crea Cliente  " }]);
    const text = await transcribeWaveform(
      fake,
      new Float32Array([0.1, 0.2]),
    );

    expect(fake).toHaveBeenCalledWith(
      expect.any(Float32Array),
      expect.objectContaining({ language: "es", task: "transcribe" }),
    );
    expect(text).toBe("Crea Cliente");
  });

  it("acepta salida en texto plano y objeto", async () => {
    const plain = vi.fn().mockResolvedValue(" Hola ");
    await expect(
      transcribeWaveform(plain, new Float32Array([0])),
    ).resolves.toBe("Hola");

    const shaped = vi.fn().mockResolvedValue({ text: " Adiós " });
    await expect(
      transcribeWaveform(shaped, new Float32Array([0])),
    ).resolves.toBe("Adiós");
  });
});
