import { WHISPER_SAMPLE_RATE } from "./whisper-pipeline";

interface DecodeAudioContext {
  decodeAudioData(data: ArrayBuffer): Promise<DecodedAudio>;
  close(): Promise<void>;
}

interface DecodedAudio {
  readonly sampleRate: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

type AudioContextConstructor = new (options?: { sampleRate?: number }) => DecodeAudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

function downmixToMono(decoded: DecodedAudio): Float32Array {
  const channels = decoded.numberOfChannels;
  if (channels <= 1) {
    return Float32Array.from(decoded.getChannelData(0));
  }
  const first = decoded.getChannelData(0);
  const mixed = new Float32Array(first.length);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = decoded.getChannelData(channel);
    for (let i = 0; i < mixed.length; i += 1) {
      mixed[i]! += data[i]! / channels;
    }
  }
  return mixed;
}

function resampleLinear(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    return samples;
  }
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.floor(samples.length / ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio;
    const lower = Math.floor(position);
    const upper = Math.min(lower + 1, samples.length - 1);
    const fraction = position - lower;
    output[i]! = samples[lower]! * (1 - fraction) + samples[upper]! * fraction;
  }
  return output;
}

export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const Constructor = getAudioContextConstructor();
  if (!Constructor) {
    throw new Error("AudioContext no soportado en este navegador");
  }
  const context = new Constructor({ sampleRate: WHISPER_SAMPLE_RATE });
  try {
    const buffer = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(buffer);
    const mono = downmixToMono(decoded);
    return resampleLinear(mono, decoded.sampleRate, WHISPER_SAMPLE_RATE);
  } finally {
    await context.close().catch(() => {});
  }
}
