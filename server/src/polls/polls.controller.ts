import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ControllerAuthGuard } from 'src/guards/controller-auth.guard';
import { CreatePollDto, JoinPollDto } from './dtos';
import { PollsService } from './polls.service';
import { RequestWithAuth } from './types';

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

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: RequestWithAuth) {
    const { name, pollID, userID } = request;
    const result = await this.pollsService.rejoin({
      name,
      pollID,
      userID,
    });
    return result;
  }
}
