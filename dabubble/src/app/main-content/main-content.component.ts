import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ThreadComponent } from '../thread/thread.component';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatCardModule, ThreadComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}
