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
  statistics: any[] = [];

  isLoading = {user: -1, matches: -2, statistics: -1};

  constructor(private userService: UserService, private router: Router, private matchService: MatchService) {
    if(!this.userService.isLoggedIn)
      router.navigate(['/login']);
  }

  ngOnInit(): void {
    //get user matches
    this.matchService.getUserMatches(this.userService.email, "false").subscribe(data => {
      this.ongoingMatches = data;
    }, () => {
    }, () => {
      this.isLoading.matches++;
    })
    this.matchService.getUserMatches(this.userService.email, "true", 5).subscribe(data => {
      this.endedMatches = data;
    }, () => {
    }, () => {
      this.isLoading.matches++;
    })

    //get user data
    this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
      this.user = data;
    }, () => {
    }, () => {
      this.isLoading.user++;
    });

    //calculate statistics
    this.calculateStatistics()

  }

  navigateChats(){
    this.router.navigate(['messages'])
  }

  private calculateStatistics(){
    let matches: Match[];
    let won = 0;
    let lost = 0;
    this.matchService.getUserMatches(this.userService.email, 'true').subscribe(data => {
      matches = data;
    }, ()=>{}, ()=>{
      this.isLoading.statistics = 0
      matches.forEach(e => {
        if ((e.winner.player === 0 && e.player0 === this.userService.email) || (e.winner.player === 1 && e.player1 === this.userService.email))
          won++;
        else
          lost++;
      })
      this.statistics.push({name: 'W/L ratio', val: (won/lost).toFixed(3) })
      this.statistics.push({name: 'Matches played', val: won+lost})
      this.statistics.push({name: 'Won', val: won})
      this.statistics.push({name: 'Lost', val: lost})
    })
  }

}
