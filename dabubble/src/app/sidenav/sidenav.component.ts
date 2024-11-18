import { Component, inject, OnInit } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../shared/services/users.service';
import { Users } from '../../shared/interfaces/users';

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

  users: Users[] = [];

  ngOnInit(): void {
    this.usersService.users$.subscribe((users) => {
      this.users = users;
    });
  }

  changeMenuOpenState() {
    this.menuOpenState = !this.menuOpenState;
  }
}
