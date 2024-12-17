import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../shared/services/users.service';
import { MediaMatcher } from '@angular/cdk/layout';
import { AuthService } from '../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogNewChannelComponent } from './dialog-new-channel/dialog-new-channel.component';
import { ChannelService } from '../../shared/services/channel.service';

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

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  channels = this.channelService.channels;

  mobileQuery: MediaQueryList;

  constructor(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher, public dialog: MatDialog) {
    this.mobileQuery = media.matchMedia('(max-width: 1024px)');
    this.mobileQuery.addEventListener('change', () => changeDetectorRef.detectChanges());
  }

  ngOnInit() {
    this.firestoreService.loadUsers();
    this.channelService.loadChannels();
  }

  getId(userId: string, drawer: any) {
    this.channelService.activeChannel.set(null);
    this.firestoreService.loadUser(userId);
    if (this.mobileQuery.matches) {
      drawer.toggle();
    }
  }

  getChannel(channelId: string, drawer: any) {   
    this.firestoreService.activeUser.set(null);
    this.channelService.loadChannel(channelId);
    if (this.mobileQuery.matches) {
      drawer.toggle();
    }
  }

  name: string = '';
  description: string = '';

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogNewChannelComponent, {
      data: { name: this.name, description: this.description },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog geschlossen mit Daten:', result);
        this.channelService.saveNewChannel({
          name: result.name,
          description: result.description || "",
          created_by: this.loggedUser()?.uid || "",
          members: [this.loggedUser()?.uid || ""]
        });
      }
    });
  }
}

