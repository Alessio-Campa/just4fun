import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from "../../environments/environment";
import { UserService } from "../services/user.service";
import { Match, MatchService } from "../services/match.service";
import { Board } from "../../assets/js/board";
import {data} from "jquery";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  isLogged;
  leaderboard;
  randomMatches: Match[];
  userNotFoundError = false;
  ngForDone = false;

  constructor(private userService: UserService, private ms: MatchService, private router: Router) { }
  //socket = io(environment.serverUrl, { transports: ['websocket'] });

  ngOnInit(): void {
    this.isLogged = this.userService.isLoggedIn;
    this.userService.leaderboard.subscribe(data => {
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
          this.userService.get_user_by_mail(e.player0).subscribe(data => e.player0 = data.username);
          this.userService.get_user_by_mail(e.player1).subscribe(data => e.player1 = data.username);
         })
      });

    console.log("127.0.0.0 sweet 127.0.0.0");
    /*
    this.socket.on('broadcast', ()=>{
      console.log("Roger");
    })

     */

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

  searchUser(email){
    this.userService.getUserByUsername(email).subscribe(data => {
      if (data.length === 0)
        this.userNotFoundError = true;
      else
        this.router.navigate([`/user/${data[0].email}`])
    });
  }



}
