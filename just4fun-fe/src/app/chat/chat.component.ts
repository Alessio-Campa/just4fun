import { Component, OnInit } from '@angular/core';
import {Chat, ChatService} from "../services/chat.service";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  chats: Chat[];
  userMail: string;
  selectedChat: Chat = null;

  constructor(private chatService: ChatService, private userService: UserService, private router: Router) {
    if (!this.userService.isLoggedIn || this.userService.email != this.router.url.split('/').pop())
      router.navigate(['/'])
  }

  ngOnInit(): void {
    this.userMail = this.router.url.split('/').pop()
    this.chatService.getChatsByUser(this.userService.email).subscribe(data => {
      this.chats = data;
      if (this.chats.length > 0)
        this.selectedChat = this.chats[0]
      console.log(data)
    })
  }

}
