import { Component, inject, effect, computed, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
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

  private firestoreService = inject(UsersService);

  users = this.firestoreService.users;
  activeUser = this.firestoreService.activeUser;
  groupedMessages = this.firestoreService.groupedMessages;
  today = signal(new Date().toISOString().split('T')[0]); // Heutiges Datum im Format "yyyy-MM-dd"

  constructor() {
    effect(() => {
      const activeId = this.firestoreService.activeUser()?.userId;
      if (activeId) {
        this.firestoreService.loadMessages(activeId);
      }
    });
  }

  ngOnInit() {
    this.firestoreService.loadUsers();
  }

  getMessage(): void {
    console.log(this.newMessage);
    this.newMessage = '';
  }

}
