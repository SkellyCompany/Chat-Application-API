import { Injectable } from '@nestjs/common';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Socket } from 'socket.io';
import Message from '../entities/message';
import User from '../entities/user';

@Injectable()
export class ChatService {
  private typingUsers: BehaviorSubject<{ username: string; timeoutId: any }[]> =
    new BehaviorSubject([]);
  private users: User[];
  private messages: Message[];

  public get typingUsers$(): Observable<string[]> {
    return this.typingUsers.pipe(map((users) => users.map((u) => u.username)));
  }

  constructor() {
    this.users = [];
    this.messages = [];
    this.messages.push({
      content: 'Welcome To Very Cool app',
      author: 'Server',
      time: new Date(),
    });
    this.messages.push({
      content: 'Write a message in the field to talk to other people',
      author: 'Server',
      time: new Date(),
    });
  }

  saveMessage(content: string, author: User) {
    const message: Message = {
      content,
      author: author.username,
      time: new Date(),
    };
    this.messages.push(message);
    return message;
  }
  getAllUsers(){
    return this.users;
  }

  connect(user: User) {
    this.users.push(user);

    return this.messages;
  }

  handleUserDisconnect(socketId: string){
    const user = this.getUserFromSocket(socketId);
    let index = this.users.findIndex(d => d.socketId === socketId); //find index in your array
    this.users.splice(index, 1);//remove element from array
  }

  getUserFromSocket(socketId: string): User {
    return this.users.find((user) => user.socketId === socketId);
  }

  handleUserTyping(username: string) {
    const existingUser = this.typingUsers.value.find(
      (u) => u.username === username,
    );
    const timeoutId = setTimeout(
      () =>
        this.typingUsers.next(
          this.typingUsers.value.filter((u) => u.username !== username),
        ),
      2000,
    );
    if (!existingUser) {
      this.typingUsers.next([
        ...this.typingUsers.value,
        { username, timeoutId },
      ]);
    } else {
      clearTimeout(existingUser.timeoutId);
      existingUser.timeoutId = timeoutId;
    }
  }
}
