import { Component, Inject } from '@angular/core';
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
import { Channels } from '../../../shared/interfaces/channels';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  templateUrl: './dialog-new-channel.component.html',
  styleUrl: './dialog-new-channel.component.scss'
})
export class DialogNewChannelComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogNewChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Channels,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
