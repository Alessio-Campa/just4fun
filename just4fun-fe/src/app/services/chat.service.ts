import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {UserService} from "./user.service";
import {emitDistinctChangesOnlyDefaultValue} from "@angular/compiler/src/core";
import {map, tap} from "rxjs/operators";

export class Chat {
  constructor(private http: HttpClient, private userService: UserService, data: { _id: string; matchID: string; members: string[]; }) {
    this._id = data._id;
    this.matchID = data.matchID;
    this.members = data.members;
    this.messages = [];
    this.fetchChat();
  }

  _id: string
  matchID: string
  members: string[]
  messages: Message[]

  getMessage(filter?: string[])
  {
    if(filter)
      return this.messages.filter((m) => {
        return filter.includes(m.sender);
      });
    else
      return this.messages;
  }

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
    this.http.get<Message[]>(`${environment.serverUrl}/chat/${this._id}/message?afterTimestamp=${lastTimestamp}`, options)
      .subscribe((messages: Message[]) => {
        for(let i in messages) {
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
    return this.getChatsByUsers([user]);
  }

  getChatsByUsers(users: string[]): Observable<Chat[]>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };

    let params = 'matchID=null&';
    for(let i in users)
      params += `user=${users[i]}&`;
    params = params.substring(0, params.length - 1); //remove last '&'

    return this.http.get<Chat[]>(`${environment.serverUrl}/chat?${params}`, options).pipe(map((datas: Chat[]) => {
      return datas.map((d: Chat) => { return new Chat(this.http, this.userService, d); });
    }));
  }

  newChat(members: string[]): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.userService.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      members: members
    }

    return this.http.post(`${environment.serverUrl}/chat/`, body, options);
  }
}
