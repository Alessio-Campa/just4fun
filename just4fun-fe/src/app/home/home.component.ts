import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from "../../environments/environment";
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  isLogged;
  leaderboard;

  constructor(public us: UserService) { }
  socket = io(environment.serverUrl, { transports: ['websocket'] });

  ngOnInit(): void {
    this.isLogged = this.us.isLoggedIn;
    this.us.leaderboard.subscribe(data => {
      this.leaderboard = data;
      console.log(this.leaderboard)
    })

    console.log("127.0.0.0 sweet 127.0.0.0");
    this.socket.on('broadcast', ()=>{
      console.log("Roger");
    })
  }
}
