import { Component, OnInit } from '@angular/core';
import {Board, PlayableBoard} from "../../assets/js/board";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { SocketioService } from "../services/socketio.service";
import { Match, MatchService } from "../services/match.service";
import {skipUntil} from "rxjs/operators";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  match: Match;
  board;
  username0;
  username1;
  ableToViewMessages: boolean = false;

  constructor(private router: Router, private ms: MatchService, private userService: UserService,
              private ios: SocketioService) { }

  ngOnInit(): void {
    let matchID = this.router.url.split('/').pop();

    if (this.userService.isLoggedIn) this.ableToViewMessages = true;

    this.ms.getMatchById(matchID).subscribe( data => {
      this.match = data;
      let isPlayer = this.userService.isLoggedIn && (this.userService.email === this.match.player0 || this.userService.email === this.match.player1)
      let playerTurn = isPlayer && this.userService.email === this.match.player0 ? 0 : isPlayer && this.userService.email === this.match.player1 ? 1 : null

      this.userService.get_user_by_mail(this.match.player0).subscribe(data => this.username0 = data.username);
      this.userService.get_user_by_mail(this.match.player1).subscribe(data => this.username1 = data.username);

      this.ios.connect(matchID, isPlayer).subscribe((message)=>{
        let subject = message.subject;
        if (subject === 'newMove') {
          console.log("new move from player: " + message.player);
          this.match.turn = (this.match.turn + 1) % 2;
          if (!isPlayer || message.player !== this.userService.email) {
            this.board.insertDisk(message.column, (message.player === this.match.player0 ? 0 : 1));
          }
        }
        if (subject === 'matchEnded') {
          this.match.winner.player = message.win.player;
          this.match.winner.positions = message.win.positions;
          this.board.endMatch();
          this.board.highlightVictory(message.win.positions)
        }
      });

      if (isPlayer && this.match.winner.player === null){
        this.board = new PlayableBoard('#board', this.match.board,this.match.turn, playerTurn, (c)=>{
          this.makeMove(c);
        });
      } else {
        this.board = new Board('#board', this.match.board);
        this.board.highlightVictory(this.match.winner.positions)
      }

    });
  }

  makeMove(column): void {
    this.ms.placeDisk(this.match._id, this.userService.email, column).subscribe(
      (data)=>{
        this.board.changeTurn()
        console.log(data);
        console.log("disk inserted");
      },
        err => {
        console.log(err);
      });
  }

}
