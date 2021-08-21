import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-matchmaking',
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.css']
})
export class MatchmakingComponent implements OnInit {

  time: number = 0;

  constructor() { }

  ngOnInit(): void {
    setInterval(()=>{
      this.time += 1;
    }, 1000);
  }

}
