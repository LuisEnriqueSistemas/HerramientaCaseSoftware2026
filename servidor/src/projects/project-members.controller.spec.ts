import { ProjectMembersController } from './project-members.controller';
import { ProjectMembersService } from './project-members.service';
import { InviteUserDto, InviteRole } from './dto/invite-user.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

describe('ProjectMembersController', () => {
  let controller: ProjectMembersController;
  const projectMembersService = {
    inviteUser: jest.fn(),
    listMembers: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
  } as unknown as jest.Mocked<ProjectMembersService>;

  const request = {
    user: { sub: 'user-host', email: 'host@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProjectMembersController(projectMembersService);
  });

  it('delega la invitación con el rol enviado', async () => {
    const dto: InviteUserDto = {
      email: 'ana@example.com',
      role: InviteRole.EDITOR,
    };
    (projectMembersService.inviteUser as jest.Mock).mockResolvedValue({});

    await controller.invite(request as never, 'project-id-1', dto);

    expect(projectMembersService.inviteUser).toHaveBeenCalledWith(
      'user-host',
      'project-id-1',
      'ana@example.com',
      InviteRole.EDITOR,
    );
  });

  it('delega la lista de miembros (async)', async () => {
    (projectMembersService.listMembers as jest.Mock).mockResolvedValue([]);

    const result = await controller.listMembers(
      request as never,
      'project-id-1',
    );

    expect(projectMembersService.listMembers).toHaveBeenCalledWith(
      'user-host',
      'project-id-1',
    );
    expect(result).toEqual([]);
  });

  it('delega la actualización de rol', async () => {
    const dto: UpdateMemberRoleDto = { role: InviteRole.VIEWER };
    (projectMembersService.updateMemberRole as jest.Mock).mockResolvedValue(
      undefined,
    );

    const result = await controller.updateMemberRole(
      request as never,
      'project-id-1',
      'user-id-2',
      dto,
    );

    expect(projectMembersService.updateMemberRole).toHaveBeenCalledWith(
      'user-host',
      'project-id-1',
      'user-id-2',
      InviteRole.VIEWER,
    );
    expect(result).toEqual({ ok: true });
  });

  it('delega la eliminación de un miembro', async () => {
    (projectMembersService.removeMember as jest.Mock).mockResolvedValue(
      undefined,
    );

    const result = await controller.removeMember(
      request as never,
      'project-id-1',
      'user-id-2',
    );

    expect(projectMembersService.removeMember).toHaveBeenCalledWith(
      'user-host',
      'project-id-1',
      'user-id-2',
    );
    expect(result).toEqual({ ok: true });
  });
});
