import {
  loadTranscriber,
  transcribeWaveform,
} from "./whisper-pipeline";

interface WorkerScope {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
}

interface TranscribeRequest {
  id: number;
  waveform: Float32Array;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event: MessageEvent) => {
  const { id, waveform } = event.data as TranscribeRequest;
  const post = (message: unknown) => scope.postMessage(message);
  void (async () => {
    try {
      const transcriber = await loadTranscriber((progress) =>
        post({ id, type: "progress", progress }),
      );
      const text = await transcribeWaveform(transcriber, waveform);
      post({ id, type: "result", text });
    } catch (error) {
      post({
        id,
        type: "error",
        message: error instanceof Error ? error.message : "Error local",
      });
    }
  })();
};
