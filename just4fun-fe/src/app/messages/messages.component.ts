import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Chat, ChatService} from "../services/chat.service";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {SocketioService} from "../services/socketio.service";
import {last} from "rxjs/operators";
import {on} from "socket.io-client/build/on";
import {event} from "jquery";

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnChanges { //rappresenta una singola chat

  @Input() chat: Chat = null;
  @Input() filter: string[] = null;
  userMail: string;
  chatTitle: string;
  socket;

  // if user is not logged in return to home
  constructor(private chatService: ChatService, public userService: UserService, private router: Router,
              private ios: SocketioService) {  }

  ngOnInit(): void {
    this.socket = this.ios.getSocketIO();
    this.userMail = this.userService.email;
    // set chat title to display
    if (this.chat)
    {
      if(this.chat.matchID !== null)
        this.chatTitle = 'Match chat'
      else
        this.chatTitle = this.getTitles(this.chat.members);
    }

    this.socket.on('newMessageReceived', (message)=>{
      console.log('start fetching');
      this.chat.fetchChat();
      console.log('fetch ended');
    });
  }

  getTitles(members: string[]): string
  {
    let others = members.filter((x) => x != this.userMail);
    return others.join(', ');
  }

  // activated when another chat is selected from chatsComponent
  ngOnChanges(changes: SimpleChanges){
    if(this.chat) {
      if (changes.chat.currentValue.matchID !== null)
        this.chatTitle = 'Match chat'
      else
        this.chatTitle = this.getTitles(changes.chat.currentValue.members);
    }
  }

  sendMessage(message){
    if (message.value !== '') {
      this.chat.sendMessage(message.value).subscribe();
      message.value = '';
    }
  }S
}
