import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDialogModule} from '@angular/material/dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatInputModule, MatIconModule,FormsModule, MatFormFieldModule,
    MatExpansionModule, MatDialogModule, 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
