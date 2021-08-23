import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Chat, ChatService} from "../services/chat.service";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {SocketioService} from "../services/socketio.service";

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnChanges { //rappresenta una singola chat

  @Input() chat: Chat = null;
  userMail;
  chatTitle;

  constructor(private chatService: ChatService, private userService: UserService, private router: Router,
              private ios: SocketioService) {
    let urlArray = router.url.split('/')
    if (!this.userService.isLoggedIn && urlArray[urlArray.length - 2] == 'messages')
      router.navigate(['/']);
  }

  MessageFetch() {
    // eseguirà l'operazione di fetching per una singola chat,
    // sia essa personale con un amico, o pubblica di un match

  }

  ngOnInit(): void {
    this.userMail = this.userService.email;
  }

  ngOnChanges(changes: SimpleChanges){
    console.log(changes)
    if (changes.chat.currentValue.matchID !== null)
      this.chatTitle = 'Match chat'
    else
      this.chatTitle = changes.chat.currentValue.members[0] == this.userMail ? changes.chat.currentValue.members[1] : changes.chat.currentValue.members[0]

  }

  sendMessage(message){
    this.chatService.sendMessage(this.userMail, message.value, this.chat._id).subscribe()
    message.value = '';
  }

}
