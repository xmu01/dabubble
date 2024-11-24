// import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
// import { Auth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, user } from '@angular/fire/auth';
// import { MatCardModule } from '@angular/material/card';
// import { merge, Subscription } from 'rxjs';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
// import {FormControl, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
// import {MatInputModule} from '@angular/material/input';
// import {MatFormFieldModule} from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';


// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [MatCardModule, FormsModule, CommonModule,MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatIconModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss'
// })
// export class LoginComponent {
//   private auth = inject(Auth);
//   private router = inject(Router);
//   provider = new GoogleAuthProvider();
//   email = new FormControl('', [Validators.required, Validators.email]);

//   errorMessage = '';

//   constructor() {
//     merge(this.email.statusChanges, this.email.valueChanges)
//       .pipe(takeUntilDestroyed())
//       .subscribe(() => this.updateErrorMessage());
//   }

//   updateErrorMessage() {
//     if (this.email.hasError('required')) {
//       this.errorMessage = 'You must enter a value';
//     } else if (this.email.hasError('email')) {
//       this.errorMessage = 'Not a valid email';
//     } else {
//       this.errorMessage = '';
//     }
//   }

//   email2 = '';
//   password = '';

//   signIn() {
//     signInWithEmailAndPassword(this.auth, this.email2, this.password)
//       .then(() => {
//         this.router.navigate(['/']);
//         console.log(this.auth.currentUser?.uid);
        
//       })
//       .catch((error) => {
//         console.error('Anmeldung fehlgeschlagen:', error);
//       });
//   }

//   signInWithGoogle() {
//     signInWithPopup(this.auth, this.provider)
//   .then((result) => {
//     // This gives you a Google Access Token. You can use it to access the Google API.
//     const credential = GoogleAuthProvider.credentialFromResult(result);
//     const token = credential?.accessToken;
//     // The signed-in user info.
//     const user = result.user;
//     this.router.navigate(['/']);
//     console.log(result.user.uid);
    

//     // IdP data available using getAdditionalUserInfo(result)
//     // ...
//   }).catch((error) => {
//     // Handle Errors here.
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     // The email of the user's account used.
//     const email = error.customData.email;
//     // The AuthCredential type that was used.
//     const credential = GoogleAuthProvider.credentialFromError(error);
//     // ...
//   });
//   }
// }

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
      })
      .catch((error) => {
        console.error('Error during sign-out:', error);
      });
  }
}
