import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { TypeOrmUsersRepository } from './repositories/typeorm-users.repository';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    { provide: USERS_REPOSITORY, useClass: TypeOrmUsersRepository },
    UsersService,
    JwtAuthGuard,
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
