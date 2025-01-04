import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ChannelService } from '../../../../shared/services/channel.service';
import { UsersService } from '../../../../shared/services/users.service';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-dialog-add-members',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './dialog-add-members.component.html',
  styleUrl: './dialog-add-members.component.scss'
})
export class DialogAddMembersComponent {
channelService = inject(ChannelService);
  userService = inject(UsersService);
  authService = inject(AuthService);
  channel = this.channelService.activeChannel();
  loggedUser = this.authService.getLoggedInUser()?.uid;

    constructor(
      public dialogRef: MatDialogRef<DialogAddMembersComponent>, public addDialogRef: MatDialog
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }

  openDialogAddMember() {
    this.dialogRef.close();
    this.addDialogRef.open(DialogAddMembersComponent, {
      position: {
        top: '240px',
        right: '100px',
      },
    });
  }
}
