import { customAlphabet, nanoid } from 'nanoid';

const createPollID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

const createUserID = () => nanoid();

const createNominationID = () => nanoid(8);

export { createNominationID, createPollID, createUserID };
