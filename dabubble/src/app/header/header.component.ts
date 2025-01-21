import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, ViewChild, viewChild, } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, Observable, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatInputModule, MatIconModule, FormsModule, MatFormFieldModule,
    MatExpansionModule, MatDialogModule, MatMenuModule, MatButtonModule, MatButtonModule, MatBottomSheetModule, MatAutocompleteModule, AsyncPipe, ReactiveFormsModule
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
  channels = this.firestoreServiceChannel.channels; 
  loggedUser = this.authService.getLoggedInUser();
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.firestoreServiceChannel.activeChannel;
  newMessage: string = '';
  isMobileView: boolean = false;
  addMessage = this.addMessageService.addMessage;
  myControl = new FormControl('');
  filteredOptions?: Observable<{ id: string; name: string; display: string; search: string; type: string }[]>;
  selectedChat: string = '';
  selectedType: string = '';
  selectedName: string = '';
  
  
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild('menuTriggerChannel') menuTriggerChannel!: MatMenuTrigger;

  constructor() {
    this.initializeBreakpointObserver();   

        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(''),
          map(value => this._filter(value || '')),
        );
    
        this.myControl.valueChanges.subscribe(value => {
          const selectedItem = this._filter(value || '').find(
            item => item.display === value
          );
          if (selectedItem) {
            this.selectedChat = selectedItem.id;
            this.selectedType = selectedItem.type;
            if (this.selectedType == 'user') {
              this.selectedName = selectedItem.name
            }
          }
        });
  }

    openChat(): void {
        if (this.selectedType == 'user') {
            this.firestoreService.loadUser(this.selectedChat);
            this.myControl.reset();
        } else {
            this.firestoreServiceChannel.loadChannel(this.selectedChat);
            this.myControl.reset();
        }
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
        // position: {
        //   top: '120px',
        //   right: '40px',
        // },
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
    sessionStorage.removeItem('user');
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

  private _filter(value: string): { id: string; name: string; display: string; search: string; type: string }[] {
    const filterValue = value.toLowerCase();

    const searchableList: { id: string; name: string; display: string; search: string; type: string }[] = [
      ...this.firestoreService.users().map(user => ({
        id: user.userId ?? '',
        name: `${user.firstName} ${user.lastName}`,
        display: `@${user.firstName} ${user.lastName}`,
        search: `@${user.firstName} ${user.lastName} ${user.email}`,
        type: 'user'
      })),
      ...this.firestoreServiceChannel.channels().map(channel => ({
        id: channel.id ?? '',
        name: channel.name,
        display: `#${channel.name}`,
        search: `#${channel.name}`,
        type: 'channel'
      })),
    ];

    return searchableList.filter(item =>
      item.search.toLowerCase().includes(filterValue)
    );
  }


}