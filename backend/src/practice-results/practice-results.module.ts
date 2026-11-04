import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AdminPracticeResultsController } from './admin-practice-results.controller';
import { PracticeResult, PracticeResultSchema } from './practice-result.schema';
import { PracticeResultsController } from './practice-results.controller';
import { PracticeResultsService } from './practice-results.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: PracticeResult.name, schema: PracticeResultSchema },
    ]),
  ],
  controllers: [PracticeResultsController, AdminPracticeResultsController],
  providers: [PracticeResultsService],
  exports: [PracticeResultsService, MongooseModule],
})
export class PracticeResultsModule {}
