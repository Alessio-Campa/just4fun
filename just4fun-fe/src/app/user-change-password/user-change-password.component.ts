import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-change-password',
  templateUrl: './user-change-password.component.html',
  styleUrls: ['./user-change-password.component.css']
})
export class UserChangePasswordComponent implements OnInit {

  public errorMessage = '';
  public oldPassword = '';
  public password = '';
  public password2 = '';

  constructor(public userService: UserService, public router: Router,) { }

  ngOnInit(): void {
  }

  changePassword() {
    if(this.password !== this.password2)
    {
      this.errorMessage = 'The two password are not equal';
      console.log('Login error: ' + this.errorMessage);
    }
    else {
      if (this.password === '') {
        this.errorMessage = 'Please insert a new password';
        console.log('Login error: ' + this.errorMessage);
      }
      else {
        this.userService.changePassword(this.oldPassword, this.password).subscribe((d) => {
          console.log('Password Changed!');
          this.errorMessage = '';
          this.router.navigate(['/']);
        }, (err) => {
          if(err.status == 401)
            this.errorMessage = "Old password is wrong"
          else
            this.errorMessage = err.error.errormessage;
          console.log('Password change error: ' + this.errorMessage);
          this.oldPassword = '';
          this.password = '';
          this.password2 = '';
        });
      }
    }
  }

}
