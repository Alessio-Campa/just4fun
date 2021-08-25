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

  messageFetch() {
    this.chatService.fetchChat(this.chat._id).subscribe((data) =>{
      console.log(data);
      this.chat.messages = data.messages;
      console.log(data.messages);
    });
  }

  ngOnInit(): void {
    this.userMail = this.userService.email;
    console.log(this.chat.matchID);
    if (this.chat.matchID !== null) {
      this.chatTitle = 'Match chat'
    }
    else {
      this.ios.connect().subscribe((message)=>{
        if (message.subject === 'newMessageReceived') {
          console.log('start fetching');
          this.messageFetch();
          console.log('fetch ended');
        }
      });
      this.chatTitle = this.chat.members[0] == this.userMail ? this.chat.members[1] : this.chat.members[0]
    }
  }

  ngOnChanges(changes: SimpleChanges){
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
