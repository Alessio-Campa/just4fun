import { Component, OnInit } from '@angular/core';
import {Chat, ChatService} from "../services/chat.service";
import {UserService} from "../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
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
  isLoading = {chats: -1};
  friends: Set<string>;

  // return to home if url is '/messages' and user is not logged in
  constructor(private chatService: ChatService, private userService: UserService, private router: Router,
              private ios: SocketioService, private route: ActivatedRoute) {
    if (!this.userService.isLoggedIn && this.router.url.split('/').pop() == 'messages')
      router.navigate(['/'])
  }

  ngOnInit(): void {
    // get user mail
    this.userMail = this.userService.email;

    // get all user private chats (that are not relative to any match)
    this.chatService.getChatsByUser(this.userService.email).subscribe(data => {
      this.chats = data;
      this.initSelectedChat();
      this.isLoading.chats++;
    },()=>{}, ()=>{
      this.userService.get_user_by_mail(this.userMail).subscribe(data => {
        this.friends = new Set(data.friends);
        this.chats.forEach(c => {
          c.members.forEach(m => {
            this.friends.delete(m);
          })
        })
      })
    })

  }

  // selection of a new chat to show. Updates the app-messages binding
  onChatSelect(i): void {
    this.selectedChat = this.chats[i];
  }

  // show one open chat on page load, based on url
  initSelectedChat(): void {
    if(this.chats.length > 0)
      this.selectedChat = this.chats[0];

    this.route.queryParams.subscribe(data => {
      let c;
      let id = data.chatID
      if (id) {
        c = this.chats.find(e => e._id === id);
        if (c !== undefined)
          this.selectedChat = c
      }
      else
        this.selectedChat = this.chats[0];
    })
  }

  createChat(friend): void{
    this.chatService.newChat([this.userMail, friend]).subscribe( data=>{
      this.friends.delete(friend)
      this.chats.push(data.object)
    })
  }

}
