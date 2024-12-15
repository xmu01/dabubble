import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private authService = inject(AuthService);

  email = new FormControl('', [Validators.required, Validators.email]);
  password = '';
  email2 = '';

  errorMessage = '';

  showSplashScreen: boolean = true; // Zeige Splash-Screen beim Start

  ngOnInit() {
    // Entferne Splash-Screen nach 3 Sekunden
    setTimeout(() => {
      this.showSplashScreen = false;
    }, 3000);
  }

  constructor() {}

  updateErrorMessage() {
    if (this.email.hasError('required')) {
      this.errorMessage = 'You must enter a value';
    } else if (this.email.hasError('email')) {
      this.errorMessage = 'Not a valid email';
    } else {
      this.errorMessage = '';
    }
  }

  signIn() {
    this.authService
      .signInWithEmailAndPassword(this.email2, this.password)
      .then((user) => {
        console.log('User signed in:', user.uid);
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
      })
      .catch((error) => {
        this.errorMessage = 'Login failed. Please try again.';
        console.error('Error during login:', error);
      });
  }

  signInWithGoogle() {
    this.authService
      .signInWithGoogle()
      .then((user) => {
        console.log('User signed in with Google:', user.uid);
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
      })
      .catch((error) => {
        this.errorMessage = 'Google Login failed. Please try again.';
        console.error('Error during Google login:', error);
      });
  }

  signOut() {
    this.authService
      .signOut()
      .then(() => {
        console.log('User signed out successfully');
        sessionStorage.removeItem('user');
      })
      .catch((error) => {
        console.error('Error during sign-out:', error);
      });
  }
}
