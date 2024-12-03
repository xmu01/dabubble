import { Component, inject, effect, signal, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../shared/services/auth.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Timestamp } from '@angular/fire/firestore';


@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule, MatInputModule, FormsModule, CommonModule,
    MatFormFieldModule, MatInputModule, MatMenuModule, PickerComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class MainContentComponent implements AfterViewInit {
  newMessage: string = '';

  private firestoreService = inject(UsersService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.firestoreService.activeChannel;
  groupedMessages = this.firestoreService.groupedMessages;
  groupedChannelMessages = this.firestoreService.groupedChannelMessages;
  today = signal(new Date().toISOString().split('T')[0]);
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  private scrollAtBottom = signal(true);
  showEmojis = false;

  addEmoji(event: any): void {
    if (event.emoji.unified && /^[A-Z]{2}$/.test(event.emoji.short_name)) {
      // Es handelt sich um eine Flagge -> Umwandeln
      this.newMessage += this.convertToFlagEmoji(event.emoji.short_name);
    } else {
      this.newMessage += event.emoji.native;
    }
  }

  convertToFlagEmoji(countryCode: string): string {
    return countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  }

  toggleEmojis() {
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
    // Fügt den ausgewählten Punkt zum Text in der Textarea hinzu
    this.newMessage += ` ${selectedItem}`;
  }

  constructor() {
    this.firestoreService.loadChannel('uYr4Z1UxNJW1qVyRlvlX');

    effect(() => {
      const activeId = this.firestoreService.activeUser()?.userId;
      const channelId = this.firestoreService.activeChannel()?.id;

      if (activeId) {
        this.firestoreService.loadMessagePrivateChat(activeId, this.loggedUser()!.uid);
        this.newMessage = '';
        this.showEmojis = false;
        if (this.scrollAtBottom()) {
          this.scrollToBottom();
        }
      }

      if(channelId) {
        this.firestoreService.loadMessageChannelChat(channelId);
        this.newMessage = '';
        this.showEmojis = false;
        if (this.scrollAtBottom()) {
          this.scrollToBottom();
        }
      }
    });
  }

  ngAfterViewInit() {
    const container = this.scrollContainer.nativeElement;

    // Scroll-Event-Listener, um den Zustand zu überwachen
    container.addEventListener('scroll', () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
      this.scrollAtBottom.set(isAtBottom);
    });
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
      const count = [this.loggedUser()!.uid, this.activeUser()!.userId].sort();
      this.firestoreService.saveMessage({
        chatParticipants: count,
        message: this.newMessage,
        senderName: this.getLoggedUser()!.firstName + ' ' + this.getLoggedUser()!.lastName || '',
        senderId: this.loggedUser()!.uid || '',
        receiverName: this.activeUser()!.firstName + ' ' + this.activeUser()!.lastName || '',
        receiverId: this.activeUser()!.userId || '',
        reactions: [],
      }).then(() => {
        this.newMessage = '';
        this.scrollToBottom();
      });
    }
  }

  saveChannelMessage(id: string): void {
    if (this.newMessage != '') {
      this.firestoreService.saveChannelMessage({
        message: this.newMessage,
        senderName: this.getLoggedUser()!.firstName + ' ' + this.getLoggedUser()!.lastName || '',
        senderId: this.loggedUser()!.uid || '',
        timestamp: Timestamp.now()
      }, id).then(() => {
        this.newMessage = '';
        this.scrollToBottom();
      });
    }
  }

  scrollToBottom(): void {
    const container = this.scrollContainer.nativeElement;

    // Sicherstellen, dass DOM-Änderungen abgeschlossen sind
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 150);
  }
}
