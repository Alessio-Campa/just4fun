import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {HomeComponent} from "./home/home.component";
import {UserLoginComponent} from "./user-login/user-login.component";
import {UserLogoutComponent} from "./user-logout/user-logout.component";
import {UserRegisterComponent} from "./user-register/user-register.component";
import {MatchComponent} from "./match/match.component";
import {ProfileComponent} from "./profile/profile.component";
import {UserViewComponent} from "./user-view/user-view.component";
import {ChatsComponent} from "./chats/chats.component";
import {UserChangePasswordComponent} from "./user-change-password/user-change-password.component";
import {NotificationsComponent} from "./notifications/notifications.component";
import {UserSettingsComponent} from "./user-settings/user-settings.component";

const routes: Routes = [
  {path: '', component: HomeComponent},

  {path: 'login', component: UserLoginComponent},
  {path: 'logout', component: UserLogoutComponent},
  {path: 'register', component: UserRegisterComponent},
  {path: 'changePassword', component: UserChangePasswordComponent},

  {path: 'match', children: [
      {path: ':id', component: MatchComponent}
    ]},
  {path: 'profile', component: ProfileComponent},
  {path: 'user', children: [
      {path: ':mail', component: UserViewComponent}
    ]},
  {path: 'messages',  component: ChatsComponent },
  {path: 'notifications', component: NotificationsComponent},
  {path: 'settings', component: UserSettingsComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
