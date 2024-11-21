import { Component, computed, inject, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../shared/services/users.service';
import { Users } from '../../shared/interfaces/users';
import { Messages } from '../../shared/interfaces/messages';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule ,MatCardModule, MatSidenavModule, MatButtonModule, MatExpansionModule, MainContentComponent, MatIconModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {
  channelsOpenState = true;
  messagesOpenState = true;
  menuOpenState = true;

  private usersService = inject(UsersService);

  users = computed(() => this.usersService.users());
  messages: Messages[] = [];

  ngOnInit(): void {
    // this.usersService.users$.subscribe((users) => {
    //   this.users = users;
    // });

    this.usersService.messages$.subscribe((messages) => {
      this.messages = messages;
    });

    this.usersService.users;

  }

  changeMenuOpenState() {
    this.menuOpenState = !this.menuOpenState;
  }


  selectUser(userId: string): void {
    this.usersService.setSelectedUserId(userId);
  }
}
