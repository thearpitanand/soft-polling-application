import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { SocketEvents } from 'src/enums/socket-event.enum';
import { SocketWithAuth } from 'src/polls/types';
import {
  WsBadRequestException,
  WsTypeException,
  WsUnknownException,
} from './ws-exceptions';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (exception instanceof BadRequestException) {
      const exceptionData = exception.getResponse();

      const wsException = new WsBadRequestException(
        exceptionData['message'] ?? exceptionData ?? 'Bad Request',
      );
      socket.emit(SocketEvents.EXCEPTION, wsException.getError());
      return;
    }

    if (exception instanceof WsTypeException) {
      socket.emit(SocketEvents.EXCEPTION, exception.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit(SocketEvents.EXCEPTION, wsException.getError());
  }
}
