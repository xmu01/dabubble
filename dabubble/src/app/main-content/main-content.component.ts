import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}
