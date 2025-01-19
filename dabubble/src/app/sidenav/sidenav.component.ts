import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UsersService } from '../../shared/services/users.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogNewChannelComponent } from './dialog-new-channel/dialog-new-channel.component';
import { ChannelService } from '../../shared/services/channel.service';
import { Timestamp } from '@angular/fire/firestore';
import { AddMessageService } from '../../shared/services/add-message.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatSidenavModule, MatButtonModule, MatExpansionModule, MainContentComponent, MatIconModule, MatFormFieldModule, ReactiveFormsModule, MatAutocompleteModule, AsyncPipe, MatInputModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
  channelsOpenState = true;
  messagesOpenState = true;
  menuOpenState = true;
  myControl = new FormControl('');
  filteredOptions?: Observable<{ id: string; name: string; display: string; search: string; type: string }[]>;
  selectedChat: string = '';
  selectedType: string = '';
  selectedName: string = '';

  changeMenuOpenState(): void {
    this.menuOpenState = !this.menuOpenState;
  }

  private firestoreService = inject(UsersService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);
  private addMessageService = inject(AddMessageService);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  channels = this.channelService.channels;
  activeUser = this.firestoreService.activeUser;
  activeChannel = this.channelService.activeChannel;
  addMessage = this.addMessageService.addMessage;
  isMobileView: boolean = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef
  ) {
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

  ngOnInit() {
    this.firestoreService.loadUsers(this.loggedUser()?.uid);
    this.channelService.loadChannels();
  }

  openChat(drawer: any): void {
    if (this.selectedType == 'user') {
      this.getId(this.selectedChat, drawer);
        this.myControl.reset();
    } else {
        this.getChannel(this.selectedChat, drawer);
        this.myControl.reset();
    }
}

  private initializeBreakpointObserver(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape, '(max-width: 1024px)'])
      .subscribe((result) => {
        this.isMobileView = result.matches;
        this.changeDetectorRef.markForCheck(); // Aktualisiert die Ansicht, wenn sich der Breakpoint ändert
      });
  }

  getId(userId: string, drawer: any) {
    this.addMessageService.addMessage.set(false);
    this.channelService.activeChannel.set(null);
    this.firestoreService.loadUser(userId);
    if (this.isMobileView) {
      drawer.toggle();
    }
  }

  getChannel(channelId: string, drawer: any) {
    this.addMessageService.addMessage.set(false);
    this.firestoreService.activeUser.set(null);
    this.channelService.loadChannel(channelId);
    if (this.isMobileView) {
      drawer.toggle();
    }
  }

  name: string = '';
  description: string = '';

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogNewChannelComponent, {
      data: { name: this.name, description: this.description },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Dialog geschlossen mit Daten:', result);

        // Finde den aktuellen User anhand der UID
        const currentUser = this.users().find(
          (user) => user.userId === this.loggedUser()?.uid
        );

        // Erstelle den neuen Channel mit Namen und Beschreibung
        this.channelService.saveNewChannel({
          name: result.name,
          description: result.description || '',
          created_by: currentUser
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : 'Unbekannt',
          created_at: Timestamp.fromDate(new Date()),
          members: [this.loggedUser()?.uid || ''],
        });
      }
    });
  }

  setAddMessage(drawer?: any) {
    this.addMessageService.setAddMessage();
    if (this.isMobileView) {
      drawer.toggle();
    }
  }

  backToMenu(drawer: any) {
    this.addMessageService.addMessage.set(false);
    this.firestoreService.activeUser.set(null);
    this.channelService.activeChannel.set(null);
    drawer.toggle()
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
      ...this.channelService.channels().map(channel => ({
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
