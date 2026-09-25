import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';

interface AudioFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class AudioTranscriptionService {
  async transcribe(file: AudioFile | undefined): Promise<string> {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo de audio');
    }
    if (file.size > 25 * 1024 * 1024) {
      throw new BadRequestException(
        'El archivo de audio no puede superar 25 MB',
      );
    }
    if (!file.mimetype.startsWith('audio/')) {
      throw new BadRequestException(
        'El archivo debe tener un formato de audio',
      );
    }
    const whisperUrl = process.env.WHISPER_URL;
    if (!whisperUrl) {
      throw new BadGatewayException('WHISPER_URL no está configurada');
    }
    const form = new FormData();
    const bytes = new Uint8Array(file.buffer.length);
    bytes.set(file.buffer);
    form.append(
      'file',
      new Blob([bytes], { type: file.mimetype }),
      file.originalname,
    );
    const response = await fetch(whisperUrl, {
      method: 'POST',
      body: form,
    }).catch(() => null);
    if (!response?.ok) {
      throw new BadGatewayException(
        'El servicio local de transcripción no está disponible',
      );
    }
    const body = (await response.json()) as {
      text?: string;
      transcription?: string;
    };
    const text = body.text ?? body.transcription;
    if (!text?.trim()) {
      throw new BadGatewayException(
        'No se pudo obtener una transcripción válida',
      );
    }
    return text.trim();
  }
}
