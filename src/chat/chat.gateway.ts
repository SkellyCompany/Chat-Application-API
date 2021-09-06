import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import User from '../entities/user';

@WebSocketGateway(3000)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {
   
  }

  @SubscribeMessage('new_message')
  async saveMessage(@MessageBody() content: string, @ConnectedSocket() socket: Socket) {
    const user = this.chatService.getUserFromSocket(socket);
    const message = this.chatService.saveMessage(content, user);
    this.server.emit('new_message', message);
  }

  @SubscribeMessage('join')
  async connect(
    @MessageBody() user: User,
    @ConnectedSocket() socket: Socket,
  ) {
    const messages = this.chatService.connect(socket, user);
    socket.emit('get_all_messages', messages);
  }

  @SubscribeMessage('start_typing')
  async onTypingStart(@ConnectedSocket() socket: Socket) {
    const username = this.chatService.getUserFromSocket(socket).username;
    this.chatService.handleUserTyping(username);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
  
  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }
}
