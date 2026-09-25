import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsModule } from '../projects/projects.module';
import { UmlClassNode } from './entities/uml-class-node.entity';
import { UmlDiagram } from './entities/uml-diagram.entity';
import { UmlRelation } from './entities/uml-relation.entity';
import { TypeOrmUmlDiagramRepository } from './repositories/typeorm-uml-diagram.repository';
import { UML_DIAGRAM_REPOSITORY } from './repositories/uml-diagram-repository.interface';
import { UmlController } from './uml.controller';
import { UmlDiagramService } from './uml-diagram.service';
import { UmlGateway } from './uml.gateway';
import { UmlXsdExportService } from './xsd/uml-xsd-export.service';
import { UmlXmiExportService } from './xmi/uml-xmi-export.service';
import { EaXmiExportService } from './ea-xmi/ea-xmi-export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UmlDiagram, UmlClassNode, UmlRelation]),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [UmlController],
  providers: [
    {
      provide: UML_DIAGRAM_REPOSITORY,
      useClass: TypeOrmUmlDiagramRepository,
    },
    UmlDiagramService,
    UmlGateway,
    UmlXsdExportService,
    UmlXmiExportService,
    EaXmiExportService,
    JwtAuthGuard,
  ],
  exports: [UmlDiagramService, UmlGateway, UML_DIAGRAM_REPOSITORY],
})
export class UmlModule {}
