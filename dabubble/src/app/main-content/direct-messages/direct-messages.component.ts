import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, ViewChild, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../../shared/services/users.service';
import { AuthService } from '../../../shared/services/auth.service';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [MatCardModule, MatIconModule, FormsModule, CommonModule, PickerComponent, MatMenuModule],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss'
})
export class DirectMessagesComponent {
  private firestoreService = inject(UsersService);
  private auth = inject(AuthService);

  activeUser = this.firestoreService.activeUser;
  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  groupedMessages = this.firestoreService.groupedMessages;
  today = signal(new Date().toISOString().split('T')[0]);
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  hoveredMessageId: string | null = null;
  contentElement = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  activeEmojiPickerMessageId: string | null = null;
  editMessageId: string | null = null;
  newMessage: string = '';
  showEmojis = false;

  constructor() {
    effect(() => {
      const activeId = this.firestoreService.activeUser()?.userId;

      if (activeId) {
        this.firestoreService.loadMessagePrivateChat(activeId, this.loggedUser()!.uid);
        this.newMessage = '';
        this.showEmojis = false;
        this.triggerScrollToBottom();
      }

      this.firestoreService.messageChanged();
    });
  }

  startEditingMessage(messageId: string): void {
    this.editMessageId = messageId; // Aktiviert den Bearbeitungsmodus für diese Nachricht
  }

  saveEditedMessage(id: string, message: string): void {
    this.firestoreService.updateMessage(id, message)
    this.editMessageId = null; // Beendet den Bearbeitungsmodus
  }

  cancelEditing(): void {
    this.editMessageId = null; // Beendet den Bearbeitungsmodus ohne Änderungen
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

    // Überprüfe, ob target existiert und ob es sich innerhalb der relevanten Container befindet
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
        this.triggerScrollToBottom();
      });
    }
  }

  addReactionToPrivateMessage(id: string, event: any | string): void {
    let reaction: string;
  
    // Prüfe, ob der übergebene Wert ein String ist oder ein Event-Objekt
    if (typeof event === 'string') {
      reaction = event; // Direkt den String übernehmen
    } else if (event && event.emoji && event.emoji.native) {
      reaction = event.emoji.native; // Emoji-Wert aus dem Event-Objekt extrahieren
    } else {
      console.warn('Invalid reaction event:', event);
      return; // Fehlerfall, keine Aktion ausführen
    }
  
    // Füge die Reaktion hinzu
    this.firestoreService.addReactionToPrivateMessage(id, reaction);
  
    // Emoji-Picker schließen
    this.activeEmojiPickerMessageId = null;
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
