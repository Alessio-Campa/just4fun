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
    //console.log(headers)
    //console.log(this.userService.email);
    return this.http.post(environment.serverUrl + '/match/random',{user: this.userService.email}, {headers})
      /*
      .pipe(tap( (data: any) => {
        //console.log(JSON.stringify(data));
        //return data;
      })
    )*/;
  }

  ngOnInit(): void {
    /*
    this.ios.connect().subscribe((m) => {
      console.log(m);
    });*/
    //this.match();
  }
}
