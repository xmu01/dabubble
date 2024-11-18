import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Messages } from '../../shared/interfaces/messages';
import { UsersService } from '../../shared/services/users.service';
import { Users } from '../../shared/interfaces/users';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule, MatInputModule, FormsModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {
  newMessage: string = '';
  messages: Messages[] = [];

  private usersService = inject(UsersService);

  ngOnInit(): void {
    this.usersService.selectedUserId$.subscribe((userId) => {
      if (userId) {
        this.loadMessages(userId);
      }
    });
  }

  loadMessages(userId: string): void {
    this.usersService.getMessagesByUserId(userId).subscribe((messages) => {
      this.messages = messages;
    });
  }

  getMessage() {
    console.log(this.newMessage);
    this.newMessage = '';
  }

  getTimeFromTimestamp(timestamp: { toDate: () => Date }): string {
    const date = timestamp.toDate(); // Firestore-Timestamp in JavaScript Date umwandeln
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); // Uhrzeit extrahieren
  }

}
