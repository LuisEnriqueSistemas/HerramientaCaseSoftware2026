"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const projects_module_1 = require("../projects/projects.module");
const uml_module_1 = require("../uml/uml.module");
const ai_controller_1 = require("./ai.controller");
const ai_assistant_service_1 = require("./ai-assistant.service");
const audio_transcription_service_1 = require("./audio-transcription.service");
const deepseek_service_1 = require("./deepseek.service");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [projects_module_1.ProjectsModule, uml_module_1.UmlModule],
        controllers: [ai_controller_1.AiController, ai_controller_1.AiStatusController],
        providers: [ai_assistant_service_1.AiAssistantService, audio_transcription_service_1.AudioTranscriptionService, deepseek_service_1.DeepseekService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map