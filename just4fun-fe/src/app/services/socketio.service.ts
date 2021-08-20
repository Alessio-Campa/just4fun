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

  connect(matchID: string = null, player = false): Observable< any > {

    this.socket = io(environment.serverUrl, { transports: ['websocket'] });

    return new Observable( (observer) => {
      this.socket.on('broadcast', (m) => {
        console.log('Socket.io message received: ' + JSON.stringify(m));
        observer.next(m);
      });

      this.socket.on('readyToPlay', (m)=>{
        this.socket.emit('playing', m.matchID);
      });

      this.socket.on('readyToWatch', (m)=>{
        this.socket.emit('watching', m.matchID);
      });

      this.socket.on('welcome', () => {
        if (matchID === null) {
          this.socket.emit('join', this.userService.email);
        }
        else if (player === true){
          this.socket.emit('playing', matchID);
        }
        else {
          this.socket.emit('watching', matchID);
        }
      });

      this.socket.on('error', (err) => {
        console.log('Socket.io error: ' + err);
        observer.error(err);
      });

      return { unsubscribe() {
          this.socket.disconnect();
      }};

    });
  }

  ngOnInit(): void {
    console.log("socket initialized");
  }
}
