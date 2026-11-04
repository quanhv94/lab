import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePracticeResultDto } from './dto/practice-result.dto';
import { PracticeResult } from './practice-result.schema';

const MAX_PER_USER = 200;

@Injectable()
export class PracticeResultsService {
  constructor(
    @InjectModel(PracticeResult.name)
    private readonly resultModel: Model<PracticeResult>,
  ) {}

  async create(userId: string, dto: CreatePracticeResultDto) {
    const existing = await this.resultModel
      .findOne({ userId, examNum: dto.examNum })
      .select('_id');
    if (existing) {
      throw new ConflictException('Bạn đã nộp đề này rồi (chỉ được làm 1 lần)');
    }

    if (dto.examNum > 1) {
      const prev = await this.resultModel
        .findOne({ userId, examNum: dto.examNum - 1 })
        .select('_id');
      if (!prev) {
        throw new ForbiddenException(
          `Cần hoàn thành Đề số ${dto.examNum - 1} trước`,
        );
      }
    }

    const score = Math.min(dto.score, dto.maxScore);
    const created = await this.resultModel.create({
      userId,
      examNum: dto.examNum,
      examTitle: dto.examTitle.trim().slice(0, 120),
      score,
      maxScore: dto.maxScore,
      items: dto.items.map((item) => ({
        name: item.name.slice(0, 120),
        kind: item.kind.slice(0, 40),
        userAnswer: item.userAnswer.slice(0, 500),
        correctAnswer: item.correctAnswer.slice(0, 500),
        correct: item.correct,
        points: item.points,
        earned: item.earned,
      })),
    });

    const stale = await this.resultModel
      .find({ userId })
      .sort({ submittedAt: -1 })
      .skip(MAX_PER_USER)
      .select('_id');
    if (stale.length > 0) {
      await this.resultModel.deleteMany({
        _id: { $in: stale.map((item) => item._id) },
      });
    }

    return created;
  }

  listForUser(userId: string) {
    return this.resultModel
      .find({ userId })
      .select('-items')
      .sort({ examNum: 1, submittedAt: -1 })
      .limit(MAX_PER_USER);
  }

  async getByExam(userId: string, examNum: number) {
    const result = await this.resultModel.findOne({ userId, examNum });
    if (!result) throw new NotFoundException('Chưa có kết quả cho đề này');
    return result;
  }

  async getForUser(userId: string, id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Không tìm thấy kết quả');
    }
    const result = await this.resultModel.findOne({ _id: id, userId });
    if (!result) throw new NotFoundException('Không tìm thấy kết quả');
    return result;
  }

  deleteForUser(userId: string) {
    return this.resultModel.deleteMany({ userId });
  }
}
