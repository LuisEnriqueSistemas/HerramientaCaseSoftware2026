import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(request: AuthenticatedRequest): Promise<UserResponseDto>;
    updateProfile(request: AuthenticatedRequest, dto: UpdateProfileDto): Promise<UserResponseDto>;
    deleteAccount(request: AuthenticatedRequest): Promise<void>;
}
export {};
