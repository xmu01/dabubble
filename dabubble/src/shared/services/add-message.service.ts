import { inject, Injectable, signal } from '@angular/core';
import { ChannelService } from './channel.service';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root'
})
export class AddMessageService {
addMessage = signal<boolean>(false);
channelService = inject(ChannelService);
userService = inject(UsersService);

  constructor() { }

  setAddMessage() {
    if(this.addMessage() == false) {
      this.channelService.activeChannel.set(null)
      this.userService.activeUser.set(null)
      this.addMessage.set(true)
    }
  }
}
