import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../shared/services/users.service';

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

  constructor() {}

  ngOnInit() {
    this.firestoreService.loadUsers();
    this.firestoreService.loadChannels();
  }

  getId(userId: string) {
    this.firestoreService.loadUser(userId);
  }

  getChannel(channelId: string) {
    this.firestoreService.loadChannel(channelId);
  }
}
