import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isLocalTranscriptionSupported,
  resetLocalTranscriber,
  transcribeWithLocalWhisper,
} from "@/lib/whisper-local";

const workers = vi.hoisted(() => ({
  instances: [] as Array<{
    posted: unknown[];
    onmessage: ((event: { data: unknown }) => void) | null;
    onerror: (() => void) | null;
  }>,
}));

class StubWorker {
  posted: unknown[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    workers.instances.push(this);
  }

  postMessage(message: unknown) {
    this.posted.push(message);
  }

  terminate() {}
}

describe("whisper-local", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetLocalTranscriber();
    workers.instances = [];
  });

  it("reporta soporte cuando hay Worker y WebAssembly", () => {
    vi.stubGlobal("Worker", StubWorker);
    expect(isLocalTranscriptionSupported()).toBe(true);
  });

  it("reporta sin soporte sin Worker", () => {
    expect(isLocalTranscriptionSupported()).toBe(false);
  });

  it("resuelve la transcripción del worker", async () => {
    vi.stubGlobal("Worker", StubWorker);

    const pending = transcribeWithLocalWhisper(new Float32Array([0.1]));
    await waitFor(() => expect(workers.instances).toHaveLength(1));
    const worker = workers.instances[0]!;
    await waitFor(() => expect(worker.posted).toHaveLength(1));
    const sent = worker.posted[0] as { id: number; waveform: Float32Array };
    expect(sent.waveform).toBeInstanceOf(Float32Array);

    worker.onmessage?.({ data: { id: sent.id, type: "result", text: "Hola" } });
    await expect(pending).resolves.toBe("Hola");
  });

  it("rechaza cuando el worker reporta error", async () => {
    vi.stubGlobal("Worker", StubWorker);

    const pending = transcribeWithLocalWhisper(new Float32Array([0.1]));
    await waitFor(() => expect(workers.instances).toHaveLength(1));
    const worker = workers.instances[0]!;
    await waitFor(() => expect(worker.posted).toHaveLength(1));
    const sent = worker.posted[0] as { id: number };
    worker.onmessage?.({
      data: { id: sent.id, type: "error", message: "boom" },
    });

    await expect(pending).rejects.toThrow("boom");
  });

  it("reutiliza el mismo worker entre llamadas", async () => {
    vi.stubGlobal("Worker", StubWorker);

    const first = transcribeWithLocalWhisper(new Float32Array([0.1]));
    const second = transcribeWithLocalWhisper(new Float32Array([0.2]));
    await waitFor(() => expect(workers.instances).toHaveLength(1));
    await waitFor(() => {
      expect(workers.instances[0]!.posted).toHaveLength(2);
    });

    const worker = workers.instances[0]!;
    for (const message of worker.posted) {
      const typed = message as { id: number };
      worker.onmessage?.({ data: { id: typed.id, type: "result", text: "ok" } });
    }
    await expect(first).resolves.toBe("ok");
    await expect(second).resolves.toBe("ok");
  });
});
