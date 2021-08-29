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

  user = this.userService;
  matchFound: boolean = false;
  matchSearching: boolean = false;
  player0;
  player1;
  timeElapsed = 0;

  constructor(public userService: UserService, public router: Router, public matchmakingService: MatchmakingService,
              public ios: SocketioService) { }

  ngOnInit(): void {
    // connect to socket io service
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
  }

  // find a new random match
  matchmaking() {
    this.matchFound = false;
    this.matchSearching = true;
    this.matchmakingService.ngOnInit();
    this.matchmakingService.match().subscribe();
    setInterval(()=>this.timeElapsed++, 1000);
  }

  // TODO: cancel matchmaking

}
