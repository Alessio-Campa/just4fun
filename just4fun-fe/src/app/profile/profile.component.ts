import { Component, OnInit } from '@angular/core';
import {User, UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {Match, MatchService} from "../services/match.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  user: User;
  ongoingMatches: Match[];

  constructor(private userService: UserService, private router: Router, private matchService: MatchService) {
    if(!this.userService.isLoggedIn)
      router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.userService.get_user_by_mail( this.userService.email ).subscribe(data => {
      this.user = data;
    });
    this.matchService.getUserMatches( this.userService.email, false ).subscribe( data => {
      this.ongoingMatches = data;
    })
  }


}
