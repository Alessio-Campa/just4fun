import { Component, OnInit } from '@angular/core';
import { Board } from "./board";
import { Router } from "@angular/router";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  matchID;

  constructor(private router: Router) { }

  ngOnInit(): void {
    new Board('#board');
    this.matchID = this.router.url.split('/').pop()
    console.log(this.matchID)
  }

}
