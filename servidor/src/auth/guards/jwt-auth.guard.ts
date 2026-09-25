import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import ms, { type StringValue } from 'ms';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

export const RENEWED_TOKEN_HEADER = 'x-access-token';

interface VerifiedJwtPayload extends JwtPayload {
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { user?: unknown }>();
    const response = httpContext.getResponse<Response>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No autenticado');
    }

    let payload: VerifiedJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<VerifiedJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    request.user = payload;
    await this.renewIfNeeded(response, payload);

    return true;
  }

  private async renewIfNeeded(
    response: Response,
    payload: VerifiedJwtPayload,
  ): Promise<void> {
    const remainingMs = payload.exp * 1000 - Date.now();
    const slideWindow = this.configService.get<StringValue>(
      'JWT_SLIDE_WINDOW',
      '30m' as StringValue,
    );
    const slideWindowMs = ms(slideWindow);

    if (remainingMs <= slideWindowMs) {
      const renewed = await this.jwtService.signAsync({
        sub: payload.sub,
        email: payload.email,
      });
      response.setHeader(RENEWED_TOKEN_HEADER, renewed);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
