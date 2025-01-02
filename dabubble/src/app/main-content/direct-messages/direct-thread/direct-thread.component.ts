import { Component, effect, ElementRef, HostListener, inject, signal, ViewChild, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { from, map, Observable, shareReplay } from 'rxjs';
import { collection, doc, Firestore, getDoc, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../../shared/services/auth.service';
import { UsersService } from '../../../../shared/services/users.service';
import { ChannelService } from '../../../../shared/services/channel.service';
import { Users } from '../../../../shared/interfaces/users';

@Component({
  selector: 'app-direct-thread',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatMenuModule, PickerComponent, CommonModule, FormsModule],
  templateUrl: './direct-thread.component.html',
  styleUrl: './direct-thread.component.scss'
})
export class DirectThreadComponent {
  newMessage: string = '';
  firestore = inject(Firestore);
  auth = inject(AuthService);
  user = inject(UsersService);
  channelService = inject(ChannelService);
  users = this.user.users;
  loggedUser = this.auth.userSignal;
  activeUser = this.user.activeUser;
  activeChannel = this.channelService.activeChannel();
  showEmojis = false;
  contentElement = viewChild<ElementRef<HTMLDivElement>>('scrollThread');
  groupedChannelAnswers = this.channelService.groupedChannelAnswers;
  today = signal(new Date().toISOString().split('T')[0]);
  hoveredMessageId: string | null = null;
  editMessageId: string | null = null;
  activeEmojiPickerMessageId: string | null = null;
  temporaryMessage: string | null = null;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  threadActive = this.channelService.showThread();
  showEditEmojis = false;

  constructor() {
    effect(() => {
      const messageId = this.channelService.activeAnswer();
      const channelId = this.channelService.activeChannel()?.id;

      if (messageId) {
        this.channelService.loadAnswersChannelChat(channelId, messageId);
        this.newMessage = '';
        this.showEmojis = false;
        this.triggerScrollToBottom();
      }
      this.channelService.channelAnswersChanged();

    });

    effect(() => {
      this.groupedChannelAnswers().forEach((group) => {
        group.messages.forEach((message) => {
          this.loadReactions(message.id!);
          this.triggerScrollToBottom();
        });
      });
    });
  }

  startEditingMessage(messageId: string, message: string): void {
    this.editMessageId = messageId;
    this.temporaryMessage = message;
  }

  cancelEditing(): void {
    const message = this.groupedChannelAnswers().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    )?.messages.find(msg => msg.id === this.editMessageId);

    if (message) {
      message.message = this.temporaryMessage!;
    }

    this.editMessageId = null;
    this.temporaryMessage = null;
  }

  saveEditedMessage(id: string, message: string): void {
    this.channelService.updateAnswer(id, message).then(() => {
      this.editMessageId = null;
      this.temporaryMessage = null;
    });
  }

  addEditEmoji(event: any): void {
    const emoji = event.emoji.native;

    const group = this.groupedChannelAnswers().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    );

    if (group) {
      const message = group.messages.find(msg => msg.id === this.editMessageId);

      if (message) {
        message.message += emoji;
      }
    }
  }

  toggleEditEmojis(): void {
    this.showEditEmojis = !this.showEditEmojis;
  }

  saveChannelAnswer(): void {
    if (this.newMessage != '') {
      this.channelService.saveChannelAnswer({
        message: this.newMessage,
        senderName: this.getLoggedUser()!.firstName + ' ' + this.getLoggedUser()!.lastName || '',
        senderId: this.loggedUser()!.uid || '',
        timestamp: Timestamp.now()
      }).then(() => {
        this.newMessage = '';
        this.triggerScrollToBottom();
      });
    }
  }

  avatarsCache: Map<string, Observable<string | undefined>> = new Map();

  getUserAvatar(senderId: string): Observable<string | undefined> {
    if (!this.avatarsCache.has(senderId)) {
      const ref = doc(this.firestore, `users/${senderId}`);
      const avatar$ = from(getDoc(ref)).pipe(
        map((docSnap) => {
          const data = docSnap.data() as Users;
          return data?.avatar;
        }),
        shareReplay(1)
      );
      this.avatarsCache.set(senderId, avatar$);
    }
    return this.avatarsCache.get(senderId)!;
  }

  closeThread() {
    this.channelService.changeThreadVisibility();
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

    this.channelService.toggleAnswerReaction(messageId, userName, reaction);

    this.activeEmojiPickerMessageId = null;
  }

  getLoggedUser() {
    const userId = this.loggedUser()!.uid;
    if (!userId) {
      return null;
    }

    return this.users().find(user => user.userId === userId) || null;
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

  toggleEmojiPicker(messageId: string): void {
    this.activeEmojiPickerMessageId =
      this.activeEmojiPickerMessageId === messageId ? null : messageId;
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

  loadReactions(messageId: string): void {
    const reactionsCollection = collection(this.firestore, `channels/${this.activeChannel!.id}/messages/${this.channelService.activeAnswer()}/answers/${messageId}/reactions`);

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
      const group = this.groupedChannelAnswers().find((g) =>
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
}
