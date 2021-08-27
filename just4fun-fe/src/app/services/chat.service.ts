import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {UserService} from "./user.service";
import {emitDistinctChangesOnlyDefaultValue} from "@angular/compiler/src/core";
import {map, tap} from "rxjs/operators";

export interface Chat{
  _id: string,
  matchID: string,
  members: string[],
  messages: {
    sender: string,
    text: string,
    timestamp: number
  }[]
}

export interface Message{
  sender: string,
  text: string,
  timestamp: number
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
      }),
      params:{
        matchID: matchId
      }
    };

    return this.http.get<Chat>(`${environment.serverUrl}/chat`, options);
  }

  fetchChat(chatID, timestamp): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })/*,
      params: {
        timestamp: timestamp
      }*/
    };
    //return this.http.get<Chat>(`${environment.serverUrl}/chat/` + chatID, options); //old version
    return this.http.get<Chat>(`${environment.serverUrl}/chat/${chatID}/simpleFetching?timestamp=${timestamp}`, options).pipe(
      map( (data: any) => data.messages.filter( m => {
        return (data.members.includes(this.userService.email) && data.members.includes(m.sender)) || !data.members.includes(this.userService.email)
      }))
    );
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

  newChat(user, friend): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      friend: friend
    }

    return this.http.post(`${environment.serverUrl}/chat/${user}`, body, options);
  }

}
