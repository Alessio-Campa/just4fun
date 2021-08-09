import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {

  public errorMessage = false;
  public email: string;
  public password: string;
  public remember = true;

  constructor(public userService: UserService, public router: Router) { }

  ngOnInit(): void {
  }

  login() {
    this.userService.login(this.email, this.password, this.remember).subscribe( (d) => {
      console.log('Login granted: ' + JSON.stringify(d));
      console.log('User service token: ' + this.userService.token);
      this.errorMessage = false;
      this.router.navigate(['']);
    }, (err) => {
      console.log('Login error: ' + JSON.stringify(err.error));
      this.password = '';
      this.errorMessage = true;
    });
  }
}
