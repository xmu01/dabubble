import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [SidenavComponent, HeaderComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
