interface PendingRequest {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
}

interface WorkerResponse {
  id: number;
  type: "result" | "error" | "progress";
  text?: string;
  message?: string;
  progress?: number;
}

let workerPromise: Promise<Worker> | null = null;
let sequence = 0;
const pending = new Map<number, PendingRequest>();

export function isLocalTranscriptionSupported(): boolean {
  return typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";
}

export function resetLocalTranscriber(): void {
  for (const [, request] of pending) {
    request.reject(new Error("Transcriptor local reiniciado"));
  }
  pending.clear();
  workerPromise = null;
}

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = new Worker(
        new URL("./whisper-worker.ts", import.meta.url),
      );
      worker.onmessage = (event: MessageEvent) => {
        const response = event.data as WorkerResponse;
        const request = pending.get(response.id);
        if (!request) {
          return;
        }
        if (response.type === "result") {
          pending.delete(response.id);
          request.resolve(response.text ?? "");
        } else if (response.type === "error") {
          pending.delete(response.id);
          request.reject(new Error(response.message ?? "Error local"));
        }
      };
      worker.onerror = () => {
        workerPromise = null;
        for (const [, request] of pending) {
          request.reject(new Error("El worker local falló"));
        }
        pending.clear();
      };
      return worker;
    })().catch((error: unknown) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

export async function transcribeWithLocalWhisper(
  waveform: Float32Array,
): Promise<string> {
  const worker = await getWorker();
  sequence += 1;
  const id = sequence;
  return new Promise<string>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, waveform }, [waveform.buffer as ArrayBuffer]);
  });
}

export function terminateLocalWhisper(): void {
  resetLocalTranscriber();
}
