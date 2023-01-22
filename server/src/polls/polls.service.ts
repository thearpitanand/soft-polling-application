import { Injectable, Logger } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { createPollID, createUserID } from '../utils/ids';
import { PollsRepository } from './polls.repository';

@Injectable()
export class PollsService {
  constructor(private readonly pollsRepository: PollsRepository) {}
  private readonly logger = new Logger(PollsService.name);

  async getPoll(pollID: string) {
    const poll = await this.pollsRepository.getPoll(pollID);
    return {
      poll,
    };
  }

  async create(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    this.logger.log(JSON.stringify(fields));

    const createdPoll = await this.pollsRepository.createPoll({
      ...fields,
      pollID,
      userID,
    });

    // Todo - create an accessToken based of pollID and userID

    return {
      poll: createdPoll,
      // accessToken,
    };
  }

  async join(fields: JoinPollFields) {
    const userID = createUserID();
    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with id: ${userID}`,
    );
    const joinedPoll = await this.pollsRepository.addParticipant({
      ...fields,
      userID,
    });

    return { poll: joinedPoll };
  }

  async rejoin(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining the poll with ID: ${fields.pollID} for user with id/name: ${fields.userID}/${fields.name}`,
    );
    const joinedPoll = await this.pollsRepository.addParticipant({
      ...fields,
    });

    return joinedPoll;
  }
}
