import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";
import {MatchService} from "../services/match.service";

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  notifications;
  friendRequests;
  matchInvites;
  private canAccept = true
  private user;

  constructor(private router: Router, private userService: UserService, private matchService: MatchService) { }

  ngOnInit(): void {
    this.userService.get_user_by_mail(this.userService.email).subscribe(data => {
      this.user = data;
      this.notifications = data.notifications;
      this.friendRequests = data.friendRequests;
      this.matchInvites = data.matchInvites;
    })
  }

  navigateMessages(chatID){
    this.router.navigate([`/messages?chatID=${chatID}`])
  }

  handleRequest(isAccepted, requester){
    /*
    this.userService.deleteNotification(notificationId).subscribe(()=>{},()=>{},()=>{
      let idx = this.notifications.indexOf( this.notifications.filter( e => e._id === notificationId) );
      this.notifications.splice(idx, 1);
    })
     */

    let idx = this.friendRequests.indexOf(requester);
    this.friendRequests.splice(idx, 1);

    if (isAccepted)
      this.acceptRequest(requester);
    else
      this.refuseRequest(requester);

  }

  acceptRequest(accepted){
    if (this.canAccept){
      this.canAccept = false;
      this.userService.acceptFriendRequest(this.user.email, accepted).subscribe(() => {
      },()=>{}, ()=>{
        this.canAccept = true;
      });
    }
  }

  refuseRequest(refused){
    this.canAccept = false;
    this.userService.refuseFriendRequest(this.user.email, refused).subscribe(() => {
    }, ()=>{}, ()=>{
      this.canAccept = true;
    });
  }

  handleInvite(isAccepted, sender){
    let idx = this.matchInvites.indexOf(sender);
    this.matchInvites.splice(idx, 1);

    if (isAccepted)
      this.acceptInvite(sender);
    else
      this.refuseInvite(sender);
  }

  acceptInvite(sender){
    if (this.canAccept){
      this.canAccept = false;
      this.matchService.crateMatchFromInvitation(this.user.email, sender).subscribe(res => {
      },()=>{}, ()=>{
        this.canAccept = true;
      });
    }
    this.userService.deleteInvitation(this.user.email, sender).subscribe();
  }

  refuseInvite(sender){
    this.userService.deleteInvitation(this.user.email, sender).subscribe();
  }

}
