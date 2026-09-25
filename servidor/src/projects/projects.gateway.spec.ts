import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ProjectMemberRole } from './entities/project-member.entity';
import { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { PROJECT_SOCKET_EVENTS, ProjectsGateway } from './projects.gateway';

describe('ProjectsGateway (CU-08 sincronización en tiempo real)', () => {
  let gateway: ProjectsGateway;
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
  const membersRepository = {
    find: jest.fn(),
  } as unknown as jest.Mocked<ProjectMembersRepository>;

  const socketMock = {
    data: {} as Record<string, unknown>,
    handshake: { auth: { token: 'valid-token' } },
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    rooms: new Set<string>(),
  } as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new ProjectsGateway(jwtService, membersRepository);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map<string, Socket>(),
      },
      in: jest.fn().mockReturnThis(),
    } as unknown as Server;
    socketMock.data = {};
    socketMock.join.mockResolvedValue(undefined);
  });

  describe('handleConnection', () => {
    it('verifica el token y une el socket a la sala del usuario', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        email: 'a@example.com',
      });

      await gateway.handleConnection(socketMock);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect((socketMock.data as { userId: string }).userId).toBe('user-1');
      expect(socketMock.join).toHaveBeenCalledWith('user:user-1');
      expect(socketMock.disconnect).not.toHaveBeenCalled();
    });

    it('desconecta cuando no se envía token (handshake) ', async () => {
      (socketMock.handshake as { auth: { token?: unknown } }).auth = {};

      await gateway.handleConnection(socketMock);

      expect(socketMock.disconnect).toHaveBeenCalledWith(true);
    });

    it('desconecta cuando el token es inválido o expirado', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('TokenExpiredError'),
      );

      await gateway.handleConnection(socketMock);

      expect(socketMock.disconnect).toHaveBeenCalledWith(true);
      expect(socketMock.join).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinProject', () => {
    it('une al socket al proyecto solo si es miembro', async () => {
      (socketMock.data as { userId: string }).userId = 'user-1';
      (membersRepository.find as jest.Mock).mockResolvedValue({
        id: 'm1',
        projectId: 'project-1',
        userId: 'user-1',
        role: ProjectMemberRole.EDITOR,
      });

      const result = await gateway.handleJoinProject(socketMock, 'project-1');

      expect(membersRepository.find).toHaveBeenCalledWith(
        'project-1',
        'user-1',
      );
      expect(socketMock.join).toHaveBeenCalledWith('project:project-1');
      expect(socketMock.emit).toHaveBeenCalledWith(
        PROJECT_SOCKET_EVENTS.PROJECT_JOINED,
        { ok: true, projectId: 'project-1', role: ProjectMemberRole.EDITOR },
      );
      expect(result).toEqual({ ok: true, projectId: 'project-1' });
    });

    it('rechaza la unión cuando el usuario no es miembro', async () => {
      (socketMock.data as { userId: string }).userId = 'user-1';
      (membersRepository.find as jest.Mock).mockResolvedValue(null);

      const result = await gateway.handleJoinProject(socketMock, 'project-1');

      expect(socketMock.join).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false });
    });

    it('rechaza cuando el payload de projectId es inválido', async () => {
      (socketMock.data as { userId: string }).userId = 'user-1';

      const result = await gateway.handleJoinProject(socketMock, 123);

      expect(membersRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false });
    });
  });

  describe('emitPermissionUpdate', () => {
    it('emite el evento permissions_updated a la sala del usuario', () => {
      gateway.emitPermissionUpdate(
        'project-1',
        'user-2',
        ProjectMemberRole.VIEWER,
      );

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-2');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        PROJECT_SOCKET_EVENTS.PERMISSIONS_UPDATED,
        { projectId: 'project-1', role: ProjectMemberRole.VIEWER },
      );
    });
  });

  describe('emitUserRemoved', () => {
    it('emite user_removed y desconecta los sockets del usuario', () => {
      gateway.server.sockets.sockets = new Map<string, Socket>();
      gateway.server.sockets.sockets.set('socket-1', {
        ...socketMock,
        data: { userId: 'user-2' },
      } as unknown as Socket);

      gateway.emitUserRemoved('project-1', 'user-2');

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-2');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        PROJECT_SOCKET_EVENTS.USER_REMOVED,
        { projectId: 'project-1' },
      );
      expect(socketMock.disconnect).toHaveBeenCalledWith(true);
    });

    it('no desconecta sockets de otros usuarios', () => {
      gateway.server.sockets.sockets = new Map<string, Socket>();
      const otherSocket = {
        ...socketMock,
        data: { userId: 'user-3' },
      } as unknown as Socket;
      gateway.server.sockets.sockets.set('socket-2', otherSocket);

      gateway.emitUserRemoved('project-1', 'user-2');

      expect(otherSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('emitProjectDeleted', () => {
    const makeSocket = (rooms: string[]): Socket =>
      ({
        data: {} as Record<string, unknown>,
        handshake: { auth: { token: 'valid-token' } },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        rooms: new Set<string>(rooms),
      }) as unknown as Socket;

    it('emite project_deleted a la sala y desconecta los sockets conectados', () => {
      gateway.server.sockets.sockets = new Map<string, Socket>();
      const inProject = makeSocket(['project:project-1']);
      const inOtherProject = makeSocket(['project:project-2']);
      gateway.server.sockets.sockets.set('socket-1', inProject);
      gateway.server.sockets.sockets.set('socket-2', inOtherProject);

      gateway.emitProjectDeleted('project-1');

      expect(gateway.server.to).toHaveBeenCalledWith('project:project-1');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        PROJECT_SOCKET_EVENTS.PROJECT_DELETED,
        { projectId: 'project-1' },
      );
      expect(inProject.disconnect).toHaveBeenCalledWith(true);
      expect(inOtherProject.disconnect).not.toHaveBeenCalled();
    });

    it('no desconecta nada cuando no hay sockets en la sala', () => {
      gateway.server.sockets.sockets = new Map<string, Socket>();
      const otherSocket = makeSocket(['project:project-2']);
      gateway.server.sockets.sockets.set('socket-2', otherSocket);

      gateway.emitProjectDeleted('project-1');

      expect(otherSocket.disconnect).not.toHaveBeenCalled();
    });
  });
});
