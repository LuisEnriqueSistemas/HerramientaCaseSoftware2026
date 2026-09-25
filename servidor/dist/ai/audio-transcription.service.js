"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioTranscriptionService = void 0;
const common_1 = require("@nestjs/common");
let AudioTranscriptionService = class AudioTranscriptionService {
    async transcribe(file) {
        if (!file) {
            throw new common_1.BadRequestException('Debes adjuntar un archivo de audio');
        }
        if (file.size > 25 * 1024 * 1024) {
            throw new common_1.BadRequestException('El archivo de audio no puede superar 25 MB');
        }
        if (!file.mimetype.startsWith('audio/')) {
            throw new common_1.BadRequestException('El archivo debe tener un formato de audio');
        }
        const whisperUrl = process.env.WHISPER_URL;
        if (!whisperUrl) {
            throw new common_1.BadGatewayException('WHISPER_URL no está configurada');
        }
        const form = new FormData();
        const bytes = new Uint8Array(file.buffer.length);
        bytes.set(file.buffer);
        form.append('file', new Blob([bytes], { type: file.mimetype }), file.originalname);
        const response = await fetch(whisperUrl, {
            method: 'POST',
            body: form,
        }).catch(() => null);
        if (!response?.ok) {
            throw new common_1.BadGatewayException('El servicio local de transcripción no está disponible');
        }
        const body = (await response.json());
        const text = body.text ?? body.transcription;
        if (!text?.trim()) {
            throw new common_1.BadGatewayException('No se pudo obtener una transcripción válida');
        }
        return text.trim();
    }
};
exports.AudioTranscriptionService = AudioTranscriptionService;
exports.AudioTranscriptionService = AudioTranscriptionService = __decorate([
    (0, common_1.Injectable)()
], AudioTranscriptionService);
//# sourceMappingURL=audio-transcription.service.js.map