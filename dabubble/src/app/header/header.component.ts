import {ChangeDetectionStrategy, Component, inject, ViewChild, viewChild, } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDialogModule} from '@angular/material/dialog';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';
import { UsersService } from '../../shared/services/users.service';
import { ChannelService } from '../../shared/services/channel.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatInputModule, MatIconModule,FormsModule, MatFormFieldModule,
    MatExpansionModule, MatDialogModule, MatMenuModule, MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private firestoreService = inject(UsersService);
  private firestoreServiceChannel = inject(ChannelService);

  // Use the signal directly without wrapping it in additional logic
  user = this.authService.userSignal;
  users = this.firestoreService.users;
  channels = this.firestoreServiceChannel.channels; // Add this signal

  newMessage: string = '';
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  @ViewChild('menuTriggerChannel') menuTriggerChannel!: MatMenuTrigger;

  onInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const value = input.value;

    if (value.includes('@')) {
      this.menuTrigger.openMenu();
    } else {
      this.menuTrigger.closeMenu();
    }

    if (value.includes('#')) {
      this.menuTriggerChannel.openMenu();
    } else {
      this.menuTriggerChannel.closeMenu();
    }
  }

  toggleMenu() {
    this.menuTrigger.toggleMenu();
  }

  addToMessage(selectedItem: string): void {
    this.newMessage += ` ${selectedItem}`;
  }


  async signOut() {
    await this.firestoreService.updateUserStatus(this.getLoggedUser()!.userId, 'offline')
    await this.authService.signOut().catch((error) => {          
      console.error('Error during sign-out:', error);
    });
  }

  getLoggedUser() {
    const user = this.user();
    if (!user) {
      return null; // Kein Benutzer eingeloggt
    }
  
    const userId = user.uid;
    
    return this.users().find(u => u.userId === userId) || null;
  }
}
