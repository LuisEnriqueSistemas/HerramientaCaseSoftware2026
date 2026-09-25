import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { UmlModule } from './uml/uml.module';
import { UsersModule } from './users/users.module';
import { getDatabaseConfig } from './config/application.config';
import { AiModule } from './ai/ai.module';
import { SpringBootGeneratorModule } from './spring-boot-generator/spring-boot-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = getDatabaseConfig();
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST') ?? database.host,
          port: database.port,
          username: configService.get<string>('DB_USER') ?? database.user,
          password:
            configService.get<string>('DB_PASSWORD') ?? database.password,
          database: configService.get<string>('DB_NAME') ?? database.database,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
    UmlModule,
    AiModule,
    SpringBootGeneratorModule,
  ],
})
export class AppModule {}
