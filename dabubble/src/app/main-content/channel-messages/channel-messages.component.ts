import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, ViewChild, viewChild } from '@angular/core';
import { collection, Firestore, onSnapshot, Timestamp } from '@angular/fire/firestore';
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
  imports: [MatCardModule, MatIconModule, MatMenuModule, PickerComponent, CommonModule, FormsModule, ThreadComponent],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent {
  newMessage: string = '';
  private firestore = inject(Firestore);
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
  showEditEmojis = false;

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

  addEditEmoji(event: any): void {
    const emoji = event.emoji.native;

    const group = this.groupedMessages().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    );

    if (group) {
      const message = group.messages.find(msg => msg.id === this.editMessageId);

      if (message) {
        message.message += emoji;
      }
    }
  }

  addEmoji(event: any): void {
    this.newMessage += event.emoji.native;
  }

  toggleEmojis(): void {
    this.showEmojis = !this.showEmojis;
  }

  toggleEditEmojis(): void {
    this.showEditEmojis = !this.showEditEmojis;
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

  addReactionToPrivateMessage(messageId: string, userName: string, event: any | string): void {
    let reaction: string;

    if (typeof event === 'string') {
      reaction = event;
    } else if (event && event.emoji && event.emoji.native) {
      reaction = event.emoji.native;
    } else {
      console.warn('Invalid reaction event:', event);
      return;
    }

    this.firestoreService.toggleReaction(messageId, userName, reaction);

    this.activeEmojiPickerMessageId = null;
  }

  /**
   * Lädt die Reaktionen einer Nachricht und gruppiert sie.
   */
  loadReactions(messageId: string): void {
    const reactionsCollection = collection(this.firestore, `messages/${messageId}/reactions`);
    onSnapshot(reactionsCollection, (querySnapshot) => {
      const reactionsMap = new Map<string, { count: number; userNames: string[] }>();

      querySnapshot.forEach((doc) => {
        const { reaction, userName } = doc.data();

        if (reactionsMap.has(reaction)) {
          const entry = reactionsMap.get(reaction)!;
          entry.count++;
          entry.userNames.push(userName); // Benutzernamen zur Liste hinzufügen
        } else {
          reactionsMap.set(reaction, { count: 1, userNames: [userName] }); // Neue Reaktion mit Benutzernamen
        }
      });

      const groupedReactions = Array.from(reactionsMap.entries()).map(([reaction, { count, userNames }]) => ({
        reaction,
        count,
        userNames,
      }));

      // Nachricht um die gruppierten Reaktionen erweitern
      const group = this.groupedMessages().find((g) =>
        g.messages.some((msg) => msg.id === messageId)
      );

      if (group) {
        const message = group.messages.find((msg) => msg.id === messageId);
        if (message) {
          message.reactionsGrouped = groupedReactions;
        }
      }
    });
  }

  setTooltip(names: string[]): string {
    const loggedUserFullName = `${this.getLoggedUser()?.firstName} ${this.getLoggedUser()?.lastName}`;

    const isCurrentUser = names.includes(loggedUserFullName);

    const otherNames = names.filter(name => name !== loggedUserFullName);

    const formattedNames = otherNames.map(name => `<b>${name}</b>`);

    if (isCurrentUser) {
      formattedNames.push(`<b>Du</b>`);
    }

    if (formattedNames.length === 1) {
      if (isCurrentUser) {
        return `${formattedNames[0]} hast reagiert`;
      }
      return `${formattedNames[0]} hat reagiert`;
    } else if (formattedNames.length === 2) {
      return `${formattedNames[0]} und ${formattedNames[1]} haben reagiert`;
    } else if (formattedNames.length === 3) {
      const lastUser = formattedNames.pop();
      return `${formattedNames.join(', ')} und ${lastUser} haben reagiert`;
    } else {
      return `${formattedNames[0]} und ${formattedNames.length - 1} weitere haben reagiert`;
    }
  }

  tooltipVisible: boolean = false;

  showTooltip(event: MouseEvent): void {
    this.tooltipVisible = true;
  }

  hideTooltip(event: MouseEvent): void {
    this.tooltipVisible = false;
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
