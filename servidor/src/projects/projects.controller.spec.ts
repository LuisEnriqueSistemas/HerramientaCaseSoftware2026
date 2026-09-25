import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectMemberRole } from './entities/project-member.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  const projectsService = {
    createProject: jest.fn(),
    listProjectsForUser: jest.fn(),
    getProjectDetail: jest.fn(),
    deleteProject: jest.fn(),
  } as unknown as jest.Mocked<ProjectsService>;

  const request = {
    user: { sub: 'user-id-1', email: 'juan@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProjectsController(projectsService);
  });

  it('delega la creación del proyecto en el caso de uso', async () => {
    const dto: CreateProjectDto = { name: 'Sistema de Ventas' };
    const response = {
      id: 'project-id-1',
      name: 'Sistema de Ventas',
      description: null,
      role: ProjectMemberRole.HOST,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    (projectsService.createProject as jest.Mock).mockResolvedValue(response);

    const result = await controller.create(request as never, dto);

    expect(projectsService.createProject).toHaveBeenCalledWith(
      'user-id-1',
      'Sistema de Ventas',
      null,
    );
    expect(result).toBe(response);
  });

  it('delega con descripción definida en la creación', async () => {
    const dto: CreateProjectDto = {
      name: 'App Móvil',
      description: 'Reservas',
    };
    (projectsService.createProject as jest.Mock).mockResolvedValue({});

    await controller.create(request as never, dto);

    expect(projectsService.createProject).toHaveBeenCalledWith(
      'user-id-1',
      'App Móvil',
      'Reservas',
    );
  });

  it('delega la lista de proyectos del usuario', async () => {
    (projectsService.listProjectsForUser as jest.Mock).mockResolvedValue([]);

    const result = await controller.list(request as never);

    expect(projectsService.listProjectsForUser).toHaveBeenCalledWith(
      'user-id-1',
    );
    expect(result).toEqual([]);
  });

  it('delega el detalle del proyecto', async () => {
    (projectsService.getProjectDetail as jest.Mock).mockResolvedValue({});

    await controller.getDetail(request as never, 'project-id-1');

    expect(projectsService.getProjectDetail).toHaveBeenCalledWith(
      'user-id-1',
      'project-id-1',
    );
  });

  it('delega la eliminación del proyecto y devuelve ok', async () => {
    (projectsService.deleteProject as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.remove(request as never, 'project-id-1');

    expect(projectsService.deleteProject).toHaveBeenCalledWith(
      'user-id-1',
      'project-id-1',
    );
    expect(result).toEqual({ ok: true });
  });
});
