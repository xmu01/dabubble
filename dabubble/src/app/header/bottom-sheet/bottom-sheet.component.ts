import { Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss'
})
export class BottomSheetComponent {
  private auth = inject(AuthService);
  private _bottomSheetRef = inject(MatBottomSheetRef<BottomSheetComponent>);

  constructor() { }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

  logout() {
    this.auth.signOut();
    this._bottomSheetRef.dismiss();
  }
}
