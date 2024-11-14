import { Component } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import { MainContentComponent } from '../main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule ,MatCardModule, MatSidenavModule, MatButtonModule, MatExpansionModule, MainContentComponent, MatIconModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  channelsOpenState = true;
  messagesOpenState = true;
  menuOpenState = true;

  changeMenuOpenState() {
    this.menuOpenState = !this.menuOpenState;
  }
}
