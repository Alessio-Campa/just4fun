import { Component, OnInit } from '@angular/core';
import { PlayableBoard } from "../../assets/js/board";
import { Router } from "@angular/router";
import {UserService} from "../services/user.service";
import {SocketioService} from "../services/socketio.service";
import { Match, MatchService } from "../services/match.service";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  match: Match;
  board;
  yourTurn;

  constructor(private router: Router, private ms: MatchService, private userService: UserService,
              private ios: SocketioService) { }

  ngOnInit(): void {
    let matchID = this.router.url.split('/').pop();

    this.ms.getMatchById(matchID).subscribe( data => {
      this.match = data;
      this.yourTurn = this.match.player0 === this.userService.email && this.match.turn === 0;

      this.ios.connect(matchID, (this.userService.email === this.match.player0 || this.userService.email === this.match.player1)).subscribe((message)=>{
        let subject = message.subject;
        if (subject === 'newMove') {
          console.log("new move from player: " + message.player);
          this.yourTurn ? this.yourTurn = false : this.yourTurn = true;
          //TODO: insert disk as opponent.
        }
      });

      this.board = new PlayableBoard('#board', this.match.board,this.match.turn, (c)=>{
        this.makeMove(c);
      });

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
