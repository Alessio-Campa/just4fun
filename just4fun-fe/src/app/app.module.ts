import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { UserService } from "./services/user.service";
import { UserLoginComponent } from './user-login/user-login.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { FormsModule } from "@angular/forms";
import { UserLogoutComponent } from './user-logout/user-logout.component';
import { MatchComponent } from './match/match.component';
import { LoggedHomeComponent } from './logged-home/logged-home.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ProfileComponent } from './profile/profile.component';
import { UserViewComponent } from './user-view/user-view.component';
import { MatchmakingComponent } from './matchmaking/matchmaking.component';
import { ChatsComponent } from './chats/chats.component';
import { MessagesComponent } from './messages/messages.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    UserLoginComponent,
    UserRegisterComponent,
    UserLogoutComponent,
    MatchComponent,
    LoggedHomeComponent,
    ProfileComponent,
    UserViewComponent,
    MatchmakingComponent,
    ChatsComponent,
    MessagesComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ImageCropperModule
  ],
  providers: [
    {provide: UserService, useClass: UserService}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
