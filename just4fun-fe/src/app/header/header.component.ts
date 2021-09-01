import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service'
import {SocketioService} from "../services/socketio.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  socket;
  hasNotifications = false;

  constructor(public userService: UserService, private ios: SocketioService) { }

  ngOnInit(): void {
    this.socket = this.ios.getSocketIO();
    this.socket.on('welcome', () => {
      this.socket.emit('join', this.userService.email);
    });
    this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
      if (data.hasNewNotifications) {
        this.hasNotifications = true;
      }
    });
    this.socket.on('newNotification', () => {
      this.hasNotifications = true;
    });
    this.userService.readNotifications(false).subscribe(data=>{
      if (data !== null){
        this.hasNotifications = false
      }
    });
  }
}
