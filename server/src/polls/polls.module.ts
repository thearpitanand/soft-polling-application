import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisModule } from 'src/config/modules.config';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule, redisModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
