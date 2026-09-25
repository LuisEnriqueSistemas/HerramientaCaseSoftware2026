"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDetailDto = exports.ProjectListItemDto = exports.ProjectResponseDto = void 0;
class ProjectResponseDto {
    id;
    name;
    description;
    role;
    createdAt;
}
exports.ProjectResponseDto = ProjectResponseDto;
class ProjectListItemDto {
    id;
    name;
    description;
    memberRole;
    createdAt;
}
exports.ProjectListItemDto = ProjectListItemDto;
class ProjectDetailDto {
    id;
    name;
    description;
    createdBy;
    memberRole;
    createdAt;
}
exports.ProjectDetailDto = ProjectDetailDto;
//# sourceMappingURL=project-response.dto.js.map