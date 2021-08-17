import { Component, OnInit } from '@angular/core';
import { Board } from "./board";
import { Router } from "@angular/router";
import { Match, MatchService } from "../services/match.service";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  match: Match;

  constructor(private router: Router, private ms: MatchService) { }

  ngOnInit(): void {
    let matchID = this.router.url.split('/').pop();

    this.ms.getMatchById(matchID).subscribe( data => {
      this.match = data;
      new Board('#board', this.match.board);
    });
  }

}
