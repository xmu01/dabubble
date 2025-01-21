import { Component, computed, inject, Inject } from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Channels } from '../../../../shared/interfaces/channels';
import { ChannelService } from '../../../../shared/services/channel.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../shared/services/auth.service';
import { UsersService } from '../../../../shared/services/users.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ButtomSheetAddMembersComponent } from './buttom-sheet-add-members/buttom-sheet-add-members.component';
import { Users } from '../../../../shared/interfaces/users';
import { DialogProfileComponent } from '../../../dialog-profile/dialog-profile.component';

@Component({
  selector: 'app-dialog-show-details',
  standalone: true,
  imports: [MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dialog-show-details.component.html',
  styleUrl: './dialog-show-details.component.scss'
})
export class DialogShowDetailsComponent {
  channelService = inject(ChannelService);
  userService = inject(UsersService);
  authService = inject(AuthService);
  private _bottomSheet = inject(MatBottomSheet);
  public dialog = inject(MatDialog);

  channel = this.channelService.activeChannel();
  loggedUser = this.authService.getLoggedInUser()?.uid;
  channels = this.channelService.channels;
  channelExist = false;
  newMember = false;

  channelNameControl = new FormControl(this.data.name, [
    Validators.required,
    Validators.pattern('^[^\\s]+$') // Erlaubt nur ein Wort
  ]);

  constructor(
    public dialogRef: MatDialogRef<DialogShowDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Channels,
  ) {
    this.data = {
      members: this.channel!.members || [],
      name: this.channel!.name || '',
      description: this.channel!.description || '',
      created_at: this.channel!.created_at,
      created_by: this.channel!.created_by || '',
    };
  }

  openDialog(member: Users) {
    this.dialog.open(DialogProfileComponent, {
      data: member,
      height: 'auto'
    });
  }

  openBottomSheet(): void {
    this._bottomSheet.open(ButtomSheetAddMembersComponent);
  }

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

  isEditing = {
    name: false,
    description: false,
  };

  // toggleEdit(field: 'name' | 'description', text: string): void {
  //   if (this.isEditing[field]) {
  //     this.channelService.updateChannel(field, text); // Speichere die Daten in Firestore
  //   }
  //   this.isEditing[field] = !this.isEditing[field];
  // }
  toggleEdit(field: 'name' | 'description'): void {
    if (field === 'name') {
      if (!this.isEditing.name) {
        // Initialisierung des FormControls mit aktuellem Wert beim Bearbeiten
        this.channelNameControl = new FormControl(this.data.name, [
          Validators.required,
          Validators.pattern('^[^\\s]+$') // Nur ein Wort erlaubt
        ]);
      } else {
        this.saveChanges('name');
        this.channelExist = !this.channelExist;
      }
      this.isEditing.name = !this.isEditing.name;
    } else if (field === 'description') {
      this.isEditing.description = !this.isEditing.description;
    }
  }

  saveChanges(field: 'name' | 'description') {
    if (field === 'name' && this.channelNameControl.valid) {
      this.data.name = this.channelNameControl.value!; // Speichern des neuen Wertes
      this.channelService.updateChannel(field, this.channelNameControl.value!);
    }
  }

  checkChannelName() {
    const name = this.channelNameControl.value?.toLowerCase() || '';
      this.channelExist = this.channels().some(channel => channel.name.toLowerCase() === name);
  }

  isMember(): boolean {
    const userId = this.loggedUser;
    if (!userId || !this.channel) return false; // Falls kein Benutzer oder Kanal vorhanden ist
  
    return this.channel.members.includes(userId);
  }

  addMember(): void {
    const userId = this.loggedUser;
    if (!userId || !this.channel) return; // Stelle sicher, dass ein Kanal existiert
  
    if (!this.channel.members.includes(userId)) {
      this.channelService.addMembers([userId]);
      this.newMember = true;
    } else {
      console.log('User is already a member of this channel.');
    }
  }
}
