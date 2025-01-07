import { Component, inject, effect, signal, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../shared/services/auth.service';
import { Timestamp } from '@angular/fire/firestore';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { ChannelMessagesComponent } from './channel-messages/channel-messages.component';
import { ChannelService } from '../../shared/services/channel.service';
import { NewMessageComponent } from './new-message/new-message.component';
import { AddMessageService } from '../../shared/services/add-message.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';


@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatInputModule, FormsModule, CommonModule,
    MatFormFieldModule, MatInputModule, MatMenuModule, DirectMessagesComponent, ChannelMessagesComponent, NewMessageComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class MainContentComponent {
  newMessage: string = '';

  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private addMessageService = inject(AddMessageService);
  private breakpointObserver = inject(BreakpointObserver);
  private changeDetectorRef = inject(ChangeDetectorRef);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.channelService.activeChannel;
  groupedMessages = this.firestoreService.groupedMessages;
  groupedChannelMessages = this.channelService.groupedChannelMessages;
  addMessage = this.addMessageService.addMessage;
  today = signal(new Date().toISOString().split('T')[0]);
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  showEmojis = false;
  hoveredMessageId: string | null = null;
  contentElement = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  activeEmojiPickerMessageId: string | null = null;
  editMessageId: string | null = null;
  isMobileView: boolean = false;

  constructor() {
    this.initializeBreakpointObserver();

    if (!this.isMobileView) {
      this.channelService.loadChannel('uYr4Z1UxNJW1qVyRlvlX');
    }
  }

  private initializeBreakpointObserver(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape, '(max-width: 1024px)'])
      .subscribe((result) => {
        this.isMobileView = result.matches;
        this.changeDetectorRef.markForCheck();
      });
  }

}
