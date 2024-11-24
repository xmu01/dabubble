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
import { AuthService } from '../../shared/services/auth.service';

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
  private auth = inject(AuthService);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  activeUser = this.firestoreService.activeUser;
  groupedMessages = this.firestoreService.groupedMessages;
  today = signal(new Date().toISOString().split('T')[0]); // Heutiges Datum im Format "yyyy-MM-dd"
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;


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

  addToMessage(selectedItem: string): void {
    // Fügt den ausgewählten Punkt zum Text in der Textarea hinzu
    this.newMessage += ` ${selectedItem}`;
  }

  constructor() {
    effect(() => {
      const activeId = this.firestoreService.activeUser()?.userId;
      if (activeId) {
        this.firestoreService.loadMessages(activeId);
        this.scrollToBottom();
      }
    });
  }

  ngOnInit() {
    this.firestoreService.loadUsers();
  }

  getLoggedUser() {
    const userId = this.loggedUser()!.uid;
    if (!userId) {
      return null; // Kein Benutzer eingeloggt
    }
  
    return this.users().find(user => user.userId === userId) || null;
  }

  getMessage(): void {
    console.log(this.newMessage);
    this.firestoreService.saveMessage(this.activeUser()!.userId, {
      message: this.newMessage,
      firstName: this.getLoggedUser()!.firstName,
      lastName: this.getLoggedUser()!.lastName,
      userId: this.loggedUser()?.uid!,
      reaction: '',
      imgLink: '',
    });
    this.newMessage = '';
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = this.scrollContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }, 100);
  }
}
