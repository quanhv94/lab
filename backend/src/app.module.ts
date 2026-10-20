import { Controller, Get, Header, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Controller('health')
class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  check() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error(
            'MONGODB_URI is required. On Render, set it to a MongoDB Atlas connection string.',
          );
        }
        return { uri };
      },
    }),
    UsersModule,
    AuthModule,
    ActivityModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
