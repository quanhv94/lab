import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { FilterQuery, isValidObjectId, Model } from 'mongoose';
import { ActivityLog } from '../activity/activity-log.schema';
import { ADMIN_USERNAME } from '../auth/admin.constants';
import { RefreshToken } from '../auth/refresh-token.schema';
import { DEFAULT_USER_ROLE } from '../common/roles';
import {
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
} from './dto/user.dto';
import { User, UserDocument } from './user.schema';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @InjectModel(ActivityLog.name)
    private readonly activityModel: Model<ActivityLog>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const username = dto.username.trim().toLowerCase();
    if (username === ADMIN_USERNAME) {
      throw new ConflictException('Username đã tồn tại');
    }
    if (await this.userModel.exists({ username })) {
      throw new ConflictException('Username đã tồn tại');
    }
    return this.userModel.create({
      username,
      passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      fullName: dto.fullName?.trim() ?? '',
      role: dto.role ?? DEFAULT_USER_ROLE,
      isActive: dto.isActive ?? true,
    });
  }

  async list({ q, role, page, limit }: ListUsersQueryDto) {
    const filter: FilterQuery<User> = {};
    if (q) {
      filter.$or = [
        { username: { $regex: escapeRegex(q), $options: 'i' } },
        { fullName: { $regex: escapeRegex(q), $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.userModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = isValidObjectId(id) ? await this.userModel.findById(id) : null;
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  findByUsernameWithPassword(username: string) {
    return this.userModel
      .findOne({ username: username.trim().toLowerCase() })
      .select('+passwordHash');
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);
    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    const saved = await user.save();
    if (dto.password || dto.isActive === false) {
      await this.refreshTokenModel.deleteMany({ userId: id });
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await Promise.all([
      user.deleteOne(),
      this.refreshTokenModel.deleteMany({ userId: id }),
      this.activityModel.deleteMany({ userId: id }),
    ]);
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
