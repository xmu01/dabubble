import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDialogModule} from '@angular/material/dialog';
import { ViewEncapsulation } from '@angular/core'; // Um Angular Mat-Styles zu überschreiben
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';
import { UsersService } from '../../shared/services/users.service';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatInputModule, MatIconModule,FormsModule, MatFormFieldModule,
    MatExpansionModule, MatDialogModule, MatMenuModule, MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  //encapsulation: ViewEncapsulation.None, //Erstmal draußen, da es Probleme im Header gemacht hat (kaputtes Flex)
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private firestoreService = inject(UsersService);

  // Use the signal directly without wrapping it in additional logic
  user = this.authService.userSignal;
  users = this.firestoreService.users;


  signOut() {
    this.firestoreService.updateUserStatus(this.getLoggedUser()!.userId, 'offline')
    this.authService.signOut().catch((error) => {          
      console.error('Error during sign-out:', error);
    });
  }

  getLoggedUser() {
    const user = this.user();
    if (!user) {
      return null; // Kein Benutzer eingeloggt
    }
  
    const userId = user.uid;
    
    return this.users().find(u => u.userId === userId) || null;
  }
}
