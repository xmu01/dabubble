import { Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogProfileComponent } from '../../dialog-profile/dialog-profile.component';
import { UsersService } from '../../../shared/services/users.service';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss'
})
export class BottomSheetComponent {
  private auth = inject(AuthService);
  private userService = inject(UsersService);
  private _bottomSheetRef = inject(MatBottomSheetRef<BottomSheetComponent>);
  public dialog = inject(MatDialog);

  user = this.auth.userSignal;
  users = this.userService.users;

  constructor() { }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

  logout() {
    this.auth.signOut();
    this._bottomSheetRef.dismiss();
  }

  openDialog() {   
      this.dialog.open(DialogProfileComponent, {
        data: this.getLoggedUser(),
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
