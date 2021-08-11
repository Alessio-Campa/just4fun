import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css']
})
export class UserRegisterComponent implements OnInit {

  public errorMessage = '';
  public username = '';
  public email = '';
  public password = '';
  public password2 = '';

  constructor(public userService: UserService, public router: Router) { }

  ngOnInit(): void {
  }

  register() {
    if(this.password !== this.password2)
    {
      this.errorMessage = 'The two password are not equal';
      console.log('Login error: ' + this.errorMessage);
    }
    else
    {
      if(this.password === '')
      {
        this.errorMessage = 'Please insert a password';
        console.log('Login error: ' + this.errorMessage);
      }
      else
      {
        if(this.email === '' || this.username === '')
        {
          this.errorMessage = 'Please insert an email and a username';
          console.log('Login error: ' + this.errorMessage);
        }
        else
        {
          this.userService.register(this.email, this.username, this.password).subscribe( (d) => {
            console.log('Registration Done!');
            this.errorMessage = '';
            this.router.navigate(['login']);
          }, (err) => {
            this.errorMessage = JSON.stringify(err.error.errormessage);
            console.log('Registration error: ' + this.errorMessage);
            this.password = '';
            this.password2 = '';
          });
        }
      }
    }
  }
}
