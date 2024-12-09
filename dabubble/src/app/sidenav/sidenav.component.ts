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

  users = this.firestoreService.users;
  channels = this.firestoreService.channels;

  mobileQuery: MediaQueryList;

  constructor(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 1024px)');
    this.mobileQuery.addEventListener('change', () => changeDetectorRef.detectChanges());
  }

  ngOnInit() {
    this.firestoreService.loadUsers();
    this.firestoreService.loadChannels();
  }

  getId(userId: string, drawer: any) {
    this.firestoreService.loadUser(userId);
    if(this.mobileQuery.matches) {
      drawer.toggle();
    }
  }

  getChannel(channelId: string, drawer: any) {
    this.firestoreService.loadChannel(channelId);
    if(this.mobileQuery.matches) {
      drawer.toggle();
    }
  }
}
