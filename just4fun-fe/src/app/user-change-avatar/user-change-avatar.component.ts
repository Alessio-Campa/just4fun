import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {ImageCroppedEvent} from "ngx-image-cropper";

@Component({
  selector: 'app-user-change-avatar',
  templateUrl: './user-change-avatar.component.html',
  styleUrls: ['./user-change-avatar.component.css']
})
export class UserChangeAvatarComponent implements OnInit {

  public croppedAvatar = '';
  @Output() imageCroppedEmitter = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  imageChangedEvent: Event;
  fileChangeEvent(event: Event) {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedAvatar = event.base64;
    this.imageCroppedEmitter.emit(this.croppedAvatar);
  }

}
