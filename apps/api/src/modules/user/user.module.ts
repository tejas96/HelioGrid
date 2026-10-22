import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.public';
import { UserAdminRepository } from './user.admin.repository';
import { UserController } from './user.controller';
import { UserPhotoRepository } from './user.photo.repository';
import { UserService } from './user.service';

@Module({
  imports: [FileModule],
  controllers: [UserController],
  providers: [UserService, UserAdminRepository, UserPhotoRepository],
})
export class UserModule {}
