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
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule, MatInputModule, FormsModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {
  newMessage: string = '';
  messages: { date: string; messages: Messages[] }[] = [];

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

  getTimeFromTimestamp(timestamp: Timestamp | Date): string {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;

    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  getFormattedDate(dateString: string): string {
    const [day, month, year] = dateString.split('.').map(Number);

    const inputDate = new Date(year, month - 1, day);

    const today = new Date();

    const isToday =
      today.getDate() === inputDate.getDate() &&
      today.getMonth() === inputDate.getMonth() &&
      today.getFullYear() === inputDate.getFullYear();

    return isToday ? 'Heute' : dateString;
}

  
  
}
