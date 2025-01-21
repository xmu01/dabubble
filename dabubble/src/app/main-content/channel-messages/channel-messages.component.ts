import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, Renderer2, signal, ViewChild, viewChild } from '@angular/core';
import { collection, doc, Firestore, getDoc, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UsersService } from '../../../shared/services/users.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ThreadComponent } from '../../thread/thread.component';
import { ChannelService } from '../../../shared/services/channel.service';
import { Users } from '../../../shared/interfaces/users';
import { from, map, Observable, shareReplay } from 'rxjs';
import { DialogShowDetailsComponent } from './dialog-show-details/dialog-show-details.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogShowMembersComponent } from './dialog-show-members/dialog-show-members.component';
import { DialogAddMembersComponent } from './dialog-add-members/dialog-add-members.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MentionLinkPipe } from '../../../shared/pipes/mention-link.pipe';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatMenuModule, PickerComponent, CommonModule, FormsModule, ThreadComponent, MentionLinkPipe],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent implements AfterViewInit {
  newMessage: string = '';
  private firestore = inject(Firestore);
  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);

  users = this.firestoreService.users;
  channels = this.channelService.channels;
  loggedUser = this.auth.userSignal;
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.channelService.activeChannel;
  groupedMessages = this.firestoreService.groupedMessages;
  groupedChannelMessages = this.channelService.groupedChannelMessages;
  today = signal(new Date().toISOString().split('T')[0]);
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  showEmojis = false;
  hoveredMessageId: string | null = null;
  contentElement = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  activeEmojiPickerMessageId: string | null = null;
  editMessageId: string | null = null;
  temporaryMessage: string | null = null;
  showEditEmojis = false;
  openThread = this.channelService.showThread;
  isMobileView: boolean = false;
  openThreadMobile = this.channelService.openThreadMobile;
  menuOpen: boolean = false;
  inputTrigger = true;

  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;

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

  constructor(public dialog: MatDialog) {

    effect(() => {
      const channelId = this.channelService.activeChannel()?.id;

      if (channelId) {
        this.channelService.loadMessageChannelChat(channelId);
        this.newMessage = '';
        this.showEmojis = false;
        this.triggerScrollToBottom();
      }
      this.channelService.channelMessageChanged();

    });

    effect(() => {
      this.groupedChannelMessages().forEach((group) => {
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

  loadThread(messageId: string) {
    if (!this.channelService.showThread()) {
      this.channelService.changeThreadVisibility();
    }
    this.channelService.activeAnswer.set(messageId);
    if (this.isMobileView) {
      this.openThreadMobile.set(true);
    }
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Gibt das Datum im Format YYYY-MM-DD zurück
  }

  startEditingMessage(messageId: string, message: string): void {
    this.editMessageId = messageId;
    this.temporaryMessage = message;
  }
  
  toggleEditMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  cancelEditing(): void {
    const message = this.groupedChannelMessages().find(group =>
      group.messages.some(msg => msg.id === this.editMessageId)
    )?.messages.find(msg => msg.id === this.editMessageId);

    if (message) {
      message.message = this.temporaryMessage!;
    }

    this.editMessageId = null;
    this.temporaryMessage = null;
  }

  saveEditedMessage(id: string, message: string): void {
    this.channelService.updateMessage(id, message).then(() => {
      this.editMessageId = null;
      this.temporaryMessage = null;
    });
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

  memberAvatars = computed(() => {
    const members = this.activeChannel()?.members;
    if (!members) return []; // Kein aktiver Kanal oder keine Mitglieder

    // Avatare der Mitglieder filtern und zurückgeben
    return members
      .map(memberId => this.users().find(user => user.userId === memberId)?.avatar)
      .filter((avatar): avatar is string => !!avatar); // Typ-Filter für `string[]`
  });

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

  saveChannelMessage(id: string): void {
    if (this.newMessage != '') {
      this.channelService.saveChannelMessage({
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

    this.channelService.toggleReaction(messageId, userName, reaction);

    this.activeEmojiPickerMessageId = null;
  }

  /**
   * Lädt die Reaktionen einer Nachricht und gruppiert sie.
   */
  loadReactions(messageId: string): void {
    const reactionsCollection = collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${messageId}/reactions`);

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
      const group = this.groupedChannelMessages().find((g) =>
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

  loadAnswersCountAndLastTime(messageId: string): void {
    const answersCollection = collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${messageId}/answers`);

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
      const group = this.groupedChannelMessages().find((g) =>
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

  name: string = '';
  description: string = '';

  openDetailsDialog(): void {
    const dialogRef = this.dialog.open(DialogShowDetailsComponent, {
      data: { name: this.name, description: this.description },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channelService.removeMembers(this.auth.getLoggedInUser()!.uid);
      }
    });
  }

  openMembersDialog() {
    if (!this.isMobileView) {
      this.dialog.open(DialogShowMembersComponent, {
        position: {
          top: '240px',
          right: '150px',
        },
      });
    } else {
      this.dialog.open(DialogShowMembersComponent);
    }
  }

  openAddMemberDialog() {
    if (!this.isMobileView) {
      this.dialog.open(DialogAddMembersComponent, {
        position: {
          top: '240px',
          right: '100px',
        },
      });
    } else {
      this.dialog.open(DialogAddMembersComponent);
    }
  }
}
