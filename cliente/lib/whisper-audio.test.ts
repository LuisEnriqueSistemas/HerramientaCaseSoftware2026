import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeToMono16k } from "@/lib/whisper-audio";

function fakeBlob(): Blob {
  return {
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    size: 8,
    type: "audio/webm",
  } as unknown as Blob;
}

function stubAudioContext(decoded: {
  sampleRate: number;
  numberOfChannels: number;
  channels: Float32Array[];
}) {
  const decodeAudioData = vi.fn().mockResolvedValue({
    sampleRate: decoded.sampleRate,
    numberOfChannels: decoded.numberOfChannels,
    getChannelData: (channel: number) => decoded.channels[channel]!,
  });
  const close = vi.fn().mockResolvedValue(undefined);
  const Constructor = vi.fn().mockImplementation(() => ({
    decodeAudioData,
    close,
  }));
  vi.stubGlobal("AudioContext", Constructor);
  return { decodeAudioData, close };
}

describe("whisper-audio", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodifica a mono 16kHz", async () => {
    stubAudioContext({
      sampleRate: 16000,
      numberOfChannels: 1,
      channels: [new Float32Array([0.5, -0.5, 0.25])],
    });

    const result = await decodeToMono16k(fakeBlob());

    expect(result).toBeInstanceOf(Float32Array);
    expect(Array.from(result)).toEqual([0.5, -0.5, 0.25]);
  });

  it("mezcla estéreo a mono y remuestrea", async () => {
    stubAudioContext({
      sampleRate: 8000,
      numberOfChannels: 2,
      channels: [
        new Float32Array([1, 1, 1, 1]),
        new Float32Array([0, 0, 0, 0]),
      ],
    });

    const result = await decodeToMono16k(fakeBlob());

    expect(result.length).toBe(8);
    for (const sample of result) {
      expect(sample).toBeCloseTo(0.5, 5);
    }
  });

  it("falla sin AudioContext", async () => {
    await expect(decodeToMono16k(new Blob(["x"]))).rejects.toThrow(
      "AudioContext no soportado",
    );
  });
});
