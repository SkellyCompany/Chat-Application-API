import { Injectable } from '@nestjs/common';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Socket } from 'socket.io';
import Message from '../entities/message';
import User from '../entities/user';

@Injectable()
export class ChatService {
  private typingUsers: BehaviorSubject<{ username: string, timeoutId: any}[]> = new BehaviorSubject([]);
  private users: User[];
  private messages: Message[];

  public get typingUsers$(): Observable<string[]> {
    return this.typingUsers.pipe(map(users => users.map(u => u.username)));
  }

  constructor() {
    this.users = [];
  }

  saveMessage(content: string, author: User) {
    const message: Message = { content, author: author.username, time: new Date() };
    this.messages.push(message);
    return message;
  }

  connect(socket: Socket, user: User) {
    const socketId = socket.id;

    user.socketId = socketId;
    this.users.push(user);

    return this.messages;
  }

  getUserFromSocket(socket: Socket): User {
    return this.users.find(user => user.socketId === socket.id);
  }

  handleUserTyping(username: string) {
    const existingUser = this.typingUsers.value.find(u => u.username === username);
    const timeoutId = setTimeout(() => this.typingUsers.next(this.typingUsers.value.filter(u => u.username !== username)), 2000);
    if (!existingUser) {
      this.typingUsers.next([...this.typingUsers.value ,{username, timeoutId }]);
    } else {
      clearTimeout(existingUser.timeoutId);
      existingUser.timeoutId = timeoutId;
    }
  }
}
