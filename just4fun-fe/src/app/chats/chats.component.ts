import { Component, OnInit } from '@angular/core';
import {Chat, ChatService} from "../services/chat.service";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {SocketioService} from "../services/socketio.service";

@Component({
  selector: 'app-chat',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.css']
})
export class ChatsComponent implements OnInit {

  chats: Chat[];
  userMail: string;
  selectedChat: Chat = null;

  constructor(private chatService: ChatService, private userService: UserService, private router: Router,
              private ios: SocketioService) {
    if (!this.userService.isLoggedIn || this.userService.email != this.router.url.split('/').pop())
      router.navigate(['/'])
  }

  MessageFetch() {
    // dovrà lanciare l'operazione di fetching per ogni singola chat,
    // ottimizzabile senza rivelare info sensibili come il mittente?

  }

  ngOnInit(): void {
    this.ios.connect().subscribe((message)=>{
      if (message.subject === 'newMessageRecived') {
        // TODO: fetcha i messaggi dal server, fa mario
      }
    });
    this.userMail = this.router.url.split('/').pop()
    this.chatService.getChatsByUser(this.userService.email).subscribe(data => {
      console.log(data)
      this.chats = data;
      if (this.chats.length > 0)
        this.selectedChat = this.chats[0]
    })
  }

  onChatSelect(i): void {
    this.selectedChat = this.chats[i];
    console.log(this.selectedChat)
  }

}
