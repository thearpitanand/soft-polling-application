import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { jwtModule } from 'src/jwt/modules.config';
import { redisModule } from 'src/redis/modules.config';
import { PollsController } from './polls.controller';
import { PollsRepository } from './polls.repository';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule, redisModule, jwtModule],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
})
export class PollsModule {}
