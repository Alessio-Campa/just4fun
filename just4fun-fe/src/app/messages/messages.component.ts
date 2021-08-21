import { Component, OnInit } from '@angular/core';
import {Chat, ChatService} from "../services/chat.service";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {SocketioService} from "../services/socketio.service";

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit { //rappresenta una singola chat

  constructor(private chatService: ChatService, private userService: UserService, private router: Router,
              private ios: SocketioService) {
    if (!this.userService.isLoggedIn || this.userService.email != this.router.url.split('/').pop())
      router.navigate(['/'])
  }

  MessageFetch() {
    // eseguirà l'operazione di fetching per una singola chat,
    // sia essa personale con un amico, o pubblica di un match

  }

  ngOnInit(): void {

  }

}
