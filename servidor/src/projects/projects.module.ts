import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UmlModule } from '../uml/uml.module';
import { UsersModule } from '../users/users.module';
import { Project } from './entities/project.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { ProjectMember } from './entities/project-member.entity';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { ProjectMembersController } from './project-members.controller';
import { ProjectMembersService } from './project-members.service';
import { PROJECT_INVITATIONS_REPOSITORY } from './repositories/project-invitations-repository.interface';
import { TypeOrmProjectInvitationsRepository } from './repositories/typeorm-project-invitations.repository';
import { PROJECT_MEMBERS_REPOSITORY } from './repositories/project-members-repository.interface';
import { TypeOrmProjectMembersRepository } from './repositories/typeorm-project-members.repository';
import { PROJECTS_REPOSITORY } from './repositories/projects-repository.interface';
import { TypeOrmProjectsRepository } from './repositories/typeorm-projects.repository';
import { ProjectsController } from './projects.controller';
import { ProjectsGateway } from './projects.gateway';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvitation]),
    UsersModule,
    forwardRef(() => UmlModule),
  ],
  controllers: [
    ProjectsController,
    ProjectMembersController,
    InvitationsController,
  ],
  providers: [
    { provide: PROJECTS_REPOSITORY, useClass: TypeOrmProjectsRepository },
    {
      provide: PROJECT_MEMBERS_REPOSITORY,
      useClass: TypeOrmProjectMembersRepository,
    },
    {
      provide: PROJECT_INVITATIONS_REPOSITORY,
      useClass: TypeOrmProjectInvitationsRepository,
    },
    ProjectsService,
    ProjectMembersService,
    InvitationsService,
    ProjectsGateway,
    JwtAuthGuard,
  ],
  exports: [PROJECT_MEMBERS_REPOSITORY],
})
export class ProjectsModule {}
