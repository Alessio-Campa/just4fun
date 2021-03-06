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
import { ChatsComponent } from './chats/chats.component';
import { MessagesComponent } from './messages/messages.component';
import { UserChangePasswordComponent } from './user-change-password/user-change-password.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { UserChangeAvatarComponent } from './user-change-avatar/user-change-avatar.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

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
    ChatsComponent,
    MessagesComponent,
    UserChangePasswordComponent,
    NotificationsComponent,
    UserChangeAvatarComponent,
    UserSettingsComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ImageCropperModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    {provide: UserService, useClass: UserService}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
