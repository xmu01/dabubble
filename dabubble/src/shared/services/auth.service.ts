import { Injectable, signal, computed, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signInWithPopup, signOut, User, GoogleAuthProvider } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private userService = inject(UsersService);
  private googleProvider = new GoogleAuthProvider();

  // Signal to store the logged-in user
  private loggedInUser = signal<User | null>(null);

  // Public computed signal for other components/services to use
  public readonly userSignal = computed(() => this.loggedInUser());

  constructor() {
    // Listen to auth state changes (optional if Firebase Auth State listener is used elsewhere)
    this.auth.onAuthStateChanged((user) => {
      this.loggedInUser.set(user);
    });
  }

  signInWithEmailAndPassword(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.loggedInUser.set(userCredential.user);
        this.router.navigate(['/']);
        this.userService.updateUserStatus(userCredential.user.uid, 'online');
        return userCredential.user;
      })
      .catch((error) => {
        console.error('Sign-in failed:', error);
        throw error;
      });
  }

  signInWithGoogle() {
    return signInWithPopup(this.auth, this.googleProvider)
      .then((result) => {
        this.loggedInUser.set(result.user);
        this.router.navigate(['/']);
        this.userService.updateUserStatus(result.user.uid, 'online');
        return result.user;
      })
      .catch((error) => {
        console.error('Google Sign-in failed:', error);
        throw error;
      });
  }

  signOut() {
    return signOut(this.auth)
      .then(() => {
        this.loggedInUser.set(null);
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Sign-out failed:', error);
        throw error;
      });
  }

  getLoggedInUser() {
    return this.loggedInUser();
  }

}
