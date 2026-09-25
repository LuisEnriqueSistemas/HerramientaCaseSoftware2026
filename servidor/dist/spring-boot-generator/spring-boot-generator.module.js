"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpringBootGeneratorModule = void 0;
const common_1 = require("@nestjs/common");
const uml_module_1 = require("../uml/uml.module");
const spring_boot_generator_controller_1 = require("./spring-boot-generator.controller");
const spring_boot_generator_service_1 = require("./spring-boot-generator.service");
let SpringBootGeneratorModule = class SpringBootGeneratorModule {
};
exports.SpringBootGeneratorModule = SpringBootGeneratorModule;
exports.SpringBootGeneratorModule = SpringBootGeneratorModule = __decorate([
    (0, common_1.Module)({
        imports: [uml_module_1.UmlModule],
        controllers: [spring_boot_generator_controller_1.SpringBootGeneratorController],
        providers: [spring_boot_generator_service_1.SpringBootGeneratorService],
        exports: [spring_boot_generator_service_1.SpringBootGeneratorService],
    })
], SpringBootGeneratorModule);
//# sourceMappingURL=spring-boot-generator.module.js.map