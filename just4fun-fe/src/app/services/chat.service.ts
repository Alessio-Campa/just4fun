import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {UserService} from "./user.service";

export interface Chat{
  _id: string,
  idMatch: string,
  members: string[],
  messages: {
    sender: string,
    text: string,
    timestamp: number
  }[]
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient, private userService: UserService) { }

  getChatByMatch(matchId: string): Observable<Chat>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };

    return this.http.get<Chat>(`${environment.serverUrl}/chat/${matchId}`, options);
  }

  getChatsByUser(user: string): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      }),
      params:{
        user: user,
        matchID: null
      }
    };

    return this.http.get<Chat[]>(`${environment.serverUrl}/chat`, options);
  }

  sendMessage(sender, message, chatID): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      sender: sender,
      text: message
    }
    return this.http.put(`${environment.serverUrl}/chat/${chatID}/message`, body, options);
  }

}
