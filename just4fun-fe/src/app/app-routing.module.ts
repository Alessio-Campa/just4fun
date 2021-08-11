import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {HomeComponent} from "./home/home.component";
import {UserLoginComponent} from "./user-login/user-login.component";
import {UserLogoutComponent} from "./user-logout/user-logout.component";
import {UserRegisterComponent} from "./user-register/user-register.component";

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: UserLoginComponent},
  {path: 'logout', component: UserLogoutComponent},
  {path: 'register', component: UserRegisterComponent},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
