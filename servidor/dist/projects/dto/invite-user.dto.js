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
exports.InviteUserDto = exports.InviteRole = void 0;
const class_validator_1 = require("class-validator");
var InviteRole;
(function (InviteRole) {
    InviteRole["EDITOR"] = "editor";
    InviteRole["VIEWER"] = "viewer";
})(InviteRole || (exports.InviteRole = InviteRole = {}));
class InviteUserDto {
    email;
    role;
}
exports.InviteUserDto = InviteUserDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico no es válido' }),
    __metadata("design:type", String)
], InviteUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(InviteRole, { message: 'El rol debe ser editor o viewer' }),
    __metadata("design:type", String)
], InviteUserDto.prototype, "role", void 0);
//# sourceMappingURL=invite-user.dto.js.map