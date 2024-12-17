import { Component, computed, inject } from '@angular/core';
import { ChannelService } from '../../../../shared/services/channel.service';
import { UsersService } from '../../../../shared/services/users.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dialog-show-members',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './dialog-show-members.component.html',
  styleUrl: './dialog-show-members.component.scss'
})
export class DialogShowMembersComponent {
  channelService = inject(ChannelService);
  userService = inject(UsersService);
  authService = inject(AuthService);
  channel = this.channelService.activeChannel();
  loggedUser = this.authService.getLoggedInUser()?.uid;

    constructor(
      public dialogRef: MatDialogRef<DialogShowMembersComponent>,
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

  member = computed(() => {
    const members = this.channel!.members;
    if (!members) return []; // Kein aktiver Kanal oder keine Mitglieder

    // Avatare der Mitglieder filtern und zurückgeben
    return members
      .map(memberId => this.userService.users().find(user => user.userId === memberId))
      .sort((a, b) => {
        if (a!.userId === this.loggedUser) return -1; // Eingeloggter User nach oben
        if (b!.userId === this.loggedUser) return 1;
        return 0;
      });
  });
}
