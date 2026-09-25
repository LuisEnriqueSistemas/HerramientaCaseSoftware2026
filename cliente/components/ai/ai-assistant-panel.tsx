"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, FileAudio, Loader2, Mic, RefreshCw, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateDiagramFromAudio,
  generateDiagramFromPrompt,
  getAiProviderStatus,
  getApiErrorMessage,
  transcribeAudioToText,
} from "@/lib/api";
import { decodeToMono16k } from "@/lib/whisper-audio";
import {
  isLocalTranscriptionSupported,
  transcribeWithLocalWhisper,
} from "@/lib/whisper-local";
import type { AiChatMessage, AiProviderStatus } from "@/lib/ai-types";
import type { UmlDiagram } from "@/lib/uml-types";

interface AiAssistantPanelProps {
  projectId: string;
  canEdit: boolean;
  onGenerated: (diagram: UmlDiagram) => void;
}

export function AiAssistantPanel({
  projectId,
  canEdit,
  onGenerated,
}: AiAssistantPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AiProviderStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeNote, setTranscribeNote] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const promptValueRef = useRef(prompt);

  useEffect(() => {
    promptValueRef.current = prompt;
  }, [prompt]);

  const MAX_RECORDING_SECONDS = 120;

  const formatElapsed = (total: number) => {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const clearRecordingTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  const checkProvider = async () => {
    setCheckingStatus(true);
    try {
      setStatus(await getAiProviderStatus());
    } catch {
      setStatus({
        available: false,
        provider: "deepseek",
        model: "",
        message: "No se pudo consultar el estado de DeepSeek",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkProvider();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      clearRecordingTimers();
      stopStream();
    };
  }, []);

  const appendMessage = (message: AiChatMessage) => {
    setMessages((current) => [...current, message]);
  };

  const processResult = (diagram: UmlDiagram) => {
    onGenerated(diagram);
    appendMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Propuesta UML generada y aplicada al diagrama.",
    });
  };

  const submitPrompt = async () => {
    const value = prompt.trim();
    if (!value || loading || !canEdit || !status?.available) {
      return;
    }
    appendMessage({ id: crypto.randomUUID(), role: "user", content: value });
    setPrompt("");
    setLoading(true);
    try {
      processResult(await generateDiagramFromPrompt(projectId, value));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAudio = async (file: File | undefined) => {
    if (!file || loading || !canEdit || !status?.available) {
      return;
    }
    if (!file.type.startsWith("audio/")) {
      toast.error("Selecciona un archivo de audio válido");
      return;
    }
    appendMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: `Audio adjunto: ${file.name}`,
    });
    setLoading(true);
    try {
      processResult(await generateDiagramFromAudio(projectId, file));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const applyTranscribedText = (value: string) => {
    if (!value) {
      toast.error("No se reconoció voz en el audio");
      return;
    }
    if (promptValueRef.current.trim().length === 0) {
      setPrompt(value);
      promptRef.current?.focus();
    } else {
      toast.info("El prompt ya contiene texto; no se sobrescribió");
    }
  };

  const transcribeServerSide = async (blob: Blob) => {
    const { text } = await transcribeAudioToText(projectId, blob);
    applyTranscribedText(text.trim());
  };

  const transcribeLocally = async (blob: Blob): Promise<boolean> => {
    if (!isLocalTranscriptionSupported()) {
      return false;
    }
    try {
      setTranscribeNote("Descargando modelo local (solo primera vez)…");
      const waveform = await decodeToMono16k(blob);
      setTranscribeNote("Transcribiendo localmente…");
      const text = await transcribeWithLocalWhisper(waveform);
      applyTranscribedText(text.trim());
      return true;
    } catch {
      return false;
    } finally {
      setTranscribeNote(null);
    }
  };

  const handleRecordingStop = async (chunks: Blob[], mimeType: string) => {
    clearRecordingTimers();
    stopStream();
    setIsRecording(false);
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size === 0) {
      toast.error("Grabación vacía, intenta de nuevo");
      return;
    }
    setIsTranscribing(true);
    try {
      const doneLocally = await transcribeLocally(blob);
      if (!doneLocally) {
        await transcribeServerSide(blob);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }
    recorder.stop();
  };

  const startRecording = async () => {
    if (isRecording || isTranscribing || loading || !canEdit || !status?.available) {
      return;
    }
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error("Tu navegador no soporta grabación de audio");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        void handleRecordingStop(chunksRef.current, mimeType);
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setElapsedSec(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedSec((current) => current + 1);
      }, 1000);
      stopTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (error) {
      stopStream();
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("Permiso de micrófono denegado");
      } else if (
        error instanceof DOMException &&
        (error.name === "NotFoundError" || error.name === "OverconstrainedError")
      ) {
        toast.error("No se encontró micrófono");
      } else {
        toast.error("No se pudo iniciar la grabación");
      }
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-col rounded-b-lg border border-zinc-200 bg-white">
      <header className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
        <Bot className="h-4 w-4 text-violet-600" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-zinc-800">Asistencia con IA</h2>
          <p className="text-xs text-zinc-500">Proveedor DeepSeek</p>
        </div>
      </header>
      <div
        className={`flex items-start gap-2 border-b px-3 py-2 text-xs ${
          status?.available
            ? "border-emerald-100 bg-emerald-50 text-emerald-800"
            : "border-amber-100 bg-amber-50 text-amber-900"
        }`}
      >
        {status?.available ? (
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p>{status?.message ?? "Comprobando proveedor..."}</p>
          {!status?.available ? (
            <p className="mt-1 leading-relaxed">
              Verifica la API key del servidor (API_KEY_DEEPSEEK).
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={checkingStatus}
          onClick={() => void checkProvider()}
          aria-label="Reintentar conexión con DeepSeek"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checkingStatus ? "animate-spin" : ""}`} aria-hidden />
        </Button>
      </div>
      <div className="flex min-h-48 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-xs leading-relaxed text-zinc-500">
            Describe las clases, atributos y relaciones que deseas modelar.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md px-3 py-2 text-xs ${
                message.role === "user"
                  ? "ml-5 bg-zinc-900 text-white"
                  : "mr-5 bg-violet-50 text-violet-950"
              }`}
            >
              {message.content}
            </div>
          ))
        )}
      </div>
      <div className="border-t border-zinc-200 p-3">
        {!canEdit ? (
          <p className="mb-2 text-xs text-zinc-500">Solo los editores pueden usar la asistencia.</p>
        ) : null}
        <Textarea
          ref={promptRef}
          value={prompt}
          disabled={!canEdit || loading}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void submitPrompt();
            }
          }}
          placeholder="Ej.: Crea Cliente y Pedido, relacionados uno a muchos"
          aria-label="Prompt para asistencia con IA"
          className="min-h-24 resize-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => {
              void submitAudio(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canEdit || loading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cargar audio de requisitos"
            >
              <FileAudio className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              disabled={!canEdit || loading || isTranscribing}
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  void startRecording();
                }
              }}
              aria-label={isRecording ? "Detener grabación" : "Grabar del micrófono"}
            >
              {isRecording ? (
                <Square className="h-4 w-4 animate-pulse" aria-hidden />
              ) : (
                <Mic className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!canEdit || loading || prompt.trim().length === 0}
            onClick={() => void submitPrompt()}
            className="gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Generar
          </Button>
        </div>
        {isRecording ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600" role="status">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" aria-hidden />
            Grabando {formatElapsed(elapsedSec)} (máx. 02:00)…
          </p>
        ) : null}
        {isTranscribing ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {transcribeNote ?? "Transcribiendo audio…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
