import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RecordActivityDto {
  @IsString()
  @MaxLength(300)
  @Matches(/^\//, { message: 'Đường dẫn không hợp lệ' })
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
