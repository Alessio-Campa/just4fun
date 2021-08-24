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

  userMail: string;
  chats: Chat[];
  selectedChat: Chat = null;
  friendRequests;
  isLoading = {chats: -1};
  private friends;

  constructor(private chatService: ChatService, private userService: UserService, private router: Router,
              private ios: SocketioService) {
    if (!this.userService.isLoggedIn && this.router.url.split('/').pop() == 'messages')
      router.navigate(['/'])
  }

  ngOnInit(): void {

    // TODO: da eliminare e cambiare URL
    // get user mail
    this.userMail = this.userService.email;

    // get all user private chats (that are not relative to any match)
    this.chatService.getChatsByUser(this.userService.email).subscribe(data => {
      this.chats = data;
      if(this.chats.length > 0)
        this.selectedChat = this.chats[0];
      this.isLoading.chats++;
    })

    // get all friend requests and display them as chats
    this.userService.get_user_by_mail(this.userMail).subscribe(data => {
      this.friendRequests = data.friendRequests;
      this.friends = data.friends;
    })

  }

  // selection of a new chat to show. Updates the app-messages binding
  onChatSelect(i): void {
    this.selectedChat = this.chats[i];
  }


}
