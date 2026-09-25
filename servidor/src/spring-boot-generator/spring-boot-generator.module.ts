import { Module } from '@nestjs/common';
import { UmlModule } from '../uml/uml.module';
import { SpringBootGeneratorController } from './spring-boot-generator.controller';
import { SpringBootGeneratorService } from './spring-boot-generator.service';

@Module({
  imports: [UmlModule],
  controllers: [SpringBootGeneratorController],
  providers: [SpringBootGeneratorService],
  exports: [SpringBootGeneratorService],
})
export class SpringBootGeneratorModule {}
