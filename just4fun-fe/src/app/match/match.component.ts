import { Component, OnInit } from '@angular/core';
import { Board } from "./board";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    new Board('#board');
  }

}
