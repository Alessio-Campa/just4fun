import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from "../../environments/environment";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {MatchmakingService} from "../services/matchmaking.service";
import {SocketioService} from "../services/socketio.service";

@Component({
  selector: 'app-logged-home',
  templateUrl: './logged-home.component.html',
  styleUrls: ['./logged-home.component.css']
})
export class LoggedHomeComponent implements OnInit {

  socket; // = io(environment.serverUrl, { transports: ['websocket'] });
  user = this.userService;
  matchFound: boolean = false;
  matchSearching: boolean = false;
  isConnectingToServer = false;
  player0;
  player1;
  timeElapsed = 0;
  private timer;

  constructor(public userService: UserService, public router: Router, public matchmakingService: MatchmakingService,
              public ios: SocketioService) { }

  ngOnInit(): void {
    /*
    this.ios.ngOnInit();
    this.ios.connect().subscribe((message)=>{
      if (message.subject == 'matchMakingFound') {
        this.matchSearching = false;
        this.matchFound = true;
        this.userService.get_user_by_mail(message.player0).subscribe(data => this.player0 = data.username);
        this.userService.get_user_by_mail(message.player1).subscribe(data => this.player1 = data.username);
        setTimeout(()=>{
          this.router.navigate(['match/' + message.matchID]);
        }, 1000);
      }
    });

     */

    this.socket = this.ios.getSocketIO();

    this.socket.on('matchMakingFound', (message) => {
      console.log('matchMakingFound');
      this.matchSearching = false;
      this.matchFound = true;
      this.player0 = message.player0; //Provide a value before fetch
      this.player1 = message.player1;
      this.userService.get_user_by_mail(message.player0).subscribe(data => this.player0 = data.username);
      this.userService.get_user_by_mail(message.player1).subscribe(data => this.player1 = data.username);
      setTimeout(()=>{
        this.router.navigate(['match/' + message.matchID]);
      }, 1000);
    })

    console.log("127.0.0.1 sweet logged 127.0.0.1")
  }

  // find a new random match
  matchmaking() {
    this.timeElapsed = 0;
    this.isConnectingToServer = true;
    this.matchmakingService.match().subscribe(()=>{}, ()=>{}, ()=>{
      this.isConnectingToServer = false;
      this.matchFound = false;
      this.matchSearching = true;
      this.timer = setInterval(()=>this.timeElapsed++, 1000);
    });
  }

  cancelMatchmaking() {
    clearInterval(this.timer)
    this.matchmakingService.cancelUserMatchmaking().subscribe(()=>{
      this.matchSearching = false;
    })
  }

}
