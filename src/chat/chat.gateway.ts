import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import User from '../entities/user';
const options = {
  cors: {
    origin: 'http://localhost:4200',
    credentials: true
  }
}
@WebSocketGateway(options)
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: any) {
    this.chatService.typingUsers$.subscribe(users => this.server.emit('typing_changed', users));
  }

  @SubscribeMessage('all_users')
  async allUsers(
    @ConnectedSocket() socket: Socket,
  ) {
    const users = this.chatService.getAllUsers();
    this.server.emit('get_all_users', users);
  }

  @SubscribeMessage('new_message')
  async saveMessage(
    @MessageBody() content: string,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('Message recieved', content);
    const user = this.chatService.getUserFromSocket(socket.id);
    const message = this.chatService.saveMessage(content, user);
    this.server.emit('new_message', message);
  }

  @SubscribeMessage('join')
  async connect(@MessageBody() username: string, @ConnectedSocket() socket: Socket) {

    console.log('Joined', username);
    const user = 
      {socketId: socket.id, username: username, active: true} as User; 
      //Essencially. We cant push a user object trough the backend since we dont know the socketID.
      //Making an empty user seems to be a stupid decision.
      // Instead i am creating a user object here and passing it to the service.
    const messages = this.chatService.connect(user);
    socket.emit('authenticated', user); // I crate an authentication as well. Its not necessary but I think its a cool thing to have in order to pretend we are actually authenticating users.
    socket.emit('get_all_messages', messages);

    const users = this.chatService.getAllUsers();
    this.server.emit('get_all_users', users);

    const typingUsers = this.chatService.getAllTypingUsers();
    this.server.emit('get_all_typing', typingUsers);
  }

  @SubscribeMessage('start_typing')
  async onTypingStart(@MessageBody() user: User, @ConnectedSocket() socket: Socket) {
    console.log('StartedTyping', user);
    const username = this.chatService.getUserFromSocket(socket.id).username;
    this.chatService.handleUserTyping(username);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.chatService.handleUserDisconnect(client.id);
    const users = this.chatService.getAllUsers();
    this.server.emit('get_all_users', users);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }
}
