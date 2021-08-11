import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from "socket.io-client";
import { UserService } from "./user.service";
import {environment} from "../../environments/environment";
import {colors} from "@angular/cli/utilities/color";

@Injectable({
  providedIn: 'root'
})
export class SocketioService { //TODO: da testare
  private socket;

  constructor() { }

  connect(): Observable<any> {

    this.socket = io(environment.serverUrl);

    return new Observable((observer) => {
      this.socket.join(UserService.prototype.username)

      this.socket.on('broadcast', (message) => {
        console.log(colors.cyan('Socket.io: ' + UserService.prototype.username + ' has recived a new message: ' + JSON.stringify(message.subject)));
        observer.next(message);
      });

      this.socket.on('error', (error) => {
        console.log('Socket.io error: ' + error);
        observer.error(error);
      });
    });
  }
}
