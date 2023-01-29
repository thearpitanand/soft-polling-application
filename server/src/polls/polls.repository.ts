import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import { AddNominationData, AddParticipantData, CreatePollData } from './types';
import { Poll } from 'shared';

@Injectable()
export class PollsRepository {
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }

  generateKey(key: string) {
    return `polls:${key}`;
  }

  async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      nominations: {},
      adminID: userID,
      hasStarted: false,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)}  with ttl ${
        this.ttl
      }`,
    );

    const key = this.generateKey(pollID);

    try {
      this.logger.log(`JSON.SET ${key}.${JSON.stringify(initialPoll)}`);
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();

      // todo- set expire

      return initialPoll;
    } catch (error) {
      const errorMessage = `Failed to add poll ${JSON.stringify(initialPoll)}`;

      this.logger.error(`${errorMessage}\n${error}`);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll ${pollID}`);
    const key = this.generateKey(pollID);

    try {
      const currentPoll = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );
      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The Poll  has been already started');
      // }

      return JSON.parse(currentPoll);
    } catch (error) {
      const errorMessage = `Failed to get the pollID ${pollID}`;
      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = this.generateKey(pollID);
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      const poll: Poll = await this.getPoll(pollID);

      this.logger.debug(
        `Current participants for the poll id: ${pollID}`,
        poll.participants,
      );

      return poll;
    } catch (error) {
      const errorMessage = `Failed to add the participant with userID/name: ${userID}/${name} to pollID: ${pollID}`;

      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async removeParticipant(pollID: string, userID: string): Promise<Poll> {
    this.logger.log(`Removing userID: ${userID} from poll: ${pollID}`);

    const key = this.generateKey(pollID);
    const participant = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participant);

      return this.getPoll(pollID);
    } catch (error) {
      this.logger.error(
        `failed to remove userID: ${userID} from poll: ${pollID}`,
      );

      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async addNomination({
    pollID,
    nomination,
    nominationID,
  }: AddNominationData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a nomination with nominationID/nomination: ${nominationID}/${nomination} to pollID: ${pollID}`,
    );

    const key = this.generateKey(pollID);
    const nominationPath = `.nominations.${nominationID}`;
    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getPoll(pollID);
    } catch (error) {
      const errorMessage = `Failed to add the nominationID/nomination: ${nominationID}/${nomination} to the pollID: ${pollID}`;

      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    this.logger.log(
      `Attempting to remove a nomination with nominationID${nominationID} from pollID: ${pollID}`,
    );

    const key = this.generateKey(pollID);
    const nominationPath = `.nominations.${nominationID}`;
    try {
      await this.redisClient.send_command('JSON.DEL', key, nominationPath);

      return this.getPoll(pollID);
    } catch (error) {
      const errorMessage = `Failed to remove the nominationID: ${nominationID} from the pollID: ${pollID}`;

      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
