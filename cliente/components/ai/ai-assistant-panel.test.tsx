import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiAssistantPanel } from "./ai-assistant-panel";
import {
  getAiProviderStatus,
  transcribeAudioToText,
} from "@/lib/api";
import { decodeToMono16k } from "@/lib/whisper-audio";
import {
  isLocalTranscriptionSupported,
  transcribeWithLocalWhisper,
} from "@/lib/whisper-local";

vi.mock("@/lib/api", () => ({
  generateDiagramFromAudio: vi.fn(),
  generateDiagramFromPrompt: vi.fn(),
  getAiProviderStatus: vi.fn(),
  getApiErrorMessage: () => "error de prueba",
  transcribeAudioToText: vi.fn(),
}));

vi.mock("@/lib/whisper-audio", () => ({
  decodeToMono16k: vi.fn(),
}));

vi.mock("@/lib/whisper-local", () => ({
  isLocalTranscriptionSupported: vi.fn(() => false),
  transcribeWithLocalWhisper: vi.fn(),
}));

const recorded = vi.hoisted(() => ({
  instance: null as {
    ondataavailable: ((event: { data: Blob }) => void) | null;
    onstop: (() => void) | null;
    state: string;
    stop: () => void;
  } | null,
}));

class MockMediaRecorder {
  static isTypeSupported = () => true;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state = "inactive";

  constructor() {
    recorded.instance = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}

const getUserMedia = vi.fn();

function renderPanel() {
  return render(
    <AiAssistantPanel
      projectId="proyecto-1"
      canEdit
      onGenerated={vi.fn()}
    />,
  );
}

describe("AiAssistantPanel micrófono", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
    });
    getUserMedia.mockResolvedValue({ getTracks: () => [] });
    vi.mocked(getAiProviderStatus).mockResolvedValue({
      available: true,
      provider: "deepseek",
      model: "deepseek-chat",
      message: "Proveedor disponible",
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    recorded.instance = null;
  });

  it("graba y pega la transcripción cuando el prompt está vacío", async () => {
    vi.mocked(transcribeAudioToText).mockResolvedValue({ text: "Crea Cliente" });
    renderPanel();
    await screen.findByText("Proveedor disponible");

    const mic = await screen.findByRole("button", {
      name: "Grabar del micrófono",
    });
    await waitFor(() => expect(mic).toBeEnabled());
    fireEvent.click(mic);

    expect(
      await screen.findByRole("button", { name: "Detener grabación" }),
    ).toBeDefined();

    recorded.instance?.ondataavailable?.({
      data: new Blob(["audio"], { type: "audio/webm" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Detener grabación" }));

    await waitFor(() => {
      expect(transcribeAudioToText).toHaveBeenCalledWith(
        "proyecto-1",
        expect.any(Blob),
      );
    });
    const textarea = screen.getByLabelText(
      "Prompt para asistencia con IA",
    ) as HTMLTextAreaElement;
    await waitFor(() => expect(textarea.value).toBe("Crea Cliente"));
  });

  it("no sobrescribe el prompt cuando ya contiene texto", async () => {
    vi.mocked(transcribeAudioToText).mockResolvedValue({ text: "Crea Pedido" });
    renderPanel();
    await screen.findByText("Proveedor disponible");

    const textarea = (await screen.findByLabelText(
      "Prompt para asistencia con IA",
    )) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Texto previo" } });

    const mic = await screen.findByRole("button", {
      name: "Grabar del micrófono",
    });
    await waitFor(() => expect(mic).toBeEnabled());
    fireEvent.click(mic);
    expect(
      await screen.findByRole("button", { name: "Detener grabación" }),
    ).toBeDefined();

    recorded.instance?.ondataavailable?.({
      data: new Blob(["audio"], { type: "audio/webm" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Detener grabación" }));

    await waitFor(() => {
      expect(transcribeAudioToText).toHaveBeenCalled();
    });
    expect(textarea.value).toBe("Texto previo");
  });

  it("avisa cuando se deniega el permiso de micrófono", async () => {
    getUserMedia.mockRejectedValue(
      new DOMException("denied", "NotAllowedError"),
    );
    renderPanel();

    const mic = await screen.findByRole("button", {
      name: "Grabar del micrófono",
    });
    await waitFor(() => expect(mic).toBeEnabled());
    fireEvent.click(mic);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Detener grabación" }),
      ).toBeNull();
    });
  });

  async function recordAndStop() {
    renderPanel();
    await screen.findByText("Proveedor disponible");
    const mic = await screen.findByRole("button", {
      name: "Grabar del micrófono",
    });
    await waitFor(() => expect(mic).toBeEnabled());
    fireEvent.click(mic);
    expect(
      await screen.findByRole("button", { name: "Detener grabación" }),
    ).toBeDefined();
    recorded.instance?.ondataavailable?.({
      data: new Blob(["audio"], { type: "audio/webm" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Detener grabación" }));
  }

  it("transcribe en local y pega sin llamar al servidor", async () => {
    vi.mocked(isLocalTranscriptionSupported).mockReturnValue(true);
    vi.mocked(decodeToMono16k).mockResolvedValue(new Float32Array([0.1, 0.2]));
    vi.mocked(transcribeWithLocalWhisper).mockResolvedValue("Crea Local");

    await recordAndStop();

    const textarea = screen.getByLabelText(
      "Prompt para asistencia con IA",
    ) as HTMLTextAreaElement;
    await waitFor(() => expect(textarea.value).toBe("Crea Local"));
    expect(transcribeAudioToText).not.toHaveBeenCalled();
    expect(transcribeWithLocalWhisper).toHaveBeenCalled();
  });

  it("usa el servidor como fallback si lo local falla", async () => {
    vi.mocked(isLocalTranscriptionSupported).mockReturnValue(true);
    vi.mocked(decodeToMono16k).mockResolvedValue(new Float32Array([0.1]));
    vi.mocked(transcribeWithLocalWhisper).mockRejectedValue(
      new Error("sin modelo"),
    );
    vi.mocked(transcribeAudioToText).mockResolvedValue({ text: "Crea Remoto" });

    await recordAndStop();

    const textarea = screen.getByLabelText(
      "Prompt para asistencia con IA",
    ) as HTMLTextAreaElement;
    await waitFor(() => expect(textarea.value).toBe("Crea Remoto"));
    expect(transcribeAudioToText).toHaveBeenCalledWith(
      "proyecto-1",
      expect.any(Blob),
    );
  });
});
