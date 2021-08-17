import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {UserService} from "./user.service";
import {environment} from "../../environments/environment";
import {Match} from "../../../../just4fun-be/models/Match";
import { map } from "rxjs/operators";
import {Observable} from "rxjs";

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

  placeDisk(matchID, playerID, column):Observable<any> {
    console.log('doing a move');
    let headers = {
      'Authorization': 'Bearer ' + this.userService.token,
      'Content-Type': 'application/json'}
    return this.http.put(environment.serverUrl + '/' + matchID + '/' + playerID,{column: column}, {headers} );
  }

}
