import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../common/base.schema';
import { DEFAULT_USER_ROLE, USER_ROLES, type UserRole } from '../common/roles';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ default: '' })
  fullName: string;

  @Prop({
    type: String,
    enum: USER_ROLES,
    default: DEFAULT_USER_ROLE,
  })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    delete (rest as Partial<User>).passwordHash;
    if (!rest.role) rest.role = DEFAULT_USER_ROLE;
    return { id: String(_id), ...rest };
  },
});
