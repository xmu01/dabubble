import { Component, inject, Inject } from '@angular/core';
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
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { Channels } from '../../../shared/interfaces/channels';
import { MatIconModule } from '@angular/material/icon';
import { ChannelService } from '../../../shared/services/channel.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-new-channel',
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
  templateUrl: './dialog-new-channel.component.html',
  styleUrl: './dialog-new-channel.component.scss'
})
export class DialogNewChannelComponent {
  private channelService = inject(ChannelService);

  // FormControl mit Validatoren für die Eingabe
  channelNameControl = new FormControl('', [
    Validators.required,
    Validators.pattern('^[^\\s]+$') // Erlaubt nur ein Wort
  ]);

  channels = this.channelService.channels;
  channelExist = false;

  constructor(
    public dialogRef: MatDialogRef<DialogNewChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Channels,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkChannelName() {
    const name = this.channelNameControl.value?.toLowerCase() || '';
    this.channelExist = this.channels().some(channel => channel.name.toLowerCase() === name);
  }
}
