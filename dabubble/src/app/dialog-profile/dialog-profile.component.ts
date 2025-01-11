import { Component, Inject, inject } from '@angular/core';
import { UsersService } from '../../shared/services/users.service';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Users } from '../../shared/interfaces/users';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../shared/services/channel.service';

@Component({
  selector: 'app-dialog-profile',
  standalone: true,
  imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatIconModule, CommonModule, MatFormField, MatInputModule],
  templateUrl: './dialog-profile.component.html',
  styleUrl: './dialog-profile.component.scss'
})
export class DialogProfileComponent {
  private userService = inject(UsersService);
  private channelService = inject(ChannelService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<DialogProfileComponent>);

  activeUser = this.userService.activeUser;
  activeChannel = this.channelService.activeChannel;
  user = this.authService.userSignal;
  users = this.userService.users;
  isEditing = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Users) {

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getLoggedUser() {
    const user = this.user();
    if (!user) {
      return null; // Kein Benutzer eingeloggt
    }

    const userId = user.uid;

    return this.users().find(u => u.userId === userId) || null;
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  saveEditChanges() {
    this.userService.updateUser(this.data.firstName, this.data.lastName, this.data.email, this.data.userId);
    this.toggleEditMode();
  }

  setActiveUser() {
    this.activeChannel.set(null);
    this.activeUser.set(this.data);
    this.dialogRef.close();
  }
}
