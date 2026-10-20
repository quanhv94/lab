import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ActivityController } from './activity.controller';
import { ActivityLog, ActivityLogSchema } from './activity-log.schema';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
