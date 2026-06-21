import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminController } from './admin.controller';
import { UsersService, UserRepository } from '../users/users.service';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';

function createUserRepositoryAdapter(repo: Repository<User>): UserRepository {
  return {
    find: () => repo.find({ order: { createdAt: 'DESC' } }),
    findOne: (id) => repo.findOne({ where: { id } }),
    findAndCount: (options) => repo.findAndCount(options),
    create: async (user) => repo.save(repo.create(user)),
    update: async (id, userData) => {
      await repo.update(id, userData);
      const updated = await repo.findOne({ where: { id } });
      if (!updated) {
        throw new Error(`User with ID ${id} not found after update`);
      }
      return updated;
    },
    delete: async (id) => {
      const result = await repo.delete(id);
      return (result.affected ?? 0) > 0;
    },
  };
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [
    RolesGuard,
    {
      provide: UsersService,
      useFactory: (repo: Repository<User>) =>
        new UsersService(createUserRepositoryAdapter(repo)),
      inject: [getRepositoryToken(User)],
    },
  ],
})
export class AdminModule {}
