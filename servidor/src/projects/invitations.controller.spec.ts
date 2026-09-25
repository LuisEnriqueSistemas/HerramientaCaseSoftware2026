import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  const invitationsService = {
    listPending: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
  } as unknown as jest.Mocked<InvitationsService>;

  const request = {
    user: { sub: 'user-id-1', email: 'ana@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new InvitationsController(invitationsService);
  });

  it('delega la lista de invitaciones pendientes', async () => {
    (invitationsService.listPending as jest.Mock).mockResolvedValue([]);

    const result = await controller.listPending(request as never);

    expect(invitationsService.listPending).toHaveBeenCalledWith('user-id-1');
    expect(result).toEqual([]);
  });

  it('delega la aceptación de una invitación', async () => {
    (invitationsService.accept as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.accept(request as never, 'inv-id-1');

    expect(invitationsService.accept).toHaveBeenCalledWith(
      'user-id-1',
      'inv-id-1',
    );
    expect(result).toEqual({ ok: true });
  });

  it('delega el rechazo de una invitación', async () => {
    (invitationsService.reject as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.reject(request as never, 'inv-id-1');

    expect(invitationsService.reject).toHaveBeenCalledWith(
      'user-id-1',
      'inv-id-1',
    );
    expect(result).toEqual({ ok: true });
  });
});
