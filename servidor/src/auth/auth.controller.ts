import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return this.authService.executeRegister(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginUserDto): Promise<AuthResponseDto> {
    return this.authService.executeLogin(dto);
  }
}
