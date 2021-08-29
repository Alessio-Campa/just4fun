import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {UserService} from "./user.service";
import {environment} from "../../environments/environment";
import { map } from "rxjs/operators";
import {Observable} from "rxjs";
import {getEntryPointInfo} from "@angular/compiler-cli/ngcc/src/packages/entry_point";

export interface Match {
  _id: string,
  player0: string,
  player1: string,
  winner: {
    player: number, //null = in corso, -1 = parità, 0/1 = vincitore;
    positions: number[][]
  },
  turn: number,
  board: number[][],
  moves: number[],
  matchStart: Date,
  lastMove: Date
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {

  constructor(private http: HttpClient, private userService: UserService) { }

  get randomLiveMatches() {
    let options = {
      headers: new HttpHeaders({
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      }),
      params:{
        limit: 6,
        ended: false
      }
    };
    return this.http.get<Match[]>(environment.serverUrl + "/match", options)
  }

  getUserMatches(mail: string, areEnded: string = null, limit: number = 0) {
    let options = {
      headers: new HttpHeaders({
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      }),
      params:{
        limit: limit,
        ended: areEnded,
        player: mail
      }
    };
    return this.http.get<Match[]>(environment.serverUrl + "/match", options)
  }

  getMatchById(id: string): Observable<Match>{
    return this.http.get<Match>(environment.serverUrl + '/match/' + id)
  }

  placeDisk(matchID, playerID, column):Observable<any> {
    let headers = {
      'Authorization': this.userService.tokenAuth(),
      'Content-Type': 'application/json'
    };

    return this.http.post(`${environment.serverUrl}/match/${matchID}/moves`,{column: column, user: playerID}, {headers});
  }

  crateMatchFromInvitation(user, friend): Observable<any> {
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'Content-Type': 'application/json'
      })
    };
    let body = {
      user: user,
      opponent: friend
    };

    return this.http.post(`${environment.serverUrl}/match`, body, options)
  }

}
