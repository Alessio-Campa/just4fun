import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";
import jwtDecode from 'jwt-decode';
import {environment} from "../../environments/environment";
import {JwtHelperService} from '@auth0/angular-jwt';

export interface TokenData {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface User {
  _id: string,
  username: string,
  email: string,
  points: number,
  following: string[],
  friends: string[],
  friendRequests: string[],
  roles: string[],
  avatar: string,
  notifications: {
    type: string,
    content: Object,
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient){
    this.jwtHelper = new JwtHelperService();


    console.log('User service instantiated');
    let tok = localStorage.getItem('just4fun_token');
    if(tok && !this.jwtHelper.isTokenExpired(tok))
    {
      console.log("Token remembered");
      this._token = tok;
    }
  }

  private jwtHelper;
  private _token: string = '';
  get token()
  {
    if(this.jwtHelper.isTokenExpired(this._token))
      this._token = '';
    return this._token;
  }

  public static basicAuth(user:string, password:string)
  {
    return 'Basic ' + btoa(user + ':' + password);
  }
  public tokenAuth()
  {
    return 'Bearer ' + this.token;
  }

  login(mail: string, password: string, remember: boolean): Observable<User>{
    console.log('Login: ' + mail + ' ' + password);
    let options = {
      headers: new HttpHeaders({
        'authorization': UserService.basicAuth(mail, password),
        'cache-control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };

    return this.http.get(environment.serverUrl + '/login', options ).pipe(
      tap( (data: any) => {
        console.log(JSON.stringify(data));
        this._token = data.token;
        if (remember) {
          localStorage.setItem('just4fun_token', this.token);
        }
      })
    );
  }

  logout() {
    console.log('Logging out');
    this._token = '';
    localStorage.removeItem('just4fun_token');
  }

  register(email: string, name: string, password: string, avatar: string): Observable<User>{
    let user = {
      name: name,
      email: email,
      password: password,
      avatar: avatar
    }

    let options = {
      headers: new HttpHeaders({
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };

    return this.http.post<User>(environment.serverUrl + '/user', user, options).pipe(
      tap((data) => {
        console.log(JSON.stringify(data));
      })
    );
  }
  completeRegistration(email: string, name: string, oldPassword: string, newPassword: string, avatar: string): Observable<User>{
    let data = {
      name: name,
      password: newPassword,
      avatar: avatar
    }

    let options = {
      headers: new HttpHeaders({
        'Authorization': UserService.basicAuth(email, oldPassword),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };

    return this.http.put<User>(environment.serverUrl + '/user/'+email, data, options).pipe(
      tap((data) => {
        console.log(JSON.stringify(data));
      })
    );
  }

  follow(sender: string, receiver: string): Observable<any>{
    let token = this.token
    let options = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + token,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };

    return this.http.post(`${environment.serverUrl}/user/${sender}/follow`, {user: receiver}, options).pipe(
      tap(data => {
        console.log(JSON.stringify(data))
      })
    );
  }

  unfollow(sender: string, receiver: string): Observable<any>{
    let token = this.token;
    let options = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + token,
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      }),
      body: {
        user: receiver
      }
    };

    return this.http.delete(`${environment.serverUrl}/user/${sender}/follow`, options)
  }

  sendFriendRequest(sender: string, receiver: string): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      user: receiver
    }

    return this.http.post(`${environment.serverUrl}/user/${sender}/friend`, body, options);
  }

  acceptFriendRequest(user: string, accepted: string): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      accept: accepted
    }

    return this.http.put(`${environment.serverUrl}/user/${user}/friend`, body, options);
  }

  refuseFriendRequest(user: string, refused: string): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      })
    };
    let body = {
      refuse: refused
    };

    return this.http.put(`${environment.serverUrl}/user/${user}/friend`, body, options);
  }

  unfriend(user: string, friend: string): Observable<any>{
    let options = {
      headers: new HttpHeaders({
        'Authorization': this.tokenAuth(),
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      }),
      params: {
        friend: friend
      }
    };

    return this.http.delete(`${environment.serverUrl}/user/${user}/friend`, options);
  }

  get isLoggedIn()
  {
    return this.token != '';
  }

  get username() {
    return (jwtDecode(this.token) as TokenData).username;
  }

  get email() {
    return (jwtDecode(this.token) as TokenData).email;
  }

  get id() {
    return (jwtDecode(this.token) as TokenData).id;
  }

  get is_admin(): boolean {
    return (jwtDecode(this.token) as TokenData).roles.includes('ADMIN');
  }

  get is_moderator(): boolean {
    return (jwtDecode(this.token) as TokenData).roles.includes('MODERATOR');
  }

  get_user_by_mail(mail: string): Observable<User>{
    return this.http.get<User>(environment.serverUrl + '/user/' + mail);
  }

  get leaderboard(): Observable<User[]>{
    return this.http.get<User[]>(environment.serverUrl + '/user/leaderboard');
  }

}
