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

  @SubscribeMessage('test')
  async test() {
    throw new BadRequestException({ error: 'Invalid empty data :)' });
  }
}
