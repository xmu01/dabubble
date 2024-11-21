// import { Component, inject, OnChanges } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { Users } from '../../shared/interfaces/users';
// import { collection, collectionData, doc, Firestore, onSnapshot, query, where } from '@angular/fire/firestore';
// import { CommonModule } from '@angular/common';
// import { User } from '@angular/fire/auth';

// @Component({
//   selector: 'app-privacy-policy',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './privacy-policy.component.html',
//   styleUrl: './privacy-policy.component.scss'
// })
// export class PrivacyPolicyComponent implements OnChanges {
//   private firestore: Firestore = inject(Firestore); // inject Cloud Firestore
//   users: Users[] = [];
//   user: Users[] = [];
//   activeId: string = 'MOkjhWRdC97Pc5LM2vnz';

//   constructor() {
//     this.loadUsers();
//     this.loadUser();
//   }

//   ngOnChanges() {
    

//   }

//   async loadUsers() {
//     const q = query(collection(this.firestore, "users"));
//     const unsubscribe = onSnapshot(q, (querySnapshot) => {
//       this.users = [];
//       querySnapshot.forEach((doc) => {
//         this.users.push(this.setUserObject(doc.data(), doc.id));
//       });
//       console.log(this.users);
//     });

//     return () => unsubscribe();
//   }

//   async loadUser() {
//     const unsub = onSnapshot(doc(this.firestore, "users", this.activeId), (doc) => {
//       this.user = [];
//         this.user.push(this.setUserObject(doc.data(), doc.id));
//       console.log(this.user);
//   });
//     return () => unsub();
//   }

//   private setUserObject(obj: any, id: string): Users {
//     return {
//       userId: id,
//       firstName: obj.firstName || "",
//       lastName: obj.lastName || "",
//       avatar: obj.avatar || "",
//       email: obj.email || ""
//     };
//   }

//   getId(id:string) {
//     this.activeId = id;
//     console.log(this.activeId);
//     this.loadUser();
//   }

// }

// import { Component, inject, OnInit } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { Users } from '../../shared/interfaces/users';
// import { collection, collectionData, doc, Firestore, onSnapshot, query } from '@angular/fire/firestore';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-privacy-policy',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './privacy-policy.component.html',
//   styleUrls: ['./privacy-policy.component.scss']
// })
// export class PrivacyPolicyComponent implements OnInit {
//   private firestore: Firestore = inject(Firestore); // Inject Cloud Firestore

//   // BehaviorSubjects for managing user data streams
//   private usersSubject = new BehaviorSubject<Users[]>([]);
//   users$: Observable<Users[]> = this.usersSubject.asObservable();

//   private userSubject = new BehaviorSubject<Users | null>(null);
//   user$: Observable<Users | null> = this.userSubject.asObservable();

//   activeId: string | null = null;;

//   ngOnInit() {
//     this.loadUsers();
//     this.loadUser();
//   }

//   /**
//    * Loads all users from Firestore and updates the users stream.
//    */
//   loadUsers() {
//     const usersQuery = query(collection(this.firestore, 'users'));
//     onSnapshot(usersQuery, (querySnapshot) => {
//       const users = querySnapshot.docs.map((doc) => this.setUserObject(doc.data(), doc.id));
//       this.usersSubject.next(users);
//     }, (error) => console.error('Error loading users:', error));
//   }

//   /**
//    * Loads the currently active user from Firestore and updates the user stream.
//    */
//   loadUser() {
//     if (this.activeId) {
//       onSnapshot(doc(this.firestore, 'users', this.activeId), (doc) => {
//         if (doc.exists()) {
//           this.userSubject.next(this.setUserObject(doc.data(), doc.id));
//         }
//       }, (error) => console.error('Error loading active user:', error));
//     } else {
//       this.userSubject.next(null); // Kein aktiver Benutzer
//     }
//   }

//   /**
//    * Updates the active user ID and reloads the corresponding user data.
//    * @param id - The ID of the user to activate.
//    */
//   getId(id: string) {
//     this.activeId = id;
//     console.log('Active ID updated to:', this.activeId);
//     this.loadUser();
//   }

//   /**
//    * Converts Firestore document data into a Users object.
//    * @param obj - Firestore document data.
//    * @param id - Firestore document ID.
//    * @returns A Users object.
//    */
//   private setUserObject(obj: any, id: string): Users {
//     return {
//       userId: id,
//       firstName: obj.firstName || '',
//       lastName: obj.lastName || '',
//       avatar: obj.avatar || '',
//       email: obj.email || ''
//     };
//   }
// }

import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { Users } from '../../shared/interfaces/users';
import { collection, doc, Firestore, onSnapshot, query } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {
  private firestore: Firestore = inject(Firestore); // Inject Cloud Firestore

  users = signal<Users[]>([]); // Signal to store the list of all users
  activeUser = signal<Users | null>(null); // Signal to store the currently active user
  activeId = signal<string | null>(null); // Signal to store the current active ID

  constructor() {
    // Effect to trigger loading of the active user without writing to signals directly
    effect(() => {
      const id = this.activeId();
      if (id) {
        this.triggerLoadUser(id);
      }
    });
  }

  ngOnInit() {
    this.loadUsers(); // Load all users on component initialization
  }

  /**
   * Loads all users from Firestore and updates the users signal.
   */
  loadUsers() {
    const usersQuery = query(collection(this.firestore, 'users'));
    onSnapshot(usersQuery, (querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => this.setUserObject(doc.data(), doc.id));
      this.users.set(users); // Update the users signal
    }, (error) => console.error('Error loading users:', error));
  }

  /**
   * Triggers the process to load a user by ID and updates the activeUser signal outside of an effect.
   * @param userId - The ID of the user to load.
   */
  triggerLoadUser(userId: string) {
    onSnapshot(doc(this.firestore, 'users', userId), (doc) => {
      if (doc.exists()) {
        this.activeUser.set(this.setUserObject(doc.data(), doc.id)); // Update the activeUser signal
      }
    }, (error) => console.error('Error loading active user:', error));
  }

  /**
   * Updates the active user ID.
   * @param id - The ID of the user to activate.
   */
  getId(id: string) {
    this.activeId.set(id); // Set the new active ID
    console.log('Active ID updated to:', id);
  }

  /**
   * Converts Firestore document data into a Users object.
   * @param obj - Firestore document data.
   * @param id - Firestore document ID.
   * @returns A Users object.
   */
  private setUserObject(obj: any, id: string): Users {
    return {
      userId: id,
      firstName: obj.firstName || '',
      lastName: obj.lastName || '',
      avatar: obj.avatar || '',
      email: obj.email || ''
    };
  }
}
