import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { PollsService } from './polls.service';
import { SocketWithAuth } from './types';

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

  handleConnection(client: SocketWithAuth) {
    const socket = this.io.sockets;

    this.logger.debug(
      `Socket connected with userID: ${client.userID}, pollID: ${client.pollID} and name: "${client.name}"`,
    );

    this.logger.log(`Web Socket Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected web sockets: ${socket.size}`);

    this.io.emit('hello', `Hello from ${client.id}`);
  }

  handleDisconnect(client: SocketWithAuth) {
    const socket = this.io.sockets;

    this.logger.log(`Web Socket Client with id: ${client.id} disconnected!`);
    this.logger.debug(`Number of connected web sockets: ${socket.size}`);

    this.io.emit('goodbye', `goodbye from ${client.id}`);
  }
}
