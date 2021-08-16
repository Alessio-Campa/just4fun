import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from "../../environments/environment";
import { UserService } from "../services/user.service";
import { MatchService } from "../services/match.service";
import { Board } from "./boardPreview";
import { Match } from "../../../../just4fun-be/models/Match";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  isLogged;
  leaderboard;
  randomMatches: Match[];
  ngForDone = false;

  constructor(private us: UserService, private ms: MatchService) { }
  socket = io(environment.serverUrl, { transports: ['websocket'] });

  ngOnInit(): void {
    this.isLogged = this.us.isLoggedIn;
    this.us.leaderboard.subscribe(data => {
      this.leaderboard = data;
    })

    this.ms.randomLiveMatches.subscribe(
      data => {
        this.randomMatches = data;
        },
      ()=>{},
      ()=>{
        let i = 0;
        this.randomMatches.forEach(e => {
          this.us.get_user_by_mail(e.player0).subscribe(data => e.player0 = data.username);
          this.us.get_user_by_mail(e.player1).subscribe(data => e.player1 = data.username);
         })
      });

    console.log("127.0.0.0 sweet 127.0.0.0");
    this.socket.on('broadcast', ()=>{
      console.log("Roger");
    })

  }

  public ngForCallback(isReady){
    if (isReady && !this.ngForDone) {
      this.ngForDone = true
      let i = 0
      this.randomMatches.forEach(e => {
        new Board('#mini-board-' + i, e.board);
        i++;
      })
    }
  }



}
