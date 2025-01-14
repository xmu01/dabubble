import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../shared/services/users.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogNewChannelComponent } from './dialog-new-channel/dialog-new-channel.component';
import { ChannelService } from '../../shared/services/channel.service';
import { Timestamp } from '@angular/fire/firestore';
import { AddMessageService } from '../../shared/services/add-message.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatSidenavModule, MatButtonModule, MatExpansionModule, MainContentComponent, MatIconModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
  channelsOpenState = true;
  messagesOpenState = true;
  menuOpenState = true;

  changeMenuOpenState(): void {
    this.menuOpenState = !this.menuOpenState;
  }

  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private addMessageService = inject(AddMessageService);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  channels = this.channelService.channels;
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.channelService.activeChannel;
  addMessage = this.addMessageService.addMessage;
  isMobileView: boolean = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.initializeBreakpointObserver();
  }

  ngOnInit() {  
    this.firestoreService.loadUsers(this.loggedUser()?.uid);
    this.channelService.loadChannels();
  }

  private initializeBreakpointObserver(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape, '(max-width: 1024px)'])
      .subscribe((result) => {
        this.isMobileView = result.matches;
        this.changeDetectorRef.markForCheck(); // Aktualisiert die Ansicht, wenn sich der Breakpoint ändert
      });
  }

  getId(userId: string, drawer: any) {
    this.addMessageService.addMessage.set(false);
    this.channelService.activeChannel.set(null);
    this.firestoreService.loadUser(userId);
    if (this.isMobileView) {
      drawer.toggle();
    }
  }

  getChannel(channelId: string, drawer: any) {
    this.addMessageService.addMessage.set(false);
    this.firestoreService.activeUser.set(null);
    this.channelService.loadChannel(channelId);
    if (this.isMobileView) {
      drawer.toggle();
    }
  }

  name: string = '';
  description: string = '';

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogNewChannelComponent, {
      data: { name: this.name, description: this.description },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Dialog geschlossen mit Daten:', result);

        // Finde den aktuellen User anhand der UID
        const currentUser = this.users().find(
          (user) => user.userId === this.loggedUser()?.uid
        );

        // Erstelle den neuen Channel mit Namen und Beschreibung
        this.channelService.saveNewChannel({
          name: result.name,
          description: result.description || '',
          created_by: currentUser
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : 'Unbekannt',
          created_at: Timestamp.fromDate(new Date()),
          members: [this.loggedUser()?.uid || ''],
        });
      }
    });
  }

  setAddMessage(drawer?: any) {
    this.addMessageService.setAddMessage();
    if(this.isMobileView){
      drawer.toggle();
    }
  }

  backToMenu(drawer: any) {
    this.addMessageService.addMessage.set(false);
    this.firestoreService.activeUser.set(null);
    this.channelService.activeChannel.set(null);
    drawer.toggle()
  }
}
