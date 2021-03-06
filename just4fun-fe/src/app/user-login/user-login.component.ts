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
      this.errorMessage = false;
      this.router.navigate(['']);
    }, (err) => {
      if(err.status == 422)
      {//Inserted a temporary password
        this.router.navigate(['register', {mod_email: this.email}]);
      }
      this.password = '';
      this.errorMessage = true;
    });
  }
}
