import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent, MatIconModule, MatButtonModule, MatInputModule, FormsModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {
  message: string = '';

  getMessage() {
    console.log(this.message);
    this.message = '';
  }
}
