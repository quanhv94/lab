import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

@Schema({ timestamps: { createdAt: 'visitedAt', updatedAt: false } })
export class ActivityLog {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  path: string;

  @Prop({ default: '' })
  title: string;

  visitedAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ userId: 1, visitedAt: -1 });

ActivityLogSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { id: String(_id), ...rest };
  },
});
