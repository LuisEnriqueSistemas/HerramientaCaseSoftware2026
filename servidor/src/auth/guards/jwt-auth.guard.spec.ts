import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { JwtAuthGuard, RENEWED_TOKEN_HEADER } from './jwt-auth.guard';

describe('JwtAuthGuard (expiración deslizante)', () => {
  let guard: JwtAuthGuard;
  const jwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const request = {
    headers: {},
  } as Request & { user?: unknown };
  const response = {
    setHeader: jest.fn(),
  } as unknown as Response;
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  const basePayload = { sub: 'user-1', email: 'a@example.com' };
  const nowMs = Date.now();

  beforeEach(() => {
    jest.clearAllMocks();
    request.headers = { authorization: 'Bearer valid-token' };
    (request as { user?: unknown }).user = undefined;
    (configService.get as jest.Mock).mockReturnValue('30m');
    guard = new JwtAuthGuard(jwtService, configService);
  });

  it('rechaza cuando no se envía token', async () => {
    request.headers = {};

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza cuando el token es inválido o expirado', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('TokenExpiredError'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('no renueva cuando al token le queda vida de sobra', async () => {
    const remainingSecs = 3600;
    const payload = {
      ...basePayload,
      exp: Math.floor((nowMs + remainingSecs * 1000) / 1000),
    };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(response.setHeader).not.toHaveBeenCalled();
    expect((request as { user?: unknown }).user).toEqual(payload);
  });

  it('renueva con header x-access-token cuando queda poco tiempo', async () => {
    const remainingSecs = 600;
    const payload = {
      ...basePayload,
      exp: Math.floor((nowMs + remainingSecs * 1000) / 1000),
    };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('renewed-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'a@example.com',
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      RENEWED_TOKEN_HEADER,
      'renewed-token',
    );
  });

  it('renueva en el límite exacto de la ventana deslizante', async () => {
    const remainingSecs = 1800;
    const payload = {
      ...basePayload,
      exp: Math.floor((nowMs + remainingSecs * 1000) / 1000),
    };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('renewed-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(response.setHeader).toHaveBeenCalledWith(
      RENEWED_TOKEN_HEADER,
      'renewed-token',
    );
  });
});
