import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PracticeAnswerItemDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(40)
  kind: string;

  @IsString()
  @MaxLength(500)
  userAnswer: string;

  @IsString()
  @MaxLength(500)
  correctAnswer: string;

  @IsBoolean()
  correct: boolean;

  @IsNumber()
  @Min(0)
  @Max(20)
  points: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  earned: number;
}

export class CreatePracticeResultDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  examNum: number;

  @IsString()
  @MaxLength(120)
  examTitle: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore: number;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PracticeAnswerItemDto)
  items: PracticeAnswerItemDto[];
}
