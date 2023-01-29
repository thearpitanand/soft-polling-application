import {
  BadRequestException,
  Logger,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { SocketEvents } from 'src/enums/socket-event.enum';
import { WsCatchAllFilter } from 'src/exceptions/ws-catch-all-filter';
import { WsBadRequestException } from 'src/exceptions/ws-exceptions';
import { PollsService } from './polls.service';
import { SocketWithAuth } from './types';

@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  @WebSocketServer() io: Namespace;

  // Gateway initialized (provide in module and instantiated)
  afterInit(): void {
    this.logger.log(`Websoket Gateway initialized`);
  }

  async handleConnection(client: SocketWithAuth) {
    const socket = this.io.sockets;

    this.logger.debug(
      `Socket connected with userID: ${client.userID}, pollID: ${client.pollID} and name: "${client.name}"`,
    );

    this.logger.log(`Web Socket Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected web sockets: ${socket.size}`);

    const roomName = client.pollID;
    await client.join(roomName);
    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userID: ${client.userID} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit(SocketEvents.POLL_UPDATED, updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const socket = this.io.sockets;

    const { pollID, userID } = client;

    const updatedPoll = await this.pollsService.removeParticipant(
      pollID,
      userID,
    );

    const roomName = client.pollID;
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.log(`Web Socket Client with id: ${client.id} disconnected!`);
    this.logger.debug(`Number of connected web sockets: ${socket.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );

    if (updatedPoll) {
      this.io.to(pollID).emit(SocketEvents.POLL_UPDATED, updatedPoll);
    }
  }

  @SubscribeMessage('test')
  async test() {
    throw new BadRequestException({ error: 'Invalid empty data :)' });
  }
}
