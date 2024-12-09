import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, ViewChild, viewChild } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UsersService } from '../../../shared/services/users.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ThreadComponent } from '../../thread/thread.component';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatMenuModule ,PickerComponent, CommonModule, FormsModule, ThreadComponent],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent {
  newMessage: string = '';

  private firestoreService = inject(UsersService);
  private auth = inject(AuthService);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.firestoreService.activeChannel;
  groupedMessages = this.firestoreService.groupedMessages;
  groupedChannelMessages = this.firestoreService.groupedChannelMessages;
  today = signal(new Date().toISOString().split('T')[0]);
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  showEmojis = false;
  hoveredMessageId: string | null = null;
  contentElement = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  activeEmojiPickerMessageId: string | null = null;
  editMessageId: string | null = null;
  temporaryMessage: string | null = null;


  startEditingMessage(messageId: string, message: string): void {
    this.editMessageId = messageId; 
    this.temporaryMessage = message; 
  }
  
  cancelEditing(): void {
    const message = this.groupedMessages().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    )?.messages.find(msg => msg.id === this.editMessageId);
  
    if (message) {
      message.message = this.temporaryMessage!;
    }
  
    this.editMessageId = null; 
    this.temporaryMessage = null; 
  }
  
  saveEditedMessage(id: string, message: string): void {
    this.firestoreService.updateMessage(id, message).then(() => {
      this.editMessageId = null; 
      this.temporaryMessage = null; 
    });
  }


  setHoveredMessageId(messageId: string | undefined): void {
    if (messageId) {
      this.hoveredMessageId = messageId;
    } else {
      this.hoveredMessageId = null;
    }
  }

  clearHoveredMessageId(messageId: string | undefined, event: MouseEvent): void {
    const target = event.relatedTarget as HTMLElement | null;

    if (!target || (!target.closest('.message-container') && !target.closest('.reaction-bar'))) {
      this.hoveredMessageId = null;
    }
  }


  addEmoji(event: any): void {
    this.newMessage += event.emoji.native;
  }

  toggleEmojis(): void {
    this.showEmojis = !this.showEmojis;
  }

  toggleEmojiPicker(messageId: string): void {
    this.activeEmojiPickerMessageId = 
      this.activeEmojiPickerMessageId === messageId ? null : messageId;
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

  constructor() {
    this.firestoreService.loadChannel('uYr4Z1UxNJW1qVyRlvlX');

    effect(() => {
      const channelId = this.firestoreService.activeChannel()?.id;

      if (channelId) {
        this.firestoreService.loadMessageChannelChat(channelId);
        this.newMessage = '';
        this.showEmojis = false;
        this.triggerScrollToBottom();
      }
      this.firestoreService.channelMessageChanged();

    });
  }

  getLoggedUser() {
    const userId = this.loggedUser()!.uid;
    if (!userId) {
      return null;
    }

    return this.users().find(user => user.userId === userId) || null;
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
        this.triggerScrollToBottom();
      });
    }
  }

  private triggerScrollToBottom() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  private scrollToBottom() {
    const contentEl = this.contentElement();
    if (contentEl) {
      contentEl.nativeElement.scrollTo({
        top: contentEl.nativeElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }
}
