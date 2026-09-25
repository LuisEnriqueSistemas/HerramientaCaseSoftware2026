import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { type UsersRepository } from '../users/repositories/users-repository.interface';
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: UsersRepository, jwtService: JwtService);
    executeRegister(dto: RegisterUserDto): Promise<UserResponseDto>;
    executeLogin(dto: LoginUserDto): Promise<AuthResponseDto>;
    private toUserResponse;
}
