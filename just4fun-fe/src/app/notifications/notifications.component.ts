import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  notifications;

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void {
    this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
      this.notifications = data.notifications;
    })
  }

  navigateMessages(){
    this.router.navigate(['/messages'])
  }

}
