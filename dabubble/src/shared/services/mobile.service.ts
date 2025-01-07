import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';

@Injectable({
  providedIn: 'root'
})
export class MobileService {

  constructor() { }

  toggleDrawer(drawer: MatDrawer) {
    drawer.toggle();
  }
}
