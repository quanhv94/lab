import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { Role } from '../common/roles';
import { PracticeResultsService } from './practice-results.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminPracticeResultsController {
  constructor(private readonly resultsService: PracticeResultsService) {}

  @Get(':id/practice-results')
  list(@Param('id') id: string) {
    return this.resultsService.listForUser(id);
  }

  @Get(':id/practice-results/:resultId')
  getOne(@Param('id') id: string, @Param('resultId') resultId: string) {
    return this.resultsService.getForUser(id, resultId);
  }
}
