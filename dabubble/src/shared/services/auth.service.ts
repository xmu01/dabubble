import { Injectable, signal, computed, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signInWithPopup, signOut, User, GoogleAuthProvider, createUserWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private googleProvider = new GoogleAuthProvider();

  // Signal to store the logged-in user
  private loggedInUser = signal<User | null>(null);

  // Public computed signal for other components/services to use
  public readonly userSignal = computed(() => this.loggedInUser());
  public newUser = signal<User | null>(null);

  private personalDataSignal = signal<any>(null); // Signal für die Daten

  setPersonalData(data: any) {
    this.personalDataSignal.set(data);
  }

  getPersonalData() {
    return this.personalDataSignal();
  }

  watchPersonalData() {
    return this.personalDataSignal; // Reaktive Daten
  }

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
        return result.user;
      })
      .catch((error) => {
        console.error('Google Sign-in failed:', error);
        throw error;
      });
  }
  
  createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        // Benutzerinformationen speichern
        this.newUser.set(userCredential.user);
        return userCredential;
      })
      .catch((error) => {
        console.error('Error creating user:', error);
        throw error; // Fehler weiterwerfen, damit sie im Aufrufer behandelt werden können
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
