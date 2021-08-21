import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {User, UserService} from "../services/user.service";
import {compareSegments} from "@angular/compiler-cli/src/ngtsc/sourcemaps/src/segment_marker";
import {tryCatch} from "rxjs/internal-compatibility";

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

  isLoading = {user: -1, buttons: -1}

  constructor(private router: Router, private userService: UserService) {
    if (this.userService.isLoggedIn && this.userService.email === this.router.url.split('/').pop()){
      this.router.navigate(['/profile'])
    }
  }

  ngOnInit(): void {
    let userMail = this.router.url.split('/').pop();

    this.userService.get_user_by_mail(userMail).subscribe(data => {
      this.user = data;
    }, ()=>{}, ()=>{
      this.isLoading.user++;
      this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
        this.me = data;

        if (this.user.friends.includes(this.me.email)) {
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

  }

  unrequest(){

  }

  sendRequest(){
    this.userService.sendFriendRequest(this.me.email, this.user.email).subscribe(()=>{
      this.hasRequested = true;
    })
  }

}
