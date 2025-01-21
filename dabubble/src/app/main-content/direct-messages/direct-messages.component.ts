import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, Renderer2, signal, ViewChild, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../../shared/services/users.service';
import { AuthService } from '../../../shared/services/auth.service';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DirectThreadComponent } from './direct-thread/direct-thread.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { DialogProfileComponent } from '../../dialog-profile/dialog-profile.component';
import { MentionLinkPipe } from '../../../shared/pipes/mention-link.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { ChannelService } from '../../../shared/services/channel.service';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [MatCardModule, MatIconModule, FormsModule, CommonModule, PickerComponent, MatMenuModule, MatTooltipModule, DirectThreadComponent, MentionLinkPipe],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss'
})
export class DirectMessagesComponent implements AfterViewInit {
  private firestore = inject(Firestore);
  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  private changeDetectorRef = inject(ChangeDetectorRef);
  public dialog = inject(MatDialog)
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);

  activeUser = this.firestoreService.activeUser;
  activeChannel = this.channelService.activeChannel;
  users = this.firestoreService.users;
  channels = this.channelService.channels;
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
  showEditEmojis = false;
  temporaryMessage: string | null = null;
  openThread = this.firestoreService.showThread;
  openThreadMobile = this.firestoreService.openThreadMobile;
  isMobileView: boolean = false;
  menuOpen: boolean = false;
  inputTrigger = true;

  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;
  @ViewChild('inputFocus') inputFocus!: ElementRef;


  ngAfterViewInit() {
    if (this.messageContainer) {
      this.renderer.listen(this.messageContainer.nativeElement, 'click', (event: Event) => {
        const target = event.target as HTMLElement;

        // Behandlung für @Erwähnungen
        if (target && target.classList.contains('mention-link')) {
          const firstName = target.getAttribute('data-firstname');
          const lastName = target.getAttribute('data-lastname');

          if (firstName && lastName) {
            this.searchUser(firstName, lastName);
          } else {
            console.error('FirstName oder LastName nicht gefunden.');
          }
        }

        // Behandlung für #Hashtags
        if (target && target.classList.contains('hashtag-link')) {
          const name = target.getAttribute('data-name');

          if (name) {
            this.searchHashtag(name);
          } else {
            console.error('Hashtag-Name nicht gefunden.');
          }
        }
      });
    } else {
      console.error('Element #messageContainer nicht gefunden.');
    }

    if (this.inputFocus) {
      this.inputFocus.nativeElement.focus();
    }
  }

  searchUser(firstName: string, lastName: string): void {
    // Benutzer anhand Vor- und Nachname suchen
    const foundUser = this.users().find(
      (user) => user.firstName === firstName && user.lastName === lastName
    );

    if (foundUser) {
      console.log(`Benutzer gefunden: ${foundUser.firstName} ${foundUser.lastName}, ID: ${foundUser.userId}`);
      this.activeChannel.set(null);
      this.activeUser.set(foundUser);
    } else {
      console.warn('Benutzer nicht gefunden');
    }
  }

  searchHashtag(name: string): void {
    const foundChannel = this.channels().find(
      (channel) => channel.name === name
    );
    if (foundChannel) {
      console.log(`Benutzer gefunden: ${foundChannel.name}, ID: ${foundChannel.id}`);
      this.activeUser.set(null);
      this.activeChannel.set(foundChannel);
    } else {
      console.warn('Benutzer nicht gefunden');
    }
  }

  loadThread(messageId: string) {
    if (!this.firestoreService.showThread()) {
      this.firestoreService.changeThreadVisibility();
    }
    this.firestoreService.activeAnswer.set(messageId);
    if (this.isMobileView) {
      this.openThreadMobile.set(true);
    }
  }

  openDialog() {
    this.dialog.open(DialogProfileComponent, {
      data: this.activeUser(),
    });
  }


  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Gibt das Datum im Format YYYY-MM-DD zurück
  }

  constructor() {
    effect(() => {
      const activeId = this.firestoreService.activeUser()?.userId;

      if (activeId && this.loggedUser()) {
        this.firestoreService.loadMessagePrivateChat(activeId, this.loggedUser()!.uid);
        this.newMessage = '';
        this.showEmojis = false;
        this.triggerScrollToBottom();
      }

      this.firestoreService.messageChanged();
      if (this.inputFocus) {
        this.inputFocus.nativeElement.focus();
      }
    });

    effect(() => {
      this.groupedMessages().forEach((group) => {
        group.messages.forEach((message) => {
          this.loadReactions(message.id!);
          this.loadAnswersCountAndLastTime(message.id!);
        });
      });
    });

    this.initializeBreakpointObserver();

  }

  private initializeBreakpointObserver(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape, '(max-width: 1024px)'])
      .subscribe((result) => {
        this.isMobileView = result.matches;
        this.changeDetectorRef.markForCheck(); // Aktualisiert die Ansicht, wenn sich der Breakpoint ändert
      });
  }

  loadAnswersCountAndLastTime(messageId: string): void {
    const answersCollection = collection(this.firestore, `messages/${messageId}/answers`);

    onSnapshot(answersCollection, (querySnapshot) => {
      let answersCount = 0;
      let lastAnswerTime: Date | null = null;

      querySnapshot.forEach((doc) => {
        const { timestamp } = doc.data();

        answersCount++;
        const answerTime = timestamp?.toDate(); // Firebase-Timestamp in Date umwandeln
        if (answerTime && (!lastAnswerTime || answerTime > lastAnswerTime)) {
          lastAnswerTime = answerTime; // Neueste Antwortzeit aktualisieren         
        }
      });

      // Nachricht mit den Antworten-Infos erweitern
      const group = this.groupedMessages().find((g) =>
        g.messages.some((msg) => msg.id === messageId)
      );

      if (group) {
        const message = group.messages.find((msg) => msg.id === messageId);

        if (message) {
          message.answersCount = answersCount;
          message.lastAnswerTime = lastAnswerTime;
        }
      }
    });
  }

  setHoveredMessageId(messageId: string | undefined): void {
    if (messageId && !this.menuOpen) {
      this.hoveredMessageId = messageId;
    }
  }

  clearHoveredMessageId(messageId: string | undefined, event: MouseEvent): void {
    const target = event.relatedTarget as HTMLElement | null;

    if (!this.menuOpen && (!target || !target.closest('.message-container'))) {
      this.hoveredMessageId = null;
    }
  }

  addEmoji(event: any): void {
    this.newMessage += event.emoji.native;
  }

  addEditEmoji(event: any): void {
    // Emoji hinzufügen
    const emoji = event.emoji.native;

    // Nachricht anhand der `editMessageId` finden und aktualisieren
    const group = this.groupedMessages().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    );

    if (group) {
      const message = group.messages.find(msg => msg.id === this.editMessageId);

      if (message) {
        // Emoji direkt zur Nachricht hinzufügen
        message.message += emoji;
      }
    }
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

  // Scroll functions
  private triggerScrollToBottom() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 250);
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

  startEditingMessage(messageId: string, message: string): void {
    this.editMessageId = messageId;
    this.temporaryMessage = message;
  }

  toggleEditMenu(): void {
    this.menuOpen = !this.menuOpen;
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
    if (this.showEditEmojis) {
      this.toggleEditEmojis();
    }
  }

  saveEditedMessage(id: string, message: string): void {
    this.firestoreService.updateMessage(id, message).then(() => {
      this.editMessageId = null;
      this.temporaryMessage = null;
    });
  }

}
