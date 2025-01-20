import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { trigger, transition, style, animate, keyframes, group, query, sequence, state } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../shared/services/users.service';
import { Router, RouterLink } from '@angular/router';


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
    MatButtonModule,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],

  animations: [
    trigger('logoAnimation', [
      transition(':enter', [
        animate('0.8s ease-out', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-100px)', offset: 1 }),
        ])),
      ]),
    ]),
    trigger('textAnimation', [
      transition(':enter', [
        sequence([
          // 2. Text erscheint und fährt von links nach rechts
          style({ opacity: 0, transform: 'translateX(-50%)' }), // Startposition
          animate('1s ease-out', style({ opacity: 1, transform: 'translateX(-80px)' })),
        ]),
      ]),
    ]),
    trigger('finalMoveAnimation', [
      state('initial', style({ transform: 'translate(0, 0)', opacity: 1 })),
      state('moved', style({ transform: 'translate(-42vw, -48vh)', opacity: 0 })),
      transition('initial => moved', [
        animate('1s 1s ease-in-out')
      ]),
    ]),
    // Logo-Größenänderung
    trigger('logoResizeAnimation', [
      state('initial', style({ })),
      state('moved', style({ width: '70px' })),
      transition('initial => moved', animate('0.8s ease-in-out')),
    ]),

    // Text-Stil-Änderung
    trigger('textStyleAnimation', [
      state('initial', style({ color: '#fff' })),
      state('moved', style({ fontSize: '1.5rem', color: '#000' })),
      transition('initial => moved', animate('0.8s ease-in-out')),
    ]),
    // Animation für den violetten Hintergrund
    trigger('backgroundFade', [
      transition(':leave', [
        animate('0.3s 3.5s ease-out', style({ opacity: 0 }))
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

  showSplashScreen: boolean = true;

  textVisible = false;
  moveToCorner = false;

  onLogoAnimationDone() {
    this.textVisible = true;
  }

  onTextAnimationDone() {
      this.moveToCorner = true;
  }

  onFinalMoveDone() {
      this.showSplashScreen = false; 
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
          this.userService.updateUserStatus(user.uid, 'online');
          sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
          this.router.navigate(['/']);
        })
        .catch((error) => {
          this.errorMessage = 'Login failed. Please try again.';
          console.error('Error during login:', error);
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  loginGuest() {
      this.authService
        .signInWithEmailAndPassword('gast@dabubble.de', '123456789')
        .then((user) => {
          this.userService.updateUserStatus(user.uid, 'online');
          sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
          this.router.navigate(['/']);
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
        this.userService.updateUserStatus(user.uid, 'online');
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid }));
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
      })
      .catch((error) => {
        console.error('Error during sign-out:', error);
      });
  }
}
