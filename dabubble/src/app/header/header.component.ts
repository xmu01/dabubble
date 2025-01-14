import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, ViewChild, viewChild, } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';
import { UsersService } from '../../shared/services/users.service';
import { ChannelService } from '../../shared/services/channel.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AddMessageService } from '../../shared/services/add-message.service';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { DialogProfileComponent } from '../dialog-profile/dialog-profile.component';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatInputModule, MatIconModule, FormsModule, MatFormFieldModule,
    MatExpansionModule, MatDialogModule, MatMenuModule, MatButtonModule, MatButtonModule, MatBottomSheetModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private firestoreService = inject(UsersService);
  private firestoreServiceChannel = inject(ChannelService);
  private addMessageService = inject(AddMessageService);
  private breakpointObserver = inject(BreakpointObserver);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private _bottomSheet = inject(MatBottomSheet);
  public dialog = inject(MatDialog)

  // Use the signal directly without wrapping it in additional logic
  user = this.authService.userSignal;
  users = this.firestoreService.users;
  channels = this.firestoreServiceChannel.channels; // Add this signal
  loggedUser = this.authService.getLoggedInUser();
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.firestoreServiceChannel.activeChannel;
  newMessage: string = '';
  isMobileView: boolean = false;
  addMessage = this.addMessageService.addMessage;
  
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild('menuTriggerChannel') menuTriggerChannel!: MatMenuTrigger;

  constructor() {
    this.initializeBreakpointObserver();   
  }

  private initializeBreakpointObserver(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape, '(max-width: 1024px)'])
      .subscribe((result) => {
        this.isMobileView = result.matches;
        this.changeDetectorRef.markForCheck();
      });
  }

  openDialog() {   
    if (!this.isMobileView) {
      this.dialog.open(DialogProfileComponent, {
        position: {
          top: '100px',
          right: '40px',
        },
        data: this.getLoggedUser(),
      });
    } 
  }

  openBottomSheet(): void {
    this._bottomSheet.open(BottomSheetComponent);
  }

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