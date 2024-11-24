import { Component, inject, effect, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { CommonModule } from '@angular/common';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule, MatInputModule, FormsModule, CommonModule, 
    MatFormFieldModule, MatInputModule, MatMenuModule
  ],
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
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  onInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const value = input.value;

    if (value.includes('@')) {
      this.menuTrigger.openMenu();
    } else {
      this.menuTrigger.closeMenu();
    }
  }

  toggleMenu() {
    this.menuTrigger.toggleMenu();
  }

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
