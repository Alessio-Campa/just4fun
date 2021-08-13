import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from "../../environments/environment";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {MatchmakingService} from "../services/matchmaking.service";
import * as http from "http";
import {SocketioService} from "../services/socketio.service";

@Component({
  selector: 'app-logged-home',
  templateUrl: './logged-home.component.html',
  styleUrls: ['./logged-home.component.css']
})
export class LoggedHomeComponent implements OnInit {

  socket = io(environment.serverUrl, { transports: ['websocket'] });
  user = this.userService;
  matchFound: boolean = false;
  opponent;

  constructor(public userService: UserService, public router: Router, public matchmakingService: MatchmakingService,
              public ios: SocketioService) { }

  matchmaking() {
    this.matchmakingService.ngOnInit();
    this.matchmakingService.match().subscribe((data) => {
      console.log("resonse: " + JSON.stringify(data));
      this.socket.on('broadcast', (message) => {
        console.log("New socket message: " + message.subject + "\n your opponent is " + message.player1)
        this.matchFound = true;
        this.userService.get_user_by_mail(message.player1).subscribe((data) =>{
          this.opponent = data.username;
        });
      })
    });
  }

  ngOnInit(): void {
    if (!this.userService.isLoggedIn) {
      this.router.navigate(['']);
      return;
    }
    //console.log(this.user)
    console.log("127.0.0.0 sweet logged 127.0.0.0")
  }

}
