import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {UserService} from "./user.service";
import {environment} from "../../environments/environment";
import { map } from "rxjs/operators";
import {Observable} from "rxjs";

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

  getMatchById(id: string): Observable<Match>{
    return this.http.get<Match>(environment.serverUrl + '/match/' + id)
  }


}
