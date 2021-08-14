import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from "../../environments/environment";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor() { }
  socket = io(environment.serverUrl, { transports: ['websocket'] });

  ngOnInit(): void {
    console.log("127.0.0.0 sweet 127.0.0.0")
    this.socket.on('broadcast', ()=>{
      console.log("Roger")
    })
  }
}
