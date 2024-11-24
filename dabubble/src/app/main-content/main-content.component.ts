import { Component, inject, effect, computed, signal, ViewChild, ElementRef, ChangeDetectorRef, OnInit, OnChanges, AfterViewInit } from '@angular/core';
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
export class MainContentComponent implements AfterViewInit {
  newMessage: string = '';

  private firestoreService = inject(UsersService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  users = this.firestoreService.users;
  loggedUser = this.auth.userSignal;
  activeUser = this.firestoreService.activeUser;
  groupedMessages = this.firestoreService.groupedMessages;
  today = signal(new Date().toISOString().split('T')[0]); 
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  private scrollAtBottom = signal(true);



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
        if (this.scrollAtBottom()) {
          this.scrollToBottom();
        }
      }
    });
  }

    ngAfterViewInit() {
    const container = this.scrollContainer.nativeElement;

    // Scroll-Event-Listener, um den Zustand zu überwachen
    container.addEventListener('scroll', () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
      this.scrollAtBottom.set(isAtBottom);
    });
  }

  getLoggedUser() {
    const userId = this.loggedUser()!.uid;
    if (!userId) {
      return null; 
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
    }).then(() => {
      this.newMessage = '';
      this.scrollToBottom();
    });
  }
  
  scrollToBottom(): void {
    const container = this.scrollContainer.nativeElement;
  
    // Sicherstellen, dass DOM-Änderungen abgeschlossen sind
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 150);
  } 
}
