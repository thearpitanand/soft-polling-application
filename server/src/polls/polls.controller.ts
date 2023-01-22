import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './dtos';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private pollsService: PollsService) {}
  private readonly logger = new Logger(PollsController.name);

  @Get(':id')
  async getPollByID(@Param('id') id: string) {
    const result = await this.pollsService.getPoll(id);
    return result;
  }
  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    this.logger.log(JSON.stringify(createPollDto));
    const result = await this.pollsService.create(createPollDto);
    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    const result = await this.pollsService.join(joinPollDto);
    return result;
  }

  @Post('/rejoin')
  async rejoin() {
    const result = await this.pollsService.rejoin({
      name: 'FROM TOKEN',
      pollID: 'from token',
      userID: 'from token',
    });
    return result;
  }
}
