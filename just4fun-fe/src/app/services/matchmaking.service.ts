import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {UserService} from "./user.service";
import {environment} from "../../environments/environment";
import {tap} from "rxjs/operators";
import {SocketioService} from "./socketio.service";

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  constructor(private http: HttpClient, private userService: UserService, private ios: SocketioService) { }

  match(): Observable<any>{
    console.log('searching for a match');
    let headers = {
      'Authorization': this.userService.tokenAuth(),
      'Content-Type': 'application/json'}

    return this.http.post(environment.serverUrl + '/match/random',{user: this.userService.email}, {headers})

  }

  cancelUserMatchmaking(): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'Content-Type': 'application/json'
      })
    };

    return this.http.delete(`${environment.serverUrl}/match/random?user=${this.userService.email}`, options);
  }

}
