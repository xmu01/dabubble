import { Component } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MatCardModule, MatSidenavModule, MatButtonModule, MatExpansionModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  panelOpenState = true;
}