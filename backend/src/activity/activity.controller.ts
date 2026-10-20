import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import type { AuthRequest } from '../auth/auth.types';
import { Role } from '../common/roles';
import { ActivityService } from './activity.service';
import { RecordActivityDto } from './dto/record-activity.dto';

@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('activity')
  @UseGuards(JwtAuthGuard)
  record(@Req() req: AuthRequest, @Body() dto: RecordActivityDto) {
    return this.activityService.record(req.user.id, dto);
  }

  @Get('admin/users/:id/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  list(@Param('id') id: string) {
    return this.activityService.listForUser(id);
  }
}
