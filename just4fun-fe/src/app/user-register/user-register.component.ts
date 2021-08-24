import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ImageCroppedEvent, LoadedImage} from "ngx-image-cropper";

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css']
})
export class UserRegisterComponent implements OnInit {

  public isModeratorRegistration = false;

  public errorMessage = '';
  public email = '';
  public username = '';
  public oldPassword = '';
  public password = '';
  public password2 = '';
  public croppedAvatar = '';

  constructor(public userService: UserService, public router: Router, private route: ActivatedRoute) {
    let mod_email = this.route.snapshot.paramMap.get('mod_email');
    if(mod_email) {
      this.isModeratorRegistration = true;
      this.email = mod_email;
    }
  }

  ngOnInit(): void {
  }

  imageChangedEvent: Event;
  fileChangeEvent(event: Event) {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedAvatar = event.base64;
  }

  register() {
    if(this.password !== this.password2)
    {
      this.errorMessage = 'The two password are not equal';
      console.log('Login error: ' + this.errorMessage);
    }
    else {
      if (this.password === '') {
        this.errorMessage = 'Please insert a password';
        console.log('Login error: ' + this.errorMessage);
      }
      else {
        if (this.email === '' || this.username === '') {
          this.errorMessage = 'Please insert an email and a username';
          console.log('Login error: ' + this.errorMessage);
        }
        else {
          if (!this.croppedAvatar) {
            this.errorMessage = 'Please insert an avatar';
            console.log('Login error: ' + this.errorMessage);
          }
          else {
            if(this.isModeratorRegistration)
            {
              this.userService.completeRegistration(this.email, this.username, this.oldPassword, this.password, this.croppedAvatar).subscribe((d) => {
                console.log('Completed Registration!');
                this.errorMessage = '';
                this.router.navigate(['login']);
              }, (err) => {
                this.errorMessage = err.error.errormessage;
                console.log('Complete Registration error: ' + this.errorMessage);
                this.password = '';
                this.password2 = '';
              });
            }
            else {
              this.userService.register(this.email, this.username, this.password, this.croppedAvatar).subscribe((d) => {
                console.log('Registration Done!');
                this.errorMessage = '';
                this.router.navigate(['login']);
              }, (err) => {
                this.errorMessage = err.error.errormessage;
                console.log('Registration error: ' + this.errorMessage);
                this.password = '';
                this.password2 = '';
              });
            }
          }
        }
      }
    }
  }
}
