import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DEFAULT_USER_ROLE, Role } from '../common/roles';
import { UsersService } from '../users/users.service';
import { ADMIN_ID, ADMIN_USERNAME } from './admin.constants';
import { AuthRequest, JwtPayload } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Access token không hợp lệ');
    }

    if (payload.role === Role.Admin && payload.sub === ADMIN_ID) {
      req.user = {
        id: ADMIN_ID,
        username: ADMIN_USERNAME,
        fullName: 'Administrator',
        role: Role.Admin,
      };
      return true;
    }

    const user = await this.usersService
      .findById(payload.sub)
      .catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
      );
    }
    req.user = {
      id: user.id as string,
      username: user.username,
      fullName: user.fullName,
      role: user.role ?? DEFAULT_USER_ROLE,
    };
    return true;
  }
}
