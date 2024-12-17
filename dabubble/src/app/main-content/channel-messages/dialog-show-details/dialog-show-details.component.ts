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
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Channels } from '../../../../shared/interfaces/channels';
import { ChannelService } from '../../../../shared/services/channel.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../shared/services/auth.service';
import { UsersService } from '../../../../shared/services/users.service';

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
    CommonModule
  ],
  templateUrl: './dialog-show-details.component.html',
  styleUrl: './dialog-show-details.component.scss'
})
export class DialogShowDetailsComponent {
  channelService = inject(ChannelService);
  userService = inject(UsersService);
  authService = inject(AuthService);
  channel = this.channelService.activeChannel();

  constructor(
    public dialogRef: MatDialogRef<DialogShowDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Channels,
  ) {
    this.data = {
      members: this.channel!.members || [], 
      name: this.channel!.name || '',
      description: this.channel!.description || '',
      created_by: this.channel!.created_by || '',
    };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }


  isEditing = {
    name: false,
    description: false,
  };

  toggleEdit(field: 'name' | 'description', text: string): void {
    if (this.isEditing[field]) {
      this.channelService.updateChannel(field, text); // Speichere die Daten in Firestore
    }
    this.isEditing[field] = !this.isEditing[field];
  }


}
