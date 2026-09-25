import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const userPayload: JwtPayload = { sub: 'user-id-1', email: 'juan@example.com' };

function buildRequest(): ExpressRequest & { user: JwtPayload } {
  return {
    user: userPayload,
  } as ExpressRequest & { user: JwtPayload };
}

describe('UsersController (CU-04 Gestionar perfil)', () => {
  let controller: UsersController;
  const usersService = {
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService);
  });

  it('delega la consulta de perfil en el caso de uso con el id del token', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      id: 'user-id-1',
    });

    const result = await controller.getProfile(buildRequest());

    expect(usersService.findById).toHaveBeenCalledWith('user-id-1');
    expect(result).toEqual({ id: 'user-id-1' });
  });

  it('delega la actualización del perfil en el caso de uso', async () => {
    const dto: UpdateProfileDto = { name: 'Ana García' };
    (usersService.update as jest.Mock).mockResolvedValue({ id: 'user-id-1' });

    const result = await controller.updateProfile(buildRequest(), dto);

    expect(usersService.update).toHaveBeenCalledWith('user-id-1', dto);
    expect(result).toEqual({ id: 'user-id-1' });
  });

  it('delega la eliminación de la cuenta en el caso de uso', async () => {
    (usersService.remove as jest.Mock).mockResolvedValue(undefined);

    await controller.deleteAccount(buildRequest());

    expect(usersService.remove).toHaveBeenCalledWith('user-id-1');
  });
});
