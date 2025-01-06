import { Component, effect, inject, signal, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AuthService } from '../../../shared/services/auth.service';
import { UsersService } from '../../../shared/services/users.service';
import { Firestore, Timestamp } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map, Observable, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { ChannelService } from '../../../shared/services/channel.service';
import { AddMessageService } from '../../../shared/services/add-message.service';
import { Users } from '../../../shared/interfaces/users';

@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [MatCardModule, MatIconModule, FormsModule, CommonModule, PickerComponent, MatMenuModule, MatTooltipModule, MatFormFieldModule, MatAutocompleteModule, MatInputModule, AsyncPipe, ReactiveFormsModule],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss'
})
export class NewMessageComponent {
  private firestore = inject(Firestore);
  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private addMessageService = inject(AddMessageService);

  activeUser = this.firestoreService.activeUser;
  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  groupedMessages = this.firestoreService.groupedMessages;
  today = signal(new Date().toISOString().split('T')[0]);
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  editMessageId: string | null = null;
  newMessage: string = '';
  showEmojis = false;
  myControl = new FormControl('');
  filteredOptions?: Observable<{ id: string; name: string; display: string; search: string; type: string }[]>;
  selectedChat: string = '';
  selectedType: string = '';
  selectedName: string = '';

  constructor() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );

    this.myControl.valueChanges.subscribe(value => {
      const selectedItem = this._filter(value || '').find(
        item => item.display === value
      );
      if (selectedItem) {
        this.selectedChat = selectedItem.id;
        this.selectedType = selectedItem.type;
        if (this.selectedType == 'user') {
          this.selectedName = selectedItem.name
        }
      }
    });
  }

  addEmoji(event: any): void {
    this.newMessage += event.emoji.native;
  }

  toggleEmojis(): void {
    this.showEmojis = !this.showEmojis;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const value = input.value;

    if (value.includes('@')) {
      this.menuTrigger.openMenu();
    } else {
      this.menuTrigger.closeMenu();
    }
  }

  toggleMenu() {
    this.menuTrigger.toggleMenu();
  }

  addToMessage(selectedItem: string): void {
    this.newMessage += ` ${selectedItem}`;
  }

  getLoggedUser() {
    const userId = this.loggedUser()!.uid;
    if (!userId) {
      return null;
    }

    return this.users().find(user => user.userId === userId) || null;
  }

  saveMessage(): void {
    if (this.newMessage != '') {
      if (this.selectedType == 'user') {
        const count = [this.loggedUser()!.uid, this.selectedChat].sort();
        this.firestoreService.saveMessage({
          chatParticipants: count,
          message: this.newMessage,
          senderName: this.getLoggedUser()!.firstName + ' ' + this.getLoggedUser()!.lastName || '',
          senderId: this.loggedUser()!.uid || '',
          receiverName: this.selectedName || '',
          receiverId: this.selectedChat || '',
          reactions: [],
        }).then(() => {
          this.newMessage = '';
          this.addMessageService.addMessage.set(false);
          this.firestoreService.loadUser(this.selectedChat);
        });
      } else {
        this.channelService.saveChannelMessage({
          message: this.newMessage,
          senderName: this.getLoggedUser()!.firstName + ' ' + this.getLoggedUser()!.lastName || '',
          senderId: this.loggedUser()!.uid || '',
          timestamp: Timestamp.now()
        }, this.selectedChat).then(() => {
          this.newMessage = '';
          this.addMessageService.addMessage.set(false);
          this.channelService.loadChannel(this.selectedChat);
        });
      }
    }
  }

  private _filter(value: string): { id: string; name: string; display: string; search: string; type: string }[] {
    const filterValue = value.toLowerCase();

    const searchableList: { id: string; name: string; display: string; search: string; type: string }[] = [
      ...this.firestoreService.users().map(user => ({
        id: user.userId ?? '',
        name: `${user.firstName} ${user.lastName}`,
        display: `@${user.firstName} ${user.lastName}`,
        search: `@${user.firstName} ${user.lastName} ${user.email}`,
        type: 'user'
      })),
      ...this.channelService.channels().map(channel => ({
        id: channel.id ?? '',
        name: channel.name,
        display: `# ${channel.name}`,
        search: `# ${channel.name}`,
        type: 'channel'
      })),
    ];

    return searchableList.filter(item =>
      item.search.toLowerCase().includes(filterValue)
    );
  }


}



