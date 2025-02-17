import { ChangeDetectorRef, Component, effect, ElementRef, HostListener, inject, Renderer2, signal, ViewChild, viewChild } from '@angular/core';
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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DomSanitizer } from '@angular/platform-browser';
import { MentionLinkPipe } from '../../../../shared/pipes/mention-link.pipe';

@Component({
  selector: 'app-direct-thread',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatMenuModule, PickerComponent, CommonModule, FormsModule, MentionLinkPipe],
  templateUrl: './direct-thread.component.html',
  styleUrl: './direct-thread.component.scss'
})
export class DirectThreadComponent {
  newMessage: string = '';
  firestore = inject(Firestore);
  auth = inject(AuthService);
  user = inject(UsersService);
  channelService = inject(ChannelService);
  private breakpointObserver = inject(BreakpointObserver);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);

  users = this.user.users;
  channels = this.channelService.channels;
  loggedUser = this.auth.userSignal;
  activeUser = this.user.activeUser;
  activeChannel = this.channelService.activeChannel;
  showEmojis = false;
  contentElement = viewChild<ElementRef<HTMLDivElement>>('scrollThread');
  groupedMessageAnswers = this.user.groupedMessageAnswers;
  today = signal(new Date().toISOString().split('T')[0]);
  hoveredMessageId: string | null = null;
  editMessageId: string | null = null;
  activeEmojiPickerMessageId: string | null = null;
  temporaryMessage: string | null = null;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  threadActive = this.user.showThread();
  showEditEmojis = false;
  isMobileView: boolean = false;
  openThreadMobile = this.user.openThreadMobile;
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

  constructor() {
    effect(() => {
      const messageId = this.user.activeAnswer();

      if (messageId) {
        this.user.loadMessageAnswers(messageId);
        this.newMessage = '';
        this.showEmojis = false;
        this.triggerScrollToBottom();
      }
      this.user.messageAnswersChanged();

    });

    effect(() => {
      this.groupedMessageAnswers().forEach((group) => {
        group.messages.forEach((message) => {
          this.loadReactions(message.id!);
          this.triggerScrollToBottom();
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

  startEditingMessage(messageId: string, message: string): void {
    this.editMessageId = messageId;
    this.temporaryMessage = message;
  }

  cancelEditing(): void {
    const message = this.groupedMessageAnswers().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    )?.messages.find(msg => msg.id === this.editMessageId);

    if (message) {
      message.message = this.temporaryMessage!;
    }

    this.editMessageId = null;
    this.temporaryMessage = null;
  }

  saveEditedMessage(id: string, message: string): void {
    this.user.updateAnswer(id, message).then(() => {
      this.editMessageId = null;
      this.temporaryMessage = null;
    });
  }

  addEditEmoji(event: any): void {
    const emoji = event.emoji.native;

    const group = this.groupedMessageAnswers().find(group =>
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

  saveMessageAnswer(): void {
    if (this.newMessage != '') {
      this.user.saveMessageAnswer({
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
    this.user.changeThreadVisibility();
    this.openThreadMobile.set(false);
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

    this.user.toggleAnswerReaction(messageId, userName, reaction);

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
    const reactionsCollection = collection(this.firestore, `messages/${this.user.activeAnswer()}/answers/${messageId}/reactions`);

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
      const group = this.groupedMessageAnswers().find((g) =>
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
