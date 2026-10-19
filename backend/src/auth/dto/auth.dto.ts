import { IsNotEmpty, IsString } from 'class-validator';

export { RegisterDto } from '../../users/dto/user.dto';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập username' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng gửi refresh token' })
  refreshToken: string;
}
