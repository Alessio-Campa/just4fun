import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {UserService} from "./user.service";
import {emitDistinctChangesOnlyDefaultValue} from "@angular/compiler/src/core";
import {map, tap} from "rxjs/operators";

export class Chat {
  constructor(private http: HttpClient, private userService: UserService, data: { _id: string; matchID: string; members: string[]; messages: Message[]; }) {
    this._id = data._id;
    this.matchID = data.matchID;
    this.members = data.members;
    this.messages = data.messages;
  }

  _id: string
  matchID: string
  members: string[]
  messages: Message[]

  fetchChat() {
    let lastTimestamp = 0;
    if (this.messages.length > 0){
      lastTimestamp = this.messages[this.messages.length-1].timestamp;
    }

    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    this.http.get<Message[]>(`${environment.serverUrl}/chat/${this._id}/message/?afterTimestamp=${lastTimestamp}`, options)
      .subscribe((messages: Message[]) => {
        for(let i in messages) {
          // if((this.members.includes(this.userService.email) && this.members.includes(m.sender))
          //   || !this.members.includes(this.userService.email))
          this.messages.push(messages[i]);
        }
      });
  }

  sendMessage(message: string): Observable<any> {
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      sender: this.userService.email,
      text: message
    }

    return this.http.post(`${environment.serverUrl}/chat/${this._id}/message`, body, options);
  }
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

    return this.http.get<Chat>(`${environment.serverUrl}/chat`, options).pipe(map((data) => {
      return new Chat(this.http, this.userService, data[0]);
    }));
  }

  getChatsByUser(user: string): Observable<Chat[]>{
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

    return this.http.get<Chat[]>(`${environment.serverUrl}/chat`, options).pipe(map((datas: Chat[]) => {
      return datas.map((d: Chat) => { return new Chat(this.http, this.userService, d); });
    }));
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
