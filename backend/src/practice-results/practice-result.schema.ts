import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PracticeResultDocument = HydratedDocument<PracticeResult>;

@Schema({ _id: false })
export class PracticeAnswerItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  kind: string;

  @Prop({ default: '' })
  userAnswer: string;

  @Prop({ default: '' })
  correctAnswer: string;

  @Prop({ required: true })
  correct: boolean;

  @Prop({ required: true })
  points: number;

  @Prop({ required: true })
  earned: number;
}

const PracticeAnswerItemSchema =
  SchemaFactory.createForClass(PracticeAnswerItem);

@Schema({ timestamps: { createdAt: 'submittedAt', updatedAt: false } })
export class PracticeResult {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  examNum: number;

  @Prop({ required: true })
  examTitle: string;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  maxScore: number;

  @Prop({ type: [PracticeAnswerItemSchema], default: [] })
  items: PracticeAnswerItem[];

  submittedAt: Date;
}

export const PracticeResultSchema =
  SchemaFactory.createForClass(PracticeResult);

PracticeResultSchema.index({ userId: 1, submittedAt: -1 });
PracticeResultSchema.index({ userId: 1, examNum: 1 }, { unique: true });

PracticeResultSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { id: String(_id), ...rest };
  },
});
