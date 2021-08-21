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
  endedMatches: Match[];

  isLoading = {user: -1, matches: -2, statistics: -1};

  constructor(private userService: UserService, private router: Router, private matchService: MatchService) {
    if(!this.userService.isLoggedIn)
      router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.userService.get_user_by_mail( this.userService.email ).subscribe(data => {
      this.user = data;
    }, ()=>{}, ()=>{
      this.isLoading.user++;
    });
    this.matchService.getUserMatches( this.userService.email, "false" ).subscribe( data => {
      this.ongoingMatches = data;
    }, ()=>{}, ()=>{
      this.isLoading.matches++;
    })
    this.matchService.getUserMatches( this.userService.email, "true" ).subscribe( data => {
      this.endedMatches = data;
    }, ()=>{}, ()=>{
      this.isLoading.matches++;
    })
  }


}
