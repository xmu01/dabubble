import { AfterViewInit, Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
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
export class NewMessageComponent implements AfterViewInit {
  private firestore = inject(Firestore);
  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private addMessageService = inject(AddMessageService);

  activeUser = this.firestoreService.activeUser;
  users = this.firestoreService.users;
  channels = this.channelService.channels;
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
  inputTrigger = true;
  @ViewChild('inputFocus') inputFocus!: ElementRef;

  ngAfterViewInit(): void {
    if (this.inputFocus) {
      this.inputFocus.nativeElement.focus();
    }
  }
  
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
    const cursorPosition = input.selectionStart;
    const value = input.value;
  
    // Prüfe, ob das '@'-Zeichen direkt vor der aktuellen Cursorposition steht
    if (cursorPosition > 0 && value[cursorPosition - 1] === '#') {
      this.inputTrigger = false;
      this.check = false;
      this.menuTrigger.openMenu();
    } else if (cursorPosition > 0 && value[cursorPosition - 1] === '@') {         
      this.inputTrigger = true;
      this.check = false;
      this.menuTrigger.openMenu();
    } 
  }

  toggleMenu() {
    this.inputTrigger = true;
    this.menuTrigger.toggleMenu();
    this.check = !this.check;
  }

  // addToMessage(selectedItem: string): void {
  //   this.newMessage += `@${selectedItem} `;
  // }
  @ViewChild('textarea') messageInput!: ElementRef<HTMLTextAreaElement>;
  check = false;

  addToMessage(selectedItem: string, viaButton: boolean = false): void {
    const textarea = this.messageInput.nativeElement;
    const cursorPosition = textarea.selectionStart;
    
    // Prüfen, ob das letzte Zeichen ein "@" ist
    const isAtSymbolBefore = this.newMessage[cursorPosition - 1] === '@';

    let mentionText = this.check ? `@${selectedItem} ` : selectedItem + ' ';

    // Wenn ein "@" manuell eingegeben wurde, vermeide doppeltes Hinzufügen
    if (!this.check && isAtSymbolBefore) {
      mentionText = selectedItem + ' ';
    }

    // Füge den Text an der aktuellen Cursorposition ein
    this.newMessage = 
      this.newMessage.slice(0, cursorPosition) + 
      mentionText + 
      this.newMessage.slice(cursorPosition);
    
    // Fokus zurück ins Textarea setzen und Cursor hinter dem eingefügten Text positionieren
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = cursorPosition + mentionText.length;
    }, 0);
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
        display: `#${channel.name}`,
        search: `#${channel.name}`,
        type: 'channel'
      })),
    ];

    return searchableList.filter(item =>
      item.search.toLowerCase().includes(filterValue)
    );
  }


}



