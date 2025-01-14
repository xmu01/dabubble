import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { UsersService } from '../../shared/services/users.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [MatCardModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  private authService = inject(AuthService);
  private userService = inject(UsersService);
  private router = inject(Router);

  personalData = this.authService.watchPersonalData();
  profiles = ["profile1.png", "profile2.png", "profile3.png", "profile4.png", "profile5.png", "profile6.png",]

  back() {
    this.router.navigate(['/sign-up']);
  }

  changeAvatar(profile: string) {
    // Aktualisiere den Avatar in personalData
    const updatedData = { ...this.personalData(), avatar: profile };
    this.authService.setPersonalData(updatedData); // Speichere die aktualisierten Daten im Service
  }


  async completeSignUp() {
    try {
      // Benutzer erstellen und UID abrufen
      const userCredential = await this.authService.createUserWithEmailAndPassword(
        this.personalData().email,
        this.personalData().password
      );
  
      // Benutzer-UID in die Daten einfügen
      const updatedData = {
        ...this.personalData(),
        userId: userCredential.user.uid,
      };
  
      // Benutzer speichern
      await this.userService.saveNewUser(updatedData);
  
      // Navigation nach Login
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during sign-up:', error);
    }
  }
}
