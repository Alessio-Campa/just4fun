import { Component, OnInit } from '@angular/core';
import { Board } from "./board";
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

  constructor(private router: Router, private ms: MatchService, private userService: UserService,
              private ios: SocketioService) { }

  makeAMove(column): void {
    this.ms.placeDisk(this.match._id, this.userService.email, column).subscribe((data)=>{
      console.log(data);
      console.log("disk inserted");
    });
  }

  ngOnInit(): void {
    let matchID = this.router.url.split('/').pop();
    this.ios.connect().subscribe((message)=>{
      let subject = message.subject;
      if (subject === 'newMove') {
        //TODO: replicare la mossa.
      }
    });
    this.ms.getMatchById(matchID).subscribe( data => {
      this.match = data;
      new Board('#board', this.match.board, (c)=>{
        this.makeAMove(c);
      });

    });
  }

}
