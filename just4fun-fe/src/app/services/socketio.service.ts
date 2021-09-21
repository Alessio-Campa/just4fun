import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {io} from "socket.io-client";
import { UserService } from "./user.service";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  private socket;
  constructor( private userService: UserService ) { }

  getSocketIO(){
    if (!this.socket) {
      this.socket = io(environment.serverUrl, { transports: ['websocket'] });

      this.socket.on('readyToPlay', (m)=>{
        this.socket.emit('playing', m.matchID);
      });

      this.socket.on('readyToWatch', (m)=>{
        this.socket.emit('watching', m.matchID);
      });

      this.socket.on('error', (err) => {
        console.log('Socket.io error: ' + err);
      });
    }
    this.socket.emit('join', this.userService.email);
    return this.socket;
  }

}
