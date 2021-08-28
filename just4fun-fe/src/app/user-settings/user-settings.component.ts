import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css']
})
export class UserSettingsComponent implements OnInit {

  croppedImage: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private userService: UserService, private router: Router) {
    if (!this.userService.isLoggedIn)
      this.router.navigate(['/'])
  }

  ngOnInit(): void {
  }

  imageEvent(imageData: string){
    this.croppedImage = imageData;
  }

  changeAvatar(){
    if(this.croppedImage === ''){
      this.errorMessage = 'Please select an image';
    }
    else {
      this.successMessage = 'Image is being updated, this may take a few moments'
      this.userService.changeAvatar(this.croppedImage).subscribe(()=> {
        this.successMessage = "Image updated successfully";
      });
    }
  }



}
