import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { DEFAULT_USER_ROLE, Role } from '../common/roles';
import { UsersService } from '../users/users.service';
import { ADMIN_ID, ADMIN_PASSWORD, ADMIN_USERNAME } from './admin.constants';
import { AuthUser, JwtPayload } from './auth.types';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { RefreshToken } from './refresh-token.schema';

@Injectable()
export class AuthService {
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {
    this.accessExpiresIn = this.config.get('JWT_EXPIRES_IN', '15m');
    this.refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    this.refreshSecret = this.config.get(
      'JWT_REFRESH_SECRET',
      this.config.get('JWT_SECRET', 'lab-dev-secret-change-me') + '-refresh',
    );
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      ...dto,
      role: DEFAULT_USER_ROLE,
      isActive: true,
    });
    return this.issueTokens({
      id: user.id as string,
      username: user.username,
      fullName: user.fullName,
      role: user.role ?? DEFAULT_USER_ROLE,
    });
  }

  async login({ username, password }: LoginDto) {
    if (username.trim().toLowerCase() === ADMIN_USERNAME) {
      if (password !== ADMIN_PASSWORD) {
        throw new UnauthorizedException('Sai username hoặc mật khẩu');
      }
      return this.issueTokens({
        id: ADMIN_ID,
        username: ADMIN_USERNAME,
        fullName: 'Administrator',
        role: Role.Admin,
      });
    }

    const user = await this.usersService.findByUsernameWithPassword(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Sai username hoặc mật khẩu');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }
    return this.issueTokens({
      id: user.id as string,
      username: user.username,
      fullName: user.fullName,
      role: user.role ?? DEFAULT_USER_ROLE,
    });
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenModel.findOne({
      userId: payload.sub,
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!stored) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    await stored.deleteOne();
    const user = await this.resolveUser(payload);
    return this.issueTokens(user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    await this.refreshTokenModel.deleteOne({
      tokenHash: hashToken(refreshToken),
    });
  }

  async revokeAllForUser(userId: string) {
    await this.refreshTokenModel.deleteMany({ userId });
  }

  private async issueTokens(user: AuthUser) {
    const base = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(
      { ...base, type: 'access' } satisfies JwtPayload,
      {
        expiresIn: this.accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { ...base, type: 'refresh' } satisfies JwtPayload,
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    await this.refreshTokenModel.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationMs(this.refreshExpiresIn)),
    });

    return { accessToken, refreshToken, user };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret,
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }
      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  private async resolveUser(payload: JwtPayload): Promise<AuthUser> {
    if (payload.role === Role.Admin && payload.sub === ADMIN_ID) {
      return {
        id: ADMIN_ID,
        username: ADMIN_USERNAME,
        fullName: 'Administrator',
        role: Role.Admin,
      };
    }
    const user = await this.usersService
      .findById(payload.sub)
      .catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
      );
    }
    return {
      id: user.id as string,
      username: user.username,
      fullName: user.fullName,
      role: user.role ?? DEFAULT_USER_ROLE,
    };
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/** Parse durations like 15m, 7d, 3600s into milliseconds. */
function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * multipliers[unit];
}
