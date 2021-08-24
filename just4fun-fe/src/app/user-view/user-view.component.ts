import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {User, UserService} from "../services/user.service";
import {compareSegments} from "@angular/compiler-cli/src/ngtsc/sourcemaps/src/segment_marker";
import {tryCatch} from "rxjs/internal-compatibility";
import {debugOutputAstAsTypeScript} from "@angular/compiler";
import {Match, MatchService} from "../services/match.service";

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.css']
})
export class UserViewComponent implements OnInit {

  user: User;
  isFollowed: boolean = false;
  isFriend: boolean = false;
  hasRequested: boolean = false;
  private me: User;
  private canReqest = true;
  statistics = [];

  isLoading = {user: -1, buttons: -1, statistics: -1}

  constructor(private router: Router, private userService: UserService, private matchService: MatchService) {
    if (this.userService.isLoggedIn && this.userService.email === this.router.url.split('/').pop()){
      this.router.navigate(['/profile'])
    }
  }

  ngOnInit(): void {
    let userMail = this.router.url.split('/').pop();

    this.userService.get_user_by_mail(userMail).subscribe(data => {
      console.log(data)
      this.user = data;
    }, ()=>{}, ()=>{
      this.isLoading.user++;
      this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
        this.me = data;
        console.log(data)

        if (this.me.friends.includes(userMail)) {
          this.isFriend = true;
        } else if (this.user.friendRequests.includes(this.me.email)) {
          this.hasRequested = true;
        }

        if (this.me.following.includes(userMail)){
          this.isFollowed = true;
        }
      }, ()=>{}, ()=>{
        this.isLoading.buttons++;
      });
    });

    this.calculateStatistics(userMail)

  }

  follow(){
    this.userService.follow(this.me.email, this.user.email).subscribe( () => {
      this.isFollowed = true;
    })
  }

  unfollow(){
    this.userService.unfollow(this.me.email, this.user.email).subscribe( () => {
      this.isFollowed = false;
    })
  }

  unfriend(){
    this.userService.unfriend(this.me.email, this.user.email).subscribe(() => {
      this.isFriend = false;
    })
  }

  unrequest(){

  }

  sendRequest(){
    if (this.canReqest){
      this.canReqest = false;
      this.userService.sendFriendRequest(this.me.email, this.user.email).subscribe(()=>{
        this.hasRequested = true;
      });
    }

  }

  private calculateStatistics(email){
    let matches: Match[];
    let won = 0;
    let lost = 0;
    this.matchService.getUserMatches(email, 'true').subscribe(data => {
      matches = data;
    }, ()=>{}, ()=>{
      console.log("HELOOOOO")
      matches.forEach(e => {
        if ((e.winner.player === 0 && e.player0 === email) || (e.winner.player === 1 && e.player1 === email))
          won++;
        else
          lost++;
      })
      this.statistics.push({name: 'W/L ratio', val: (won/lost).toFixed(3) });
      this.statistics.push({name: 'Matches played', val: won+lost});
      this.statistics.push({name: 'Won', val: won});
      this.statistics.push({name: 'Lost', val: lost});
      this.isLoading.statistics = 0;

    })
  }

}
