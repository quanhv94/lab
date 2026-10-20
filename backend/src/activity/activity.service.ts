import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordActivityDto } from './dto/record-activity.dto';
import { ActivityLog } from './activity-log.schema';

const MAX_PER_USER = 100;

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityLog.name)
    private readonly activityModel: Model<ActivityLog>,
  ) {}

  async record(userId: string, dto: RecordActivityDto) {
    const created = await this.activityModel.create({
      userId,
      path: dto.path.slice(0, 300),
      title: dto.title?.trim().slice(0, 200) ?? '',
    });

    const stale = await this.activityModel
      .find({ userId })
      .sort({ visitedAt: -1 })
      .skip(MAX_PER_USER)
      .select('_id');
    if (stale.length > 0) {
      await this.activityModel.deleteMany({
        _id: { $in: stale.map((item) => item._id) },
      });
    }

    return created;
  }

  listForUser(userId: string) {
    return this.activityModel
      .find({ userId })
      .sort({ visitedAt: -1 })
      .limit(MAX_PER_USER);
  }

  deleteForUser(userId: string) {
    return this.activityModel.deleteMany({ userId });
  }
}
