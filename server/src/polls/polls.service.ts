import { Injectable } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { createPollID, createUserID } from '../utils/ids';

@Injectable()
export class PollsService {
  async create(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    return {
      ...fields,
      pollID,
      userID,
    };
  }
  async join(fields: JoinPollFields) {
    const userID = createUserID();
    return { ...fields, userID };
  }
  async rejoin(fields: RejoinPollFields) {
    return fields;
  }
}
