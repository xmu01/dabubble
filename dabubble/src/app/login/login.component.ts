import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { trigger, transition, style, animate, keyframes, group } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../shared/services/users.service';
import { Router } from '@angular/router';


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
    FormsModule,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],

  animations: [
    // Animation für das Logo und den Text
    trigger('bubbleAnimation', [
      transition(':enter', [
        animate('1.5s ease-in-out', keyframes([
          style({ transform: 'translate(0, 0) scale(1)', offset: 0 }),
          style({ transform: 'translate(-20vw, -20vh) scale(1.2)', offset: 0.5 }),
          style({ transform: 'translate(-40vw, -40vh) scale(1)', offset: 1 })
        ]))
      ])
    ]),
    // Animation für den violetten Hintergrund
    trigger('backgroundFade', [
      transition(':leave', [
        animate('1.5s ease-out', style({ opacity: 0 }))
      ])
    ])
  ]


})
export class LoginComponent {
  private authService = inject(AuthService);
  private userService = inject(UsersService);
  private router = inject(Router);


  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  errorMessage = '';
  hide = true;

  showSplashScreen: boolean = true; // Zeige Splash-Screen beim Start

  onAnimationDone() {
    this.showSplashScreen = false; // Entfernt den Splash-Screen nach der Animation
  }

  ngOnInit() {
    // Entferne Splash-Screen nach 3 Sekunden
    setTimeout(() => {
      this.showSplashScreen = false;
    }, 1500);
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  constructor() {
  }

  signIn(): void {
    if (this.loginForm.valid) {
      const email = this.emailControl?.value ?? '';
      const password = this.passwordControl?.value ?? '';

      this.authService
        .signInWithEmailAndPassword(email, password)
        .then((user) => {
          console.log('User signed in:', user.uid);
          sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
          this.userService.updateUserStatus(user.uid, 'online');
        })
        .catch((error) => {
          this.errorMessage = 'Login failed. Please try again.';
          console.error('Error during login:', error);
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }


  signInWithGoogle() {
    this.authService
      .signInWithGoogle()
      .then((user) => {
        const test = this.userService.loadUser(user.uid);
        if (test == null) {
          const displayName = user.displayName || '';
          const nameParts = displayName.trim().split(' ');
          this.userService.saveNewUser({
            userId: user.uid,
            firstName: nameParts.slice(0, -1).join(' '),
            lastName: nameParts.slice(-1).join(''),
            avatar: 'profile_default.png',
            email: user.email || '',
            status: '',
          })
        }
        console.log('User signed in with Google:', user.uid);
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
        this.userService.updateUserStatus(user.uid, 'online');
        this.router.navigate(['/']);
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
