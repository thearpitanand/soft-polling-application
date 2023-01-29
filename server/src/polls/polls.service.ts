import { Injectable, Logger } from '@nestjs/common';
import {
  AddParticipantFields,
  CreatePollFields,
  JoinPollFields,
  RejoinPollFields,
} from './types';
import { createPollID, createUserID } from '../utils/ids';
import { PollsRepository } from './polls.repository';
import { JwtService } from '@nestjs/jwt';
import { Poll } from 'shared';

@Injectable()
export class PollsService {
  constructor(
    private readonly pollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}
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

    this.logger.debug(
      `Creating token string for pollID: ${createdPoll.id} and userID: ${userID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: createdPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );
    return {
      poll: createdPoll,
      accessToken: signedString,
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

    this.logger.debug(
      `Creating signed JWT token for pollID: ${fields.pollID} for user with id: ${userID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: joinedPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      poll: joinedPoll,
      accessToken: signedString,
    };
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

  async addParticipant(addParticipant: AddParticipantFields): Promise<Poll> {
    return this.pollsRepository.addParticipant(addParticipant);
  }

  async removeParticipant(
    pollID: string,
    userID: string,
  ): Promise<Poll | void> {
    const poll = await this.pollsRepository.getPoll(pollID);
    if (!poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant(
        pollID,
        userID,
      );
      return updatedPoll;
    }
  }
}
