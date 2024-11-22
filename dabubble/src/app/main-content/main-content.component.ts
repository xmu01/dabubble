import { Component, inject, effect, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule, MatInputModule, FormsModule, CommonModule],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class MainContentComponent {
  newMessage: string = '';
  messages = computed(() => this.usersService.messages()); // Signal for messages
  user = computed(() => this.usersService.selectedUserId() ? this.usersService.users().find(u => u.userId === this.usersService.selectedUserId()) : null);

  private usersService = inject(UsersService);

  constructor() {
    // Reactive effect for selected user ID changes
    effect(() => {
      const userId = this.usersService.selectedUserId();
      if (userId) {
        this.loadMessages(userId);
      }
    });
  }

  loadMessages(userId: string): void {
    // Messages are now reactive via the signal, no subscription needed
    console.log('Loading messages for user:', userId);
  }

  getMessage(): void {
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
