import { Component, Inject, inject } from '@angular/core';
import { UsersService } from '../../shared/services/users.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Users } from '../../shared/interfaces/users';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-dialog-profile',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './dialog-profile.component.html',
  styleUrl: './dialog-profile.component.scss'
})
export class DialogProfileComponent {
  private userService = inject(UsersService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<DialogProfileComponent>);

  activeUser = this.userService.activeUser;
  user = this.authService.userSignal;
  users = this.userService.users;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Users) {
    console.log(this.activeUser());
    console.log(this.getLoggedUser());
    
    
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

  
}
