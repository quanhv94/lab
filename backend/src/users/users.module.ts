import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLog, ActivityLogSchema } from '../activity/activity-log.schema';
import { RefreshToken, RefreshTokenSchema } from '../auth/refresh-token.schema';
import {
  PracticeResult,
  PracticeResultSchema,
} from '../practice-results/practice-result.schema';
import { User, UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: PracticeResult.name, schema: PracticeResultSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
