import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/auth.types';
import { CreatePracticeResultDto } from './dto/practice-result.dto';
import { PracticeResultsService } from './practice-results.service';

@Controller('practice-results')
@UseGuards(JwtAuthGuard)
export class PracticeResultsController {
  constructor(private readonly resultsService: PracticeResultsService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreatePracticeResultDto) {
    return this.resultsService.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.resultsService.listForUser(req.user.id);
  }

  @Get('exam/:examNum')
  getByExam(
    @Req() req: AuthRequest,
    @Param('examNum', ParseIntPipe) examNum: number,
  ) {
    return this.resultsService.getByExam(req.user.id, examNum);
  }

  @Get(':id')
  getOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.resultsService.getForUser(req.user.id, id);
  }
}
