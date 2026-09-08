import { Module } from '@nestjs/common';
import { UserAdminRepository } from './user.admin.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserAdminRepository],
})
export class UserModule {}
