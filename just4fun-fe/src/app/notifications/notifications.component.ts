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
  private canAccept = true
  private user;

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void {
    this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
      this.user = data;
      this.notifications = data.notifications;
    })
  }

  navigateMessages(){
    this.router.navigate(['/messages'])
  }

  handleRequest(isAccepted, requester, notificationId){
    this.userService.deleteNotification(notificationId).subscribe(()=>{},()=>{},()=>{
      let idx = this.notifications.indexOf( this.notifications.filter( e => e._id === notificationId) );
      this.notifications.splice(idx, 1);
    })
    if (isAccepted)
      this.acceptRequest(requester);
    else
      this.refuseRequest(requester);

  }

  acceptRequest(accepted){
    if (this.canAccept){
      this.canAccept = false;
      this.userService.acceptFriendRequest(this.user.email, accepted).subscribe(() => {
        let idx = this.user.friendRequests.indexOf(accepted);
        this.user.friendRequests.splice(idx, 1);
      },()=>{}, ()=>{
        this.canAccept = true;
      });

    }
  }

  refuseRequest(refused){
    this.userService.refuseFriendRequest(this.user.email, refused).subscribe(() => {
      let idx = this.user.friendRequests.indexOf(refused);
      this.user.friendRequests.splice(idx, 1);
    });
  }

}
