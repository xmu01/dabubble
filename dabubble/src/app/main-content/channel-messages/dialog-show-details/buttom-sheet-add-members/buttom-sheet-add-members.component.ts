import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ChannelService } from '../../../../../shared/services/channel.service';
import { UsersService } from '../../../../../shared/services/users.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { Users } from '../../../../../shared/interfaces/users';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { map, Observable, startWith } from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-buttom-sheet-add-members',
  standalone: true,
  imports: [    
    CommonModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      ReactiveFormsModule,
      MatDialogTitle, 
      MatDialogContent, 
      MatDialogActions,
      MatAutocompleteModule,
      MatChipsModule,
      AsyncPipe
    ],
  templateUrl: './buttom-sheet-add-members.component.html',
  styleUrl: './buttom-sheet-add-members.component.scss'
})
export class ButtomSheetAddMembersComponent {
  private _bottomSheetRef = inject(MatBottomSheetRef<ButtomSheetAddMembersComponent>);
  channelService = inject(ChannelService);
  userService = inject(UsersService);
  authService = inject(AuthService);  

  channel = this.channelService.activeChannel();
  loggedUser = this.authService.getLoggedInUser()?.uid;

  users = this.userService.users();
  usersControl = new FormControl<Users[]>([]);
  separatorKeysCodes: number[] = [ENTER, COMMA];
  userCtrl = new FormControl('');
  filteredUsers: Observable<Users[]>;
  selectedUsers: Users[] = [];

  @ViewChild('userInput') userInput?: ElementRef<HTMLInputElement>;

  announcer = inject(LiveAnnouncer);

  constructor(
  ) {
    this.filteredUsers = this.userCtrl.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => this._filter(value || '')) // Filter auch bei leerem Wert
    );
  }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
      const user = this.users.find(
        (u) => `${u.firstName} ${u.lastName}` === event.option.viewValue
      );
    
      if (user && !this.selectedUsers.includes(user)) {
        this.selectedUsers.push(user);
      }
    
      // Reset input
      this.userInput!.nativeElement.value = '';
      this.userCtrl.setValue('');
    }
    
    remove(user: Users): void {
      const index = this.selectedUsers.indexOf(user);
    
      if (index >= 0) {
        this.selectedUsers.splice(index, 1);
        this.announcer.announce(`Removed ${user.firstName} ${user.lastName}`);
      }
    
      // Trigger neues Filtering
      this.userCtrl.setValue(this.userCtrl.value || '');
    }
    
    onAddMembers(): void {
      const userIds = this.selectedUsers.map((user) => user.userId); // Extrahiere die Benutzer-IDs
      if (userIds.length) {
        this.channelService.addMembers(userIds).then(() => {
          console.log('Mitglieder erfolgreich hinzugefügt');
          this._bottomSheetRef.dismiss();
        }).catch((error) => {
          console.error('Fehler beim Hinzufügen der Mitglieder:', error);
        });
      }
    }
      
    
    add(event: MatChipInputEvent): void {
      const value = (event.value || '').trim();
    
      if (value) {
        const user = this.users.find(
          (u) => `${u.firstName} ${u.lastName}`.toLowerCase() === value.toLowerCase()
        );
        if (user && !this.selectedUsers.includes(user)) {
          this.selectedUsers.push(user);
        }
      }
    
      // Clear the input value
      event.chipInput!.clear();
      this.userCtrl.setValue('');
    }
    
  
    private _filter(value: string): Users[] {
      const filterValue = value.toLowerCase();
    
      // Hole die Mitglieder des aktiven Channels
      const channelMembers = this.channel?.members || [];
    
      // Filtere Benutzer, die entweder bereits Mitglieder sind oder schon ausgewählt wurden
      return this.users.filter(
        (user) =>
          !this.selectedUsers.includes(user) && // Noch nicht in `selectedUsers`
          !channelMembers.includes(user.userId) && // Noch nicht in `members` des Channels
          (user.firstName.toLowerCase().includes(filterValue) ||
            user.lastName.toLowerCase().includes(filterValue)) // Name passt zur Eingabe
      );
    }
  
    onAutocompleteOpened(): void {
      // Setze den aktuellen Wert erneut, um die Filterung zu triggern
      this.userCtrl.setValue(this.userCtrl.value || '');
    }
  
    areAllUsersAdded(): boolean {
      const channelMembers = this.channel?.members || [];
      return this.users.every((user) => channelMembers.includes(user.userId));
    }
}