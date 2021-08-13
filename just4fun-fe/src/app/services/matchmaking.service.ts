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
  token: string;

  match(): Observable<any>{ //to localhost:3000/match/random
    this.token = this.userService.token;
    console.log('searching for a match');
    let headers = {
      'Authorization': 'Bearer ' + this.token,
      'Content-Type': 'application/json'}
    //console.log(headers)
    return this.http.post(environment.serverUrl + '/match/random',{}, {headers})
      /*
      .pipe(tap( (data: any) => {
        //console.log(JSON.stringify(data));
        //return data;
      })
    )*/;
  }

  ngOnInit(): void {
    this.ios.connect().subscribe((m) => {
      console.log(m);
    });
    this.match();
  }
}
