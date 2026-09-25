"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAssistantService = void 0;
const common_1 = require("@nestjs/common");
const uml_diagram_service_1 = require("../uml/uml-diagram.service");
const audio_transcription_service_1 = require("./audio-transcription.service");
const deepseek_service_1 = require("./deepseek.service");
const uml_gateway_1 = require("../uml/uml.gateway");
let AiAssistantService = class AiAssistantService {
    deepseekService;
    audioTranscriptionService;
    umlDiagramService;
    umlGateway;
    constructor(deepseekService, audioTranscriptionService, umlDiagramService, umlGateway) {
        this.deepseekService = deepseekService;
        this.audioTranscriptionService = audioTranscriptionService;
        this.umlDiagramService = umlDiagramService;
        this.umlGateway = umlGateway;
    }
    async generateFromPrompt(userId, projectId, prompt) {
        if (typeof prompt !== 'string' || prompt.trim().length < 10) {
            throw new common_1.BadRequestException('Describe el sistema con más detalle');
        }
        const current = await this.umlDiagramService.getDiagram(userId, projectId);
        const generated = this.validateStructure(await this.deepseekService.generateDiagram(prompt.trim(), current));
        const diagram = await this.umlDiagramService.applyGeneratedDiagram(userId, projectId, generated);
        this.umlGateway.emitDiagramGenerated(projectId, diagram);
        return diagram;
    }
    async generateFromAudio(userId, projectId, file) {
        const prompt = await this.audioTranscriptionService.transcribe(file);
        return this.generateFromPrompt(userId, projectId, prompt);
    }
    validateStructure(value) {
        if (!value || typeof value !== 'object') {
            throw new common_1.BadRequestException('La estructura generada no es válida');
        }
        const structure = value;
        if (!Array.isArray(structure.classes) ||
            !Array.isArray(structure.relations)) {
            throw new common_1.BadRequestException('La IA debe devolver clases y relaciones');
        }
        return structure;
    }
};
exports.AiAssistantService = AiAssistantService;
exports.AiAssistantService = AiAssistantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [deepseek_service_1.DeepseekService,
        audio_transcription_service_1.AudioTranscriptionService,
        uml_diagram_service_1.UmlDiagramService,
        uml_gateway_1.UmlGateway])
], AiAssistantService);
//# sourceMappingURL=ai-assistant.service.js.map